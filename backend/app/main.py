import os
import secrets
from datetime import datetime
from typing import Annotated
from dotenv import load_dotenv

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, UploadFile, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import firebase_admin
from firebase_admin import credentials, firestore

# Load environment variables
load_dotenv()

app = FastAPI(title="RupeeFlow Receipt Extractor")

BACKEND_API_SECRET = os.getenv("BACKEND_API_SECRET")


def verify_backend_api_secret(
    authorization: Annotated[str | None, Header()] = None,
) -> None:
    if not BACKEND_API_SECRET:
        if os.getenv("VERCEL"):
            raise HTTPException(
                status_code=503,
                detail="Backend API secret is not configured.",
            )
        return

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")

    token = authorization.removeprefix("Bearer ")
    if not secrets.compare_digest(token, BACKEND_API_SECRET):
        raise HTTPException(status_code=401, detail="Unauthorized")


# Configure CORS
frontend_origins = os.getenv("FRONTEND_ORIGINS")
if frontend_origins:
    origins = [o.strip() for o in frontend_origins.split(",") if o.strip()]
else:
    origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Firebase
try:
    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "./firebase-credentials.json")
    firebase_creds_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
    if firebase_creds_json:
        import json

        cred_dict = json.loads(firebase_creds_json)
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
    elif os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
    else:
        print(f"⚠️  Firebase credentials not found. Set FIREBASE_CREDENTIALS_JSON or provide a file at {cred_path}")
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
    created_at: str | None = None


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
    _: Annotated[None, Depends(verify_backend_api_secret)] = None,
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
async def save_receipt(
    receipt: SaveReceiptRequest,
    _: Annotated[None, Depends(verify_backend_api_secret)] = None,
) -> dict:
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
        "created_at": receipt.created_at or datetime.utcnow().isoformat(),
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
async def get_receipts(
    userEmail: str = Query(...),
    _: Annotated[None, Depends(verify_backend_api_secret)] = None,
) -> dict:
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
