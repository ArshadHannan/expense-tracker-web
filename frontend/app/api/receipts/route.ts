import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import fakeExtractedReceiptData from "@/fake-data/extracted-receipt.json";
import fakeReceiptsData from "@/fake-data/receipts.json";

type ReceiptsResponse = typeof fakeReceiptsData & {
  data_source: "backend" | "fake";
};

function getFakeReceiptsResponse(userEmail: string): ReceiptsResponse {
  const receipts = fakeReceiptsData.receipts.map((receipt) => ({
    ...receipt,
    userEmail,
  }));

  return {
    ...fakeReceiptsData,
    receipts,
    total_spent: receipts.reduce(
      (total, receipt) => total + (receipt.total_amount_value ?? 0),
      0,
    ),
    data_source: "fake",
  };
}

function shouldUseFakeData() {
  return process.env.USE_FAKE_DATA === "true";
}

function getFakeReceiptExtractionResponse() {
  return {
    data_source: "fake",
    extractedReceipt: fakeExtractedReceiptData,
    message: "Fake receipt extraction completed.",
  };
}

function getFakeReceiptSaveResponse() {
  return {
    data_source: "fake",
    saved_to_firestore: true,
    status: "saved",
  };
}

function getBackendExtractUrl() {
  return process.env.RECEIPT_EXTRACTOR_API_URL;
}

function getBackendReceiptsUrl() {
  const extractUrl = getBackendExtractUrl();

  return extractUrl?.replace(/\/extract-receipt\/?$/, "/receipts");
}

function getMissingBackendUrlResponse() {
  return NextResponse.json(
    {
      error:
        "Missing RECEIPT_EXTRACTOR_API_URL. Add it to frontend/.env.local and restart npm run dev.",
    },
    { status: 500 },
  );
}

function getBackendAuthHeaders(
  extraHeaders: Record<string, string> = {},
): Record<string, string> {
  const headers = { ...extraHeaders };
  const secret = process.env.BACKEND_API_SECRET;

  if (secret) {
    headers.Authorization = `Bearer ${secret}`;
  }

  return headers;
}

function getBackendErrorMessage(errorData: unknown, fallback: string) {
  if (!errorData || typeof errorData !== "object") {
    return fallback;
  }

  const data = errorData as { error?: string; detail?: string };
  return data.error ?? data.detail ?? fallback;
}

function getMissingBackendSecretResponse() {
  return NextResponse.json(
    {
      error:
        "Missing BACKEND_API_SECRET. Add the same secret to frontend and backend env on Vercel, then redeploy.",
    },
    { status: 503 },
  );
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (shouldUseFakeData()) {
      return NextResponse.json(getFakeReceiptsResponse(user.email));
    }

    const backendUrl = getBackendReceiptsUrl();

    if (!backendUrl) {
      return getMissingBackendUrlResponse();
    }

    const backendResponse = await fetch(
      `${backendUrl}?userEmail=${encodeURIComponent(user.email)}`,
      {
        method: "GET",
        headers: getBackendAuthHeaders({
          "Content-Type": "application/json",
        }),
      },
    );

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => null);

      return NextResponse.json(
        {
          error: getBackendErrorMessage(
            errorData,
            "Failed to fetch receipts from backend",
          ),
        },
        { status: backendResponse.status },
      );
    }

    const data = await backendResponse.json();

    return NextResponse.json({ ...data, data_source: "backend" });
  } catch (error) {
    console.error("Error fetching receipts:", error);

    return NextResponse.json(
      { error: "Unable to fetch receipts from backend." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const incomingFormData = await request.formData();
    const files = incomingFormData
      .getAll("files")
      .filter((file): file is File => file instanceof File);

    if (files.length > 1) {
      return NextResponse.json(
        { error: "Only one receipt can be uploaded at a time." },
        { status: 400 },
      );
    }

    if (shouldUseFakeData()) {
      return NextResponse.json(getFakeReceiptExtractionResponse());
    }

    const backendUrl = getBackendExtractUrl();

    if (!backendUrl) {
      return getMissingBackendUrlResponse();
    }

    const outgoingFormData = new FormData();
    const emailBody = incomingFormData.get("emailBody");

    if (typeof emailBody === "string") {
      outgoingFormData.set("emailBody", emailBody);
    }

    for (const file of files) {
      outgoingFormData.append("files", file, file.name);
    }

    outgoingFormData.set("userEmail", user.email);

    const backendResponse = await fetch(backendUrl, {
      method: "POST",
      headers: getBackendAuthHeaders(),
      body: outgoingFormData,
    });
    const contentType = backendResponse.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const data = await backendResponse.json();

      if (!backendResponse.ok) {
        return NextResponse.json(
          { error: data?.error || "Receipt extraction failed." },
          { status: backendResponse.status },
        );
      }

      return NextResponse.json(data, { status: backendResponse.status });
    }

    const text = await backendResponse.text();

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: text || "Receipt extraction failed." },
        { status: backendResponse.status },
      );
    }

    return NextResponse.json(
      { response: text },
      { status: backendResponse.status },
    );
  } catch (error) {
    console.error("Error importing receipt:", error);

    return NextResponse.json(
      { error: "Unable to extract receipt from backend." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const receiptId = request.nextUrl.searchParams.get("receiptId");

  if (!receiptId) {
    return NextResponse.json({ error: "Receipt ID required" }, { status: 400 });
  }

  if (shouldUseFakeData()) {
    return NextResponse.json({ deleted: true, data_source: "fake" });
  }

  const backendUrl = getBackendReceiptsUrl();

  if (!backendUrl) {
    return getMissingBackendUrlResponse();
  }

  try {
    const backendResponse = await fetch(
      `${backendUrl}/${encodeURIComponent(receiptId)}?userEmail=${encodeURIComponent(user.email)}`,
      {
        method: "DELETE",
        headers: getBackendAuthHeaders(),
      },
    );

    const data = await backendResponse.json().catch(() => null);

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: data?.error || "Unable to delete receipt." },
        { status: backendResponse.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error deleting receipt:", error);

    return NextResponse.json(
      { error: "Unable to delete receipt." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const receiptData = await request.json();

    if (shouldUseFakeData()) {
      return NextResponse.json(getFakeReceiptSaveResponse());
    }

    const backendUrl = getBackendReceiptsUrl();

    if (!backendUrl) {
      return getMissingBackendUrlResponse();
    }

    const backendResponse = await fetch(backendUrl, {
      method: "POST",
      headers: getBackendAuthHeaders({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({
        ...receiptData,
        userEmail: user.email,
      }),
    });

    const data = await backendResponse.json().catch(() => null);

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: data?.error || "Unable to save receipt." },
        { status: backendResponse.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error saving receipt:", error);

    return NextResponse.json(
      { error: "Unable to save receipt." },
      { status: 500 },
    );
  }
}
