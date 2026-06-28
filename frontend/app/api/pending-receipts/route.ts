import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

function getBackendBaseUrl() {
  const extractUrl = process.env.RECEIPT_EXTRACTOR_API_URL;
  return extractUrl?.replace(/\/extract-receipt\/?$/, "");
}

function getBackendAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const secret = process.env.BACKEND_API_SECRET;
  if (secret) headers.Authorization = `Bearer ${secret}`;
  return headers;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const backendBaseUrl = getBackendBaseUrl();
  if (!backendBaseUrl) return NextResponse.json({ pending_receipts: [] });

  try {
    const res = await fetch(
      `${backendBaseUrl}/pending-receipts?userEmail=${encodeURIComponent(user.email)}`,
      { headers: getBackendAuthHeaders() },
    );
    const data = await res.json().catch(() => null);
    if (!res.ok) return NextResponse.json({ pending_receipts: [] });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ pending_receipts: [] });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const backendBaseUrl = getBackendBaseUrl();
  if (!backendBaseUrl) return NextResponse.json({ dismissed: true });

  try {
    const res = await fetch(
      `${backendBaseUrl}/pending-receipts/${encodeURIComponent(id)}?userEmail=${encodeURIComponent(user.email)}`,
      { method: "DELETE", headers: getBackendAuthHeaders() },
    );
    const data = await res.json().catch(() => null);
    if (!res.ok) return NextResponse.json({ error: data?.error ?? "Failed" }, { status: res.status });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}
