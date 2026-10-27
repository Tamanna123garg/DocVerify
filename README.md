# DocVerify

A local React/Vite app with a Flask OCR service for comparing uploaded documents
against genuine reference documents. This comparison is a development aid; a text
match does not establish official authenticity.

## Requirements

- Node.js and npm
- Python 3.10 or newer

## Run locally

Install the backend dependencies and start the API:

```powershell
python -m pip install -r backend\requirements.txt
python backend\run.py
```

In a second terminal, install frontend dependencies and start Vite:

```powershell
npm install
npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173`). The frontend
uses `http://127.0.0.1:5000` by default. Set `VITE_API_BASE_URL` before starting
Vite to use a different API URL.

## Configure reference documents

Open the Upload page and add genuine documents in the **Reference documents by
type** section. Each category has its own reference list; documents are stored
locally under `backend/references/<document-type>/`. You can add multiple
references per category or remove an outdated one.

Reference folders for other document types use these names:
`marksheet10`, `marksheet12`, `jeeResult`, `tc`, and `domicile`. If a folder
has no supported reference file, the app reports that comparison could not be
performed. Supported formats are PDF, JPG, JPEG, and PNG; JEE references must
be PDF. The uploaded document should correspond to the same record; the service
compares OCR-extracted text and reports similarity, not official authenticity.
Reference files are excluded from source control by `.gitignore`.

The first OCR request may take longer while EasyOCR initializes or downloads
its language model. Documents submitted for comparison are processed in memory
and are not saved by the API; reference documents are saved locally so they
remain available across restarts. The service accepts files up to 15 MB and
reads up to five pages from a PDF.

## Checks

```powershell
npm run lint
npm run build
python -m unittest discover -s backend
```
