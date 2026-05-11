import os
import json
from datetime import datetime
from typing import Annotated
from dotenv import load_dotenv

from fastapi import FastAPI, File, Form, UploadFile
import firebase_admin
from firebase_admin import credentials, firestore

# Load environment variables
load_dotenv()

app = FastAPI(title="Expense Tracker Receipt Extractor")

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
    }

    # Save to Firestore if available
    if db and userEmail:
        try:
            db.collection("users").document(userEmail).collection("receipts").add(
                receipt_data
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
