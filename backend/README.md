# Expense Tracker Backend

FastAPI service for receipt extraction with Firebase Firestore integration.

## Features

- Receives one uploaded PDF/image file from frontend for extraction
- Processes receipt email body
- Authenticates via Google Sign-in (forwarded from Next.js)
- Saves reviewed receipt line items and totals to Firebase Firestore
- Real-time database collection per user

## Setup Firestore Connection

### 1. Get Firebase Credentials

Go to [Firebase Console](https://console.firebase.google.com/):

1. Select your project: **expense-tracker-b24e4**
2. Navigate to: **Project Settings** (gear icon) → **Service Accounts**
3. Click **Generate New Private Key**
4. Save the JSON file as `firebase-credentials.json` in the `backend/` folder

⚠️ **Never commit this file!** It's already in `.gitignore`

### 2. Set Up Environment

```bash
cd backend
cp .env.example .env
```

The `.env` file already has your project ID configured.

### 3. Install Dependencies & Run

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 4. Configure Frontend

The frontend should point to:

```env
RECEIPT_EXTRACTOR_API_URL=http://localhost:8000/extract-receipt
```

## API Endpoints

### Health Check
```
GET /health
```

### Extract Receipt
```
POST /extract-receipt
```

**Request:**
- `files` (File): one PDF/image file
- `emailBody` (Form): Receipt email text
- `userEmail` (Form): Authenticated user email

**Response:**
```json
{
  "status": "extracted",
  "userEmail": "user@example.com",
  "receiptName": "receipt.pdf",
  "emailBody": {...},
  "extractedReceipt": {
    "items": [
      { "item": "Basmati rice 5kg", "quantity": "1", "amount": "3250" }
    ],
    "totals": {
      "subtotal": "6500",
      "discount": "250",
      "tax": "0",
      "serviceCharge": "0",
      "deliveryFee": "0",
      "total": "6250"
    }
  }
}
```

### Save Reviewed Receipt
```
POST /receipts
```

**Request:**
```json
{
  "userEmail": "user@example.com",
  "items": [
    { "item": "Basmati rice 5kg", "quantity": "1", "amount": "3250" }
  ],
  "totals": {
    "subtotal": "6500",
    "discount": "250",
    "tax": "0",
    "serviceCharge": "0",
    "deliveryFee": "0",
    "total": "6250"
  }
}
```

## Firestore Structure

Receipts are saved in:
```
users/
  {userEmail}/
    receipts/
      {auto_id}
```

Each receipt document contains the reviewed line items, totals, timestamp, and display fields. Uploaded file bytes, file metadata, and file counts are not saved in Firestore.
