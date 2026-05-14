import os
import json
from datetime import datetime
from typing import Annotated
from dotenv import load_dotenv

from fastapi import FastAPI, File, Form, UploadFile, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
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


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/extract-receipt")
async def extract_receipt(
    files: Annotated[list[UploadFile] | None, File()] = None,
    emailBody: Annotated[str, Form()] = "",
    userEmail: Annotated[str, Form()] = "",
) -> dict:
    uploaded_files = []

    for file in files or []:
        content = await file.read()
        uploaded_files.append(
            {
                "filename": file.filename,
                "content_type": file.content_type,
                "size_bytes": len(content),
            }
        )

    receipt_data = {
        "status": "received",
        "userEmail": userEmail,
        "fileCount": len(uploaded_files),
        "files": uploaded_files,
        "emailBody": {
            "received": bool(emailBody.strip()),
            "characterCount": len(emailBody),
            "preview": emailBody[:300],
        },
        "created_at": datetime.utcnow().isoformat(),
        "total_amount": "1000 Rs",
        "total_amount_value": 1000,
    }

    if uploaded_files:
        receipt_data["expense_name"] = uploaded_files[0]["filename"]
        content_type = uploaded_files[0]["content_type"]
        if content_type == "application/pdf":
            receipt_data["type"] = "PDF"
        else:
            receipt_data["type"] = "Image"
    else:
        receipt_data["expense_name"] = "Email Receipt"
        receipt_data["type"] = "Email"

    # Save to Firestore if available, and update running total
    if db and userEmail:
        try:
            db.collection("users").document(userEmail).collection("receipts").add(
                receipt_data
            )
            db.collection("users").document(userEmail).set(
                {"total_spent": firestore.Increment(1000)},
                merge=True,
            )
            receipt_data["saved_to_firestore"] = True
        except Exception as e:
            print(f"Error saving to Firestore: {e}")
            receipt_data["saved_to_firestore"] = False
            receipt_data["error"] = str(e)
    else:
        receipt_data["saved_to_firestore"] = False
        if not db:
            receipt_data["warning"] = "Firebase not initialized"
        if not userEmail:
            receipt_data["warning"] = "User email required to save"

    return receipt_data


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
