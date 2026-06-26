import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getBackendAccountUrl,
  getBackendAuthHeaders,
  getBackendErrorMessage,
  getMissingBackendUrlResponse,
  shouldUseFakeData,
} from "@/app/_lib/backend-api";

type AccountResponse = {
  onboarded: boolean;
  monthly_budget: number | null;
};

const fakeAccounts = new Map<string, number>();

function getFakeAccountResponse(userEmail: string): AccountResponse {
  const monthlyBudget = fakeAccounts.get(userEmail);

  if (monthlyBudget === undefined) {
    return { onboarded: false, monthly_budget: null };
  }

  return { onboarded: true, monthly_budget: monthlyBudget };
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (shouldUseFakeData()) {
      return NextResponse.json(getFakeAccountResponse(user.email));
    }

    const backendUrl = getBackendAccountUrl();

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
            "Failed to fetch account from backend",
          ),
        },
        { status: backendResponse.status },
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
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
      fakeAccounts.set(user.email, monthlyBudget);

      return NextResponse.json({
        saved: true,
        onboarded: true,
        monthly_budget: monthlyBudget,
      });
    }

    const backendUrl = getBackendAccountUrl();

    if (!backendUrl) {
      return getMissingBackendUrlResponse();
    }

    const backendResponse = await fetch(backendUrl, {
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
