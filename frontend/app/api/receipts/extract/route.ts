import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const backendUrl = process.env.RECEIPT_EXTRACTOR_API_URL;

  if (!backendUrl) {
    return NextResponse.json(
      { error: "Missing RECEIPT_EXTRACTOR_API_URL." },
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
}
