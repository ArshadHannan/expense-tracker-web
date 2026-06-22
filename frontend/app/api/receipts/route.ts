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

function getBackendExtractUrl() {
  return process.env.RECEIPT_EXTRACTOR_API_URL;
}

function getBackendReceiptsUrl() {
  const extractUrl = getBackendExtractUrl();

  return extractUrl?.replace(/\/extract-receipt\/?$/, "/receipts");
}

function getFakeReceiptSaveResponse() {
  return {
    data_source: "fake",
    saved_to_firestore: true,
    status: "saved",
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userEmail = searchParams.get("userEmail");

  if (!userEmail) {
    return NextResponse.json(
      { error: "User email is required" },
      { status: 400 }
    );
  }

  try {
    if (shouldUseFakeData()) {
      return NextResponse.json(getFakeReceiptsResponse(userEmail));
    }

    const backendUrl = getBackendReceiptsUrl();

    if (!backendUrl) {
      return NextResponse.json(getFakeReceiptsResponse(userEmail));
    }

    // Forward the request to the backend
    const backendResponse = await fetch(`${backendUrl}/receipts?userEmail=${encodeURIComponent(userEmail)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!backendResponse.ok) {
      return NextResponse.json(getFakeReceiptsResponse(userEmail));
    }

    const data = await backendResponse.json();
    return NextResponse.json({ ...data, data_source: "backend" });
  } catch (error) {
    console.error("Error fetching receipts:", error);
    return NextResponse.json(getFakeReceiptsResponse(userEmail));
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const backendUrl = getBackendExtractUrl();
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

    if (shouldUseFakeData() || !backendUrl) {
      return NextResponse.json(getFakeReceiptExtractionResponse());
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
      body: outgoingFormData,
    });
    const contentType = backendResponse.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const data = await backendResponse.json();
      if (!backendResponse.ok) {
        return NextResponse.json(getFakeReceiptExtractionResponse());
      }

      return NextResponse.json(data, { status: backendResponse.status });
    }

    const text = await backendResponse.text();

    if (!backendResponse.ok) {
      return NextResponse.json(getFakeReceiptExtractionResponse());
    }

    return NextResponse.json(
      { response: text },
      { status: backendResponse.status },
    );
  } catch (error) {
    console.error("Error importing receipt:", error);
    return NextResponse.json(getFakeReceiptExtractionResponse());
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const backendUrl = getBackendReceiptsUrl();
    const receiptData = await request.json();

    if (shouldUseFakeData() || !backendUrl) {
      return NextResponse.json(getFakeReceiptSaveResponse());
    }

    const backendResponse = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
