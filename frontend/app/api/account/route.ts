import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

type FakeAccount = {
  monthly_budget: number;
  onboarded_at: string;
};

const fakeAccounts = new Map<string, FakeAccount>();

function shouldUseFakeData() {
  return process.env.USE_FAKE_DATA === "true";
}

function getBackendBaseUrl() {
  const extractUrl = process.env.RECEIPT_EXTRACTOR_API_URL;
  return extractUrl?.replace(/\/extract-receipt\/?$/, "");
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

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (shouldUseFakeData()) {
      const account = fakeAccounts.get(user.email);

      if (!account) {
        return NextResponse.json({
          exists: false,
          onboarded: false,
          monthly_budget: null,
          data_source: "fake",
        });
      }

      return NextResponse.json({
        exists: true,
        onboarded: true,
        monthly_budget: account.monthly_budget,
        data_source: "fake",
      });
    }

    const backendBaseUrl = getBackendBaseUrl();

    if (!backendBaseUrl) {
      return getMissingBackendUrlResponse();
    }

    const backendResponse = await fetch(
      `${backendBaseUrl}/account?userEmail=${encodeURIComponent(user.email)}`,
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
            "Failed to fetch account from backend",
          ),
        },
        { status: backendResponse.status },
      );
    }

    const data = await backendResponse.json();

    return NextResponse.json({ ...data, data_source: "backend" });
  } catch (error) {
    console.error("Error fetching account:", error);

    return NextResponse.json(
      { error: "Unable to fetch account from backend." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const monthlyBudget = Number(body.monthly_budget);

    if (!Number.isFinite(monthlyBudget) || monthlyBudget <= 0) {
      return NextResponse.json(
        { error: "Monthly budget must be greater than zero." },
        { status: 400 },
      );
    }

    if (shouldUseFakeData()) {
      fakeAccounts.set(user.email, {
        monthly_budget: monthlyBudget,
        onboarded_at: new Date().toISOString(),
      });

      return NextResponse.json({
        saved: true,
        onboarded: true,
        monthly_budget: monthlyBudget,
        data_source: "fake",
      });
    }

    const backendBaseUrl = getBackendBaseUrl();

    if (!backendBaseUrl) {
      return getMissingBackendUrlResponse();
    }

    const backendResponse = await fetch(`${backendBaseUrl}/account`, {
      method: "POST",
      headers: getBackendAuthHeaders({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({
        userEmail: user.email,
        monthly_budget: monthlyBudget,
      }),
    });

    const data = await backendResponse.json().catch(() => null);

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          error: getBackendErrorMessage(data, "Unable to save account."),
        },
        { status: backendResponse.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error saving account:", error);

    return NextResponse.json(
      { error: "Unable to save account." },
      { status: 500 },
    );
  }
}
