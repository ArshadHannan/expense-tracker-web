from typing import Annotated

from fastapi import FastAPI, File, Form, UploadFile

app = FastAPI(title="Expense Tracker Receipt Extractor")


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

    return {
        "status": "received",
        "userEmail": userEmail,
        "fileCount": len(uploaded_files),
        "files": uploaded_files,
        "emailBody": {
            "received": bool(emailBody.strip()),
            "characterCount": len(emailBody),
            "preview": emailBody[:300],
        },
    }
