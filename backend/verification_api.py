import re
import threading
import uuid
from difflib import SequenceMatcher
from pathlib import Path

import cv2
import easyocr
import numpy as np
import pypdfium2 as pdfium
from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.utils import secure_filename

MAX_UPLOAD_BYTES = 15 * 1024 * 1024
MAX_PDF_PAGES = 5
MATCH_THRESHOLD = 0.9
DOCUMENT_TYPES = {
    "marksheet10": "10th Marksheet",
    "marksheet12": "12th Marksheet",
    "jeeResult": "JEE Result",
    "tc": "Transfer Certificate",
    "domicile": "Domicile Certificate",
}
SUPPORTED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}

_ocr_reader = None
_ocr_lock = threading.Lock()


def _get_ocr_reader():
    global _ocr_reader

    if _ocr_reader is None:
        _ocr_reader = easyocr.Reader(["en"], gpu=False)
    return _ocr_reader


def _extract_text(file_bytes, extension):
    reader = _get_ocr_reader()

    if extension == ".pdf":
        pdf = pdfium.PdfDocument(file_bytes)
        pages = []
        for page_index in range(min(len(pdf), MAX_PDF_PAGES)):
            page = pdf[page_index]
            bitmap = page.render(scale=2)
            image = np.asarray(bitmap.to_pil())
            pages.extend(reader.readtext(image, detail=0))
            bitmap.close()
            page.close()
        pdf.close()
        return " ".join(text.strip() for text in pages if text.strip())

    image = cv2.imdecode(np.frombuffer(file_bytes, dtype=np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        return ""

    return " ".join(
        text.strip()
        for text in reader.readtext(image, detail=0)
        if text.strip()
    )


def _normalized_text(text):
    return re.sub(r"[^a-z0-9]", "", text.casefold())


def _is_valid_document(file_bytes, extension):
    if extension == ".pdf":
        try:
            pdf = pdfium.PdfDocument(file_bytes)
            has_pages = len(pdf) > 0
            pdf.close()
            return has_pages
        except pdfium.PdfiumError:
            return False

    return cv2.imdecode(
        np.frombuffer(file_bytes, dtype=np.uint8), cv2.IMREAD_COLOR
    ) is not None


def _json_error(message, status):
    return jsonify({"error": message}), status


def create_app(reference_root=None):
    app = Flask(__name__)
    app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_BYTES
    app.config["REFERENCE_ROOT"] = Path(
        reference_root or Path(__file__).parent / "references"
    )
    app.config["VERIFICATION_RESULTS"] = {}
    CORS(
        app,
        resources={
            r"/*": {
                "origins": [
                    "http://localhost:5173",
                    "http://127.0.0.1:5173",
                ]
            }
        },
    )

    @app.errorhandler(413)
    def file_too_large(_error):
        return _json_error("File exceeds the 15 MB upload limit.", 413)

    @app.get("/health")
    def health():
        return jsonify({"status": "ok"})

    @app.get("/documents/references")
    def list_reference_documents():
        references = {}
        reference_root = app.config["REFERENCE_ROOT"]

        for document_type in DOCUMENT_TYPES:
            directory = reference_root / document_type
            files = (
                sorted(
                    path
                    for path in directory.iterdir()
                    if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS
                )
                if directory.is_dir()
                else []
            )
            references[document_type] = [
                {
                    "filename": path.name,
                    "displayName": path.name.split("-", 1)[-1],
                }
                for path in files
            ]

        return jsonify(references)

    @app.post("/documents/references")
    def upload_reference_document():
        uploaded_file = request.files.get("file")
        document_type = request.form.get("documentType", "")

        if document_type not in DOCUMENT_TYPES:
            return _json_error("Select a supported document type.", 400)
        if uploaded_file is None or not uploaded_file.filename:
            return _json_error("Choose a reference document to upload.", 400)

        extension = Path(uploaded_file.filename).suffix.lower()
        if extension not in SUPPORTED_EXTENSIONS:
            return _json_error("Upload a PDF, JPG, JPEG, or PNG reference.", 400)
        if document_type == "jeeResult" and extension != ".pdf":
            return _json_error("JEE Result references must be PDF files.", 400)

        file_bytes = uploaded_file.read(MAX_UPLOAD_BYTES + 1)
        if len(file_bytes) > MAX_UPLOAD_BYTES:
            return _json_error("File exceeds the 15 MB upload limit.", 413)
        if not _is_valid_document(file_bytes, extension):
            if extension == ".pdf":
                return _json_error("The selected file is not a readable PDF.", 400)
            return _json_error("The selected file is not a readable image.", 400)

        display_name = secure_filename(uploaded_file.filename) or f"reference{extension}"
        stored_name = f"{uuid.uuid4().hex}-{display_name}"
        reference_directory = app.config["REFERENCE_ROOT"] / document_type
        reference_directory.mkdir(parents=True, exist_ok=True)
        (reference_directory / stored_name).write_bytes(file_bytes)

        return jsonify(
            {
                "documentType": document_type,
                "filename": stored_name,
                "displayName": display_name,
            }
        ), 201

    @app.delete("/documents/references/<document_type>/<filename>")
    def delete_reference_document(document_type, filename):
        if document_type not in DOCUMENT_TYPES:
            return _json_error("Unknown document type.", 404)

        safe_filename = secure_filename(filename)
        if safe_filename != filename or Path(filename).name != filename:
            return _json_error("Invalid reference document name.", 400)

        reference_path = (
            app.config["REFERENCE_ROOT"] / document_type / safe_filename
        )
        if not reference_path.is_file():
            return _json_error("Reference document not found.", 404)

        reference_path.unlink()
        return jsonify({"deleted": True})

    @app.post("/documents/verify")
    def verify_document():
        uploaded_file = request.files.get("file")
        document_type = request.form.get("documentType", "")

        if document_type not in DOCUMENT_TYPES:
            return _json_error("Select a supported document type.", 400)
        if uploaded_file is None or not uploaded_file.filename:
            return _json_error("Choose a document to compare.", 400)

        extension = Path(uploaded_file.filename).suffix.lower()
        if extension not in SUPPORTED_EXTENSIONS:
            return _json_error("Upload a PDF, JPG, JPEG, or PNG document.", 400)
        if document_type == "jeeResult" and extension != ".pdf":
            return _json_error("JEE Result documents must be PDF files.", 400)

        file_bytes = uploaded_file.read(MAX_UPLOAD_BYTES + 1)
        if len(file_bytes) > MAX_UPLOAD_BYTES:
            return _json_error("File exceeds the 15 MB upload limit.", 413)
        if not _is_valid_document(file_bytes, extension):
            if extension == ".pdf":
                return _json_error("The selected file is not a readable PDF.", 400)
            return _json_error("The selected file is not a readable image.", 400)

        reference_directory = app.config["REFERENCE_ROOT"] / document_type
        references = sorted(
            path
            for path in reference_directory.glob("*")
            if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS
        ) if reference_directory.is_dir() else []

        result = {
            "documentType": document_type,
            "documentTypeName": DOCUMENT_TYPES[document_type],
            "similarity": None,
        }

        if not references:
            result.update(
                outcome="no_reference",
                outcomeLabel="No reference document configured",
                message=(
                    f"Add a genuine matching {DOCUMENT_TYPES[document_type]} to "
                    f"backend/references/{document_type}/ and try again."
                ),
            )
        else:
            with _ocr_lock:
                submitted_text = _normalized_text(_extract_text(file_bytes, extension))
                if len(submitted_text) < 30:
                    result.update(
                        outcome="unreadable",
                        outcomeLabel="Document text could not be read",
                        message=(
                            "OCR could not extract enough text. Try a clearer, "
                            "straight-on scan or image."
                        ),
                    )
                else:
                    similarities = []
                    for reference in references:
                        reference_text = _normalized_text(
                            _extract_text(reference.read_bytes(), reference.suffix.lower())
                        )
                        if len(reference_text) >= 30:
                            similarities.append(
                                SequenceMatcher(
                                    None, submitted_text, reference_text
                                ).ratio()
                            )

                    if not similarities:
                        return _json_error(
                            "No readable reference documents were found. Check the configured reference files.",
                            500,
                        )

                    similarity = max(similarities)
                    matched = similarity >= MATCH_THRESHOLD
                    result.update(
                        outcome="reference_match" if matched else "no_match",
                        outcomeLabel=(
                            "Reference text match found"
                            if matched
                            else "No close reference text match"
                        ),
                        message=(
                            "The extracted text closely matches a configured reference document."
                            if matched
                            else "The extracted text does not closely match any configured reference document."
                        ),
                        similarity=similarity,
                    )

        result_id = str(uuid.uuid4())
        result["id"] = result_id
        results = app.config["VERIFICATION_RESULTS"]
        if len(results) >= 200:
            results.pop(next(iter(results)))
        results[result_id] = result
        return jsonify({"id": result_id}), 201

    @app.get("/documents/result/<result_id>")
    def get_result(result_id):
        result = app.config["VERIFICATION_RESULTS"].get(result_id)
        if result is None:
            return _json_error("Result not found. Upload the document again.", 404)
        return jsonify(result)

    return app
