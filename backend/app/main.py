import os
from datetime import datetime
from typing import Annotated
from dotenv import load_dotenv

from fastapi import FastAPI, File, Form, UploadFile, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import firebase_admin
from firebase_admin import credentials, firestore

# Load environment variables
load_dotenv()

app = FastAPI(title="Expense Tracker Receipt Extractor")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Firebase
try:
    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "./firebase-credentials.json")
    if os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
    else:
        print(f"⚠️  Firebase credentials not found at {cred_path}")
        db = None
except Exception as e:
    print(f"⚠️  Firebase initialization failed: {e}")
    db = None


class ReceiptItem(BaseModel):
    item: str
    quantity: str
    amount: str


class ReceiptTotals(BaseModel):
    subtotal: str
    discount: str
    tax: str
    serviceCharge: str
    deliveryFee: str
    total: str


class SaveReceiptRequest(BaseModel):
    userEmail: str
    storeName: str
    items: list[ReceiptItem]
    totals: ReceiptTotals


FAKE_EXTRACTED_RECEIPT = {
    "storeName": "Keells Super",
    "items": [
        {"item": "Basmati rice 5kg", "quantity": "1", "amount": "3250"},
        {"item": "Fresh milk 1L", "quantity": "2", "amount": "1080"},
        {"item": "Vegetables bundle", "quantity": "1", "amount": "1450"},
        {"item": "Dishwashing liquid", "quantity": "1", "amount": "720"},
    ],
    "totals": {
        "subtotal": "6500",
        "discount": "250",
        "tax": "0",
        "serviceCharge": "0",
        "deliveryFee": "0",
        "total": "6250",
    },
}


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/extract-receipt")
async def extract_receipt(
    files: Annotated[list[UploadFile] | None, File()] = None,
    emailBody: Annotated[str, Form()] = "",
    userEmail: Annotated[str, Form()] = "",
) -> dict:
    uploaded_files = files or []

    if len(uploaded_files) > 1:
        return JSONResponse(
            {"error": "Only one receipt can be uploaded at a time."},
            status_code=400,
        )

    for file in uploaded_files:
        await file.read()

    return {
        "status": "extracted",
        "userEmail": userEmail,
        "receiptName": uploaded_files[0].filename if uploaded_files else "Email Receipt",
        "emailBody": {
            "received": bool(emailBody.strip()),
            "characterCount": len(emailBody),
            "preview": emailBody[:300],
        },
        "extractedReceipt": FAKE_EXTRACTED_RECEIPT,
    }


@app.post("/receipts")
async def save_receipt(receipt: SaveReceiptRequest) -> dict:
    if not db:
        return JSONResponse(
            {"error": "Firebase not initialized", "saved_to_firestore": False},
            status_code=500,
        )

    if not receipt.userEmail:
        return JSONResponse(
            {"error": "User email required", "saved_to_firestore": False},
            status_code=400,
        )

    receipt_items = [item.model_dump() for item in receipt.items]
    receipt_totals = receipt.totals.model_dump()
    total_amount_value = parse_amount(receipt_totals["total"])
    receipt_data = {
        "status": "saved",
        "userEmail": receipt.userEmail,
        "items": receipt_items,
        "totals": receipt_totals,
        "created_at": datetime.utcnow().isoformat(),
        "store_name": receipt.storeName,
        "type": "Receipt",
        "total_amount": receipt_totals["total"],
        "total_amount_value": total_amount_value,
    }

    try:
        db.collection("users").document(receipt.userEmail).collection("receipts").add(
            receipt_data
        )
        db.collection("users").document(receipt.userEmail).set(
            {"total_spent": firestore.Increment(total_amount_value)},
            merge=True,
        )
        receipt_data["saved_to_firestore"] = True
        return receipt_data
    except Exception as e:
        print(f"Error saving to Firestore: {e}")
        return JSONResponse(
            {
                "error": str(e),
                "saved_to_firestore": False,
            },
            status_code=500,
        )


def parse_amount(value: str) -> float:
    try:
        return float(value.replace(",", "").strip())
    except ValueError:
        return 0


@app.get("/receipts")
async def get_receipts(userEmail: str = Query(...)) -> dict:
    """Fetch all receipts for a user, sorted by date (newest first)"""
    if not db:
        return JSONResponse(
            {"error": "Firebase not initialized", "receipts": []}, status_code=500
        )

    if not userEmail:
        return JSONResponse(
            {"error": "User email required", "receipts": []}, status_code=400
        )

    try:
        receipts_ref = (
            db.collection("users")
            .document(userEmail)
            .collection("receipts")
            .order_by("created_at", direction="DESCENDING")
            .stream()
        )

        receipts = []
        for doc in receipts_ref:
            receipt = doc.to_dict()
            receipt["id"] = doc.id
            receipts.append(receipt)

        user_doc = db.collection("users").document(userEmail).get()
        user_data = user_doc.to_dict() or {}
        total_spent = user_data.get("total_spent", 0)

        return {
            "status": "success",
            "count": len(receipts),
            "receipts": receipts,
            "total_spent": total_spent,
        }
    except Exception as e:
        print(f"Error fetching receipts: {e}")
        return JSONResponse(
            {"error": str(e), "receipts": []}, status_code=500
        )
