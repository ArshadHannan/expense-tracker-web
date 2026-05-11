# Expense Tracker Backend

Small FastAPI service for receipt extraction experiments.

For now, `/extract-receipt` only confirms what the frontend sent:

- uploaded PDF/image files
- pasted receipt email body
- authenticated user email forwarded by the Next.js API route

## Run locally

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The frontend should point to:

```env
RECEIPT_EXTRACTOR_API_URL=http://localhost:8000/extract-receipt
```
