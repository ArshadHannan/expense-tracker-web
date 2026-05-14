import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

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
    // Get the backend URL from environment variables
    const backendUrl = process.env.NEXT_PUBLIC_RECEIPT_EXTRACTOR_API_URL || "http://localhost:8000";

    // Forward the request to the backend
    const backendResponse = await fetch(`${backendUrl}/receipts?userEmail=${encodeURIComponent(userEmail)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => null);
      return NextResponse.json(
        { error: errorData?.error || "Failed to fetch receipts from backend" },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching receipts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const backendUrl = process.env.RECEIPT_EXTRACTOR_API_URL;

    if (!backendUrl) {
      return NextResponse.json(
        {
          error:
            "Missing RECEIPT_EXTRACTOR_API_URL. Add it to frontend/.env.local and restart npm run dev.",
        },
        { status: 500 },
      );
    }

    const incomingFormData = await request.formData();
    const outgoingFormData = new FormData();
    const emailBody = incomingFormData.get("emailBody");

    if (typeof emailBody === "string") {
      outgoingFormData.set("emailBody", emailBody);
    }

    for (const file of incomingFormData.getAll("files")) {
      if (file instanceof File) {
        outgoingFormData.append("files", file, file.name);
      }
    }

    outgoingFormData.set("userEmail", user.email);

    const backendResponse = await fetch(backendUrl, {
      method: "POST",
      body: outgoingFormData,
    });
    const contentType = backendResponse.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const data = await backendResponse.json();
      return NextResponse.json(data, { status: backendResponse.status });
    }

    const text = await backendResponse.text();
    return NextResponse.json(
      { response: text },
      { status: backendResponse.status },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to forward receipt data to backend.",
      },
      { status: 500 },
    );
  }
}
