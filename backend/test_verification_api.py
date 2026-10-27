import io
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from PIL import Image

from verification_api import create_app


def make_pdf():
    pdf = io.BytesIO()
    Image.new("RGB", (32, 32), "white").save(pdf, format="PDF")
    return pdf.getvalue()


class VerificationApiTests(unittest.TestCase):
    def setUp(self):
        self.temp_directory = tempfile.TemporaryDirectory()
        self.reference_root = Path(self.temp_directory.name)
        self.app = create_app(self.reference_root)
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

    def tearDown(self):
        self.temp_directory.cleanup()

    def test_health_endpoint(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json, {"status": "ok"})

    def test_lists_reference_slots_for_each_document_type(self):
        response = self.client.get("/documents/references")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            set(response.json),
            {"marksheet10", "marksheet12", "jeeResult", "tc", "domicile"},
        )
        self.assertEqual(response.json["marksheet12"], [])

    def test_uploads_reference_to_its_document_type(self):
        response = self.client.post(
            "/documents/references",
            data={
                "documentType": "marksheet12",
                "file": (io.BytesIO(make_pdf()), "source.pdf"),
            },
            content_type="multipart/form-data",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json["documentType"], "marksheet12")
        self.assertEqual(response.json["displayName"], "source.pdf")

        listed = self.client.get("/documents/references")
        self.assertEqual(len(listed.json["marksheet12"]), 1)
        self.assertEqual(listed.json["marksheet10"], [])

    def test_deletes_reference_from_its_document_type(self):
        reference_directory = self.reference_root / "marksheet12"
        reference_directory.mkdir()
        filename = "reference-id-source.pdf"
        (reference_directory / filename).write_bytes(make_pdf())

        response = self.client.delete(
            f"/documents/references/marksheet12/{filename}"
        )
        self.assertEqual(response.status_code, 200)
        self.assertFalse((reference_directory / filename).exists())

    def test_rejects_unsupported_document_type(self):
        response = self.client.post(
            "/documents/verify",
            data={
                "documentType": "unknown",
                "file": (io.BytesIO(b"%PDF-1.4"), "marksheet.pdf"),
            },
            content_type="multipart/form-data",
        )
        self.assertEqual(response.status_code, 400)

    def test_rejects_image_references_for_jee(self):
        response = self.client.post(
            "/documents/references",
            data={
                "documentType": "jeeResult",
                "file": (io.BytesIO(b"image"), "reference.jpg"),
            },
            content_type="multipart/form-data",
        )
        self.assertEqual(response.status_code, 400)

    def test_reports_missing_reference_without_claiming_verification(self):
        response = self.client.post(
            "/documents/verify",
            data={
                "documentType": "marksheet12",
                "file": (io.BytesIO(make_pdf()), "marksheet.pdf"),
            },
            content_type="multipart/form-data",
        )
        self.assertEqual(response.status_code, 201)
        result = self.client.get(
            f"/documents/result/{response.json['id']}"
        )
        self.assertEqual(result.json["outcome"], "no_reference")

    def test_compares_ocr_text_with_configured_reference(self):
        reference_directory = self.reference_root / "marksheet12"
        reference_directory.mkdir()
        (reference_directory / "genuine.pdf").write_bytes(make_pdf())

        matching_text = "Class XII Marksheet Student Name Roll Number Total Marks"
        with patch(
            "verification_api._extract_text",
            side_effect=[matching_text, matching_text],
        ):
            response = self.client.post(
                "/documents/verify",
                data={
                    "documentType": "marksheet12",
                    "file": (io.BytesIO(make_pdf()), "marksheet.pdf"),
                },
                content_type="multipart/form-data",
            )

        result = self.client.get(
            f"/documents/result/{response.json['id']}"
        )
        self.assertEqual(result.json["outcome"], "reference_match")
        self.assertEqual(result.json["similarity"], 1.0)

    def test_reports_no_match_below_similarity_threshold(self):
        reference_directory = self.reference_root / "marksheet12"
        reference_directory.mkdir()
        (reference_directory / "genuine.pdf").write_bytes(make_pdf())

        with patch(
            "verification_api._extract_text",
            side_effect=[
                "Class XII Marksheet Student Name Roll Number Total Marks",
                "University Entrance Examination Candidate Rank Test Center",
            ],
        ):
            response = self.client.post(
                "/documents/verify",
                data={
                    "documentType": "marksheet12",
                    "file": (io.BytesIO(make_pdf()), "marksheet.pdf"),
                },
                content_type="multipart/form-data",
            )

        result = self.client.get(f"/documents/result/{response.json['id']}")
        self.assertEqual(result.json["outcome"], "no_match")
        self.assertLess(result.json["similarity"], 0.9)

    def test_rejects_invalid_pdf_bytes(self):
        response = self.client.post(
            "/documents/verify",
            data={
                "documentType": "marksheet12",
                "file": (io.BytesIO(b"not a pdf"), "marksheet.pdf"),
            },
            content_type="multipart/form-data",
        )
        self.assertEqual(response.status_code, 400)

    def test_rejects_unreadable_pdf_reference(self):
        response = self.client.post(
            "/documents/references",
            data={
                "documentType": "marksheet12",
                "file": (io.BytesIO(b"%PDF-1.4 broken"), "source.pdf"),
            },
            content_type="multipart/form-data",
        )
        self.assertEqual(response.status_code, 400)


if __name__ == "__main__":
    unittest.main()
