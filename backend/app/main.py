import asyncio
import base64
import json
import os
import re
import secrets
from datetime import datetime
from typing import Annotated
from dotenv import load_dotenv

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, Request, UploadFile, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import firebase_admin
from firebase_admin import credentials, firestore

load_dotenv()

app = FastAPI(title="RupeeFlow Receipt Extractor")

BACKEND_API_SECRET = os.getenv("BACKEND_API_SECRET")
EXTRACTION_LIMIT = 999


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

# Firebase
try:
    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "./firebase-credentials.json")
    firebase_creds_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
    if firebase_creds_json:
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

# Document AI
def _is_document_ai_configured() -> bool:
    return bool(
        os.getenv("GOOGLE_CLOUD_PROJECT_ID")
        and os.getenv("DOCUMENT_AI_PROCESSOR_ID")
    )

def _get_document_ai_client():
    from google.cloud import documentai
    from google.oauth2 import service_account

    location = os.getenv("DOCUMENT_AI_LOCATION", "us")
    api_endpoint = f"{location}-documentai.googleapis.com"
    client_options = {"api_endpoint": api_endpoint}

    firebase_creds_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
    if firebase_creds_json:
        cred_dict = json.loads(firebase_creds_json)
        creds = service_account.Credentials.from_service_account_info(
            cred_dict,
            scopes=["https://www.googleapis.com/auth/cloud-platform"],
        )
        return documentai.DocumentProcessorServiceClient(
            credentials=creds,
            client_options=client_options,
        )

    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "./firebase-credentials.json")
    if os.path.exists(cred_path):
        creds = service_account.Credentials.from_service_account_file(
            cred_path,
            scopes=["https://www.googleapis.com/auth/cloud-platform"],
        )
        return documentai.DocumentProcessorServiceClient(
            credentials=creds,
            client_options=client_options,
        )

    return documentai.DocumentProcessorServiceClient(client_options=client_options)


def _clean_amount(value: str) -> str:
    cleaned = re.sub(r"[^\d.]", "", value.replace(",", ""))
    return cleaned or "0"


def _parse_document_ai_receipt(document) -> dict:
    store_name = ""
    items = []
    totals = {
        "subtotal": "0",
        "discount": "0",
        "tax": "0",
        "serviceCharge": "0",
        "deliveryFee": "0",
        "total": "0",
    }

    for entity in document.entities:
        t = entity.type_
        v = entity.mention_text.strip() if entity.mention_text else ""

        if t == "supplier_name":
            store_name = v
        elif t == "total_amount":
            totals["total"] = _clean_amount(v)
        elif t in ("net_amount", "subtotal"):
            totals["subtotal"] = _clean_amount(v)
        elif t == "total_tax_amount":
            totals["tax"] = _clean_amount(v)
        elif t == "total_discount_amount":
            totals["discount"] = _clean_amount(v)
        elif t == "line_item":
            item_data = {"item": "", "quantity": "1", "amount": "0"}
            for prop in entity.properties:
                pt = prop.type_
                pv = prop.mention_text.strip() if prop.mention_text else ""
                if pt == "line_item/description":
                    item_data["item"] = pv
                elif pt == "line_item/quantity":
                    item_data["quantity"] = pv or "1"
                elif pt == "line_item/amount":
                    item_data["amount"] = _clean_amount(pv)
            if item_data["item"]:
                items.append(item_data)

    return {"storeName": store_name, "items": items, "totals": totals}


async def _extract_with_document_ai(file_content: bytes, mime_type: str) -> dict:
    from google.cloud import documentai

    project_id = os.getenv("GOOGLE_CLOUD_PROJECT_ID")
    location = os.getenv("DOCUMENT_AI_LOCATION", "us")
    processor_id = os.getenv("DOCUMENT_AI_PROCESSOR_ID")

    client = _get_document_ai_client()
    processor_name = client.processor_path(project_id, location, processor_id)

    raw_document = documentai.RawDocument(content=file_content, mime_type=mime_type)
    request = documentai.ProcessRequest(name=processor_name, raw_document=raw_document)

    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, client.process_document, request)

    return _parse_document_ai_receipt(result.document)


def _usage_key() -> str:
    now = datetime.utcnow()
    return f"{now.year}-{now.month:02d}"


def _check_and_increment_usage() -> bool:
    """Atomically checks the monthly limit and increments. Returns False if limit reached."""
    if not db:
        return True

    usage_ref = db.collection("app_usage").document(_usage_key())

    try:
        @firestore.transactional
        def _run(transaction, ref):
            snapshot = ref.get(transaction=transaction)
            count = (snapshot.get("extraction_count") if snapshot.exists else None) or 0
            if count >= EXTRACTION_LIMIT:
                return False
            transaction.set(ref, {"extraction_count": count + 1}, merge=True)
            return True

        return _run(db.transaction(), usage_ref)
    except Exception as e:
        print(f"Usage tracking error: {e}")
        return True  # fail open on DB errors so extraction still works


# ── Gmail webhook ────────────────────────────────────────────────────────────

PENDING_RECEIPT_CAP = 20


def _get_gmail_service():
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request
    from googleapiclient.discovery import build

    creds = Credentials(
        token=None,
        refresh_token=os.getenv("GMAIL_REFRESH_TOKEN"),
        client_id=os.getenv("GMAIL_CLIENT_ID"),
        client_secret=os.getenv("GMAIL_CLIENT_SECRET"),
        token_uri="https://oauth2.googleapis.com/token",
        scopes=["https://www.googleapis.com/auth/gmail.readonly"],
    )
    creds.refresh(Request())
    return build("gmail", "v1", credentials=creds, cache_discovery=False)


def _verify_pubsub_jwt(authorization: str | None) -> bool:
    if not authorization or not authorization.startswith("Bearer "):
        return False
    token = authorization.removeprefix("Bearer ")
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as grequests

        audience = os.getenv("GMAIL_WEBHOOK_URL", "")
        claim = id_token.verify_oauth2_token(token, grequests.Request(), audience=audience or None)
        return claim.get("iss") in ("accounts.google.com", "https://accounts.google.com")
    except Exception as e:
        print(f"Pub/Sub JWT verification failed: {e}")
        return False


def _extract_email_address(header: str) -> str:
    match = re.search(r"<(.+?)>", header)
    return match.group(1).strip().lower() if match else header.strip().lower()


@app.post("/gmail-webhook")
async def gmail_webhook(
    request: Request,
    token: str = Query(default=""),
) -> dict:
    # 1. URL secret check
    webhook_secret = os.getenv("GMAIL_WEBHOOK_SECRET", "")
    if webhook_secret and not secrets.compare_digest(token, webhook_secret):
        raise HTTPException(status_code=401, detail="Unauthorized")

    # 2. Pub/Sub OIDC JWT verification
    if not _verify_pubsub_jwt(request.headers.get("Authorization")):
        raise HTTPException(status_code=401, detail="Invalid Pub/Sub token")

    # 3. Decode Pub/Sub message
    try:
        body = await request.json()
    except Exception:
        return {"status": "ok"}

    message = body.get("message", {})
    data_b64 = message.get("data", "")
    pubsub_message_id = message.get("messageId", "")

    if not data_b64 or not db:
        return {"status": "ok"}

    try:
        data = json.loads(base64.b64decode(data_b64).decode("utf-8"))
    except Exception:
        return {"status": "ok"}

    history_id = str(data.get("historyId", ""))
    if not history_id:
        return {"status": "ok"}

    # 4. Fetch new messages from Gmail API
    try:
        gmail = _get_gmail_service()

        meta_ref = db.collection("app_config").document("gmail")
        meta_doc = meta_ref.get()
        last_history_id = (meta_doc.get("last_history_id") if meta_doc.exists else None) or history_id

        history_result = gmail.users().history().list(
            userId="me",
            startHistoryId=last_history_id,
            historyTypes=["messageAdded"],
        ).execute()

        meta_ref.set({"last_history_id": history_id}, merge=True)

        new_message_ids: list[str] = []
        for record in history_result.get("history", []):
            for msg in record.get("messagesAdded", []):
                new_message_ids.append(msg["message"]["id"])

        for gmail_msg_id in new_message_ids:
            # 5. Dedup: skip already-processed messages
            if db.collection("processed_emails").document(gmail_msg_id).get().exists:
                continue

            # 6. Get From: and Subject headers
            msg = gmail.users().messages().get(
                userId="me",
                id=gmail_msg_id,
                format="metadata",
                metadataHeaders=["From", "Subject"],
            ).execute()

            headers = {
                h["name"]: h["value"]
                for h in msg.get("payload", {}).get("headers", [])
            }
            from_email = _extract_email_address(headers.get("From", ""))
            subject = headers.get("Subject", "No Subject")

            # 7. From: must match a registered user
            user_doc = db.collection("users").document(from_email).get()
            if not user_doc.exists:
                db.collection("processed_emails").document(gmail_msg_id).set(
                    {"status": "unknown_user", "from": from_email, "created_at": datetime.utcnow().isoformat()}
                )
                continue

            # 8. Rate limit: cap pending receipts per user
            pending_count = sum(
                1 for _ in db.collection("users")
                .document(from_email)
                .collection("pending_receipts")
                .where("status", "==", "pending")
                .limit(PENDING_RECEIPT_CAP + 1)
                .stream()
            )
            if pending_count >= PENDING_RECEIPT_CAP:
                db.collection("processed_emails").document(gmail_msg_id).set(
                    {"status": "rate_limited", "from": from_email, "created_at": datetime.utcnow().isoformat()}
                )
                continue

            # 9. Create pending receipt with fake data
            db.collection("users").document(from_email).collection("pending_receipts").add({
                "source": "email",
                "from_email": from_email,
                "subject": subject,
                "gmail_message_id": gmail_msg_id,
                "status": "pending",
                "created_at": datetime.utcnow().isoformat(),
                "extracted_data": FAKE_EXTRACTED_RECEIPT,
            })

            # 10. Mark message as processed
            db.collection("processed_emails").document(gmail_msg_id).set({
                "status": "processed",
                "from": from_email,
                "created_at": datetime.utcnow().isoformat(),
            })

    except Exception as e:
        print(f"Gmail webhook processing error: {e}")
        # Return 200 so Pub/Sub does not retry endlessly

    return {"status": "ok"}


@app.get("/pending-receipts")
async def get_pending_receipts(
    userEmail: str = Query(...),
    _: Annotated[None, Depends(verify_backend_api_secret)] = None,
) -> dict:
    if not db:
        return JSONResponse({"error": "Firebase not initialized", "pending_receipts": []}, status_code=500)

    if not userEmail:
        return JSONResponse({"error": "User email required", "pending_receipts": []}, status_code=400)

    try:
        docs = (
            db.collection("users")
            .document(userEmail)
            .collection("pending_receipts")
            .where("status", "==", "pending")
            .order_by("created_at", direction="DESCENDING")
            .stream()
        )

        receipts = []
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            receipts.append(data)

        return {"pending_receipts": receipts}
    except Exception as e:
        print(f"Error fetching pending receipts: {e}")
        return JSONResponse({"error": str(e), "pending_receipts": []}, status_code=500)


@app.delete("/pending-receipts/{receipt_id}")
async def dismiss_pending_receipt(
    receipt_id: str,
    userEmail: str = Query(...),
    _: Annotated[None, Depends(verify_backend_api_secret)] = None,
) -> dict:
    if not db:
        return JSONResponse({"error": "Firebase not initialized", "dismissed": False}, status_code=500)

    if not userEmail:
        return JSONResponse({"error": "User email required", "dismissed": False}, status_code=400)

    try:
        ref = (
            db.collection("users")
            .document(userEmail)
            .collection("pending_receipts")
            .document(receipt_id)
        )
        if not ref.get().exists:
            return JSONResponse({"error": "Pending receipt not found", "dismissed": False}, status_code=404)

        ref.delete()
        return {"dismissed": True, "receipt_id": receipt_id}
    except Exception as e:
        print(f"Error dismissing pending receipt: {e}")
        return JSONResponse({"error": str(e), "dismissed": False}, status_code=500)


# ─────────────────────────────────────────────────────────────────────────────

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


class SaveAccountRequest(BaseModel):
    userEmail: str
    monthly_budget: float


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

    if _is_document_ai_configured():
        if not uploaded_files:
            return JSONResponse(
                {"error": "A receipt file is required. Please upload a PDF or image."},
                status_code=400,
            )

        if not _check_and_increment_usage():
            return JSONResponse(
                {
                    "error": "Monthly extraction limit reached. No credits remaining for this month. Please try again next month."
                },
                status_code=429,
            )

        try:
            file = uploaded_files[0]
            file_content = await file.read()
            mime_type = file.content_type or "image/jpeg"
            extracted = await _extract_with_document_ai(file_content, mime_type)

            return {
                "status": "extracted",
                "userEmail": userEmail,
                "receiptName": file.filename or "receipt",
                "extractedReceipt": extracted,
            }
        except Exception as e:
            print(f"Document AI extraction error: {e}")
            return JSONResponse(
                {"error": "Failed to extract receipt. Please try again or enter details manually."},
                status_code=500,
            )

    # Dev / fake-data fallback when Document AI is not configured
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


@app.get("/account")
async def get_account(
    userEmail: str = Query(...),
    _: Annotated[None, Depends(verify_backend_api_secret)] = None,
) -> dict:
    if not db:
        return JSONResponse(
            {"error": "Firebase not initialized", "onboarded": False},
            status_code=500,
        )

    if not userEmail:
        return JSONResponse(
            {"error": "User email required", "onboarded": False},
            status_code=400,
        )

    try:
        user_doc = db.collection("users").document(userEmail).get()

        if not user_doc.exists:
            return {
                "exists": False,
                "onboarded": False,
                "monthly_budget": None,
            }

        user_data = user_doc.to_dict() or {}
        monthly_budget = user_data.get("monthly_budget")

        return {
            "exists": True,
            "onboarded": monthly_budget is not None,
            "monthly_budget": monthly_budget,
        }
    except Exception as e:
        print(f"Error fetching account: {e}")
        return JSONResponse(
            {"error": str(e), "onboarded": False},
            status_code=500,
        )


@app.post("/account")
async def save_account(
    account: SaveAccountRequest,
    _: Annotated[None, Depends(verify_backend_api_secret)] = None,
) -> dict:
    if not db:
        return JSONResponse(
            {"error": "Firebase not initialized", "saved": False},
            status_code=500,
        )

    if not account.userEmail:
        return JSONResponse(
            {"error": "User email required", "saved": False},
            status_code=400,
        )

    if account.monthly_budget <= 0:
        return JSONResponse(
            {"error": "Monthly budget must be greater than zero", "saved": False},
            status_code=400,
        )

    try:
        db.collection("users").document(account.userEmail).set(
            {
                "monthly_budget": account.monthly_budget,
                "onboarded_at": datetime.utcnow().isoformat(),
            },
            merge=True,
        )

        return {
            "saved": True,
            "onboarded": True,
            "monthly_budget": account.monthly_budget,
        }
    except Exception as e:
        print(f"Error saving account: {e}")
        return JSONResponse(
            {"error": str(e), "saved": False},
            status_code=500,
        )


@app.delete("/receipts/{receipt_id}")
async def delete_receipt(
    receipt_id: str,
    userEmail: str = Query(...),
    _: Annotated[None, Depends(verify_backend_api_secret)] = None,
) -> dict:
    if not db:
        return JSONResponse(
            {"error": "Firebase not initialized", "deleted": False},
            status_code=500,
        )

    if not userEmail:
        return JSONResponse(
            {"error": "User email required", "deleted": False},
            status_code=400,
        )

    try:
        receipt_ref = (
            db.collection("users")
            .document(userEmail)
            .collection("receipts")
            .document(receipt_id)
        )
        receipt_doc = receipt_ref.get()

        if not receipt_doc.exists:
            return JSONResponse(
                {"error": "Receipt not found", "deleted": False},
                status_code=404,
            )

        receipt_data = receipt_doc.to_dict() or {}
        total_amount_value = receipt_data.get("total_amount_value", 0)

        receipt_ref.delete()

        if total_amount_value > 0:
            db.collection("users").document(userEmail).set(
                {"total_spent": firestore.Increment(-total_amount_value)},
                merge=True,
            )

        return {"deleted": True, "receipt_id": receipt_id}
    except Exception as e:
        print(f"Error deleting receipt: {e}")
        return JSONResponse(
            {"error": "Unable to delete receipt.", "deleted": False},
            status_code=500,
        )


@app.get("/receipts")
async def get_receipts(
    userEmail: str = Query(...),
    _: Annotated[None, Depends(verify_backend_api_secret)] = None,
) -> dict:
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
