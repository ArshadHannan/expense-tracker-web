export function shouldUseFakeData() {
  return process.env.USE_FAKE_DATA === "true";
}

export function getBackendExtractUrl() {
  return process.env.RECEIPT_EXTRACTOR_API_URL;
}

export function getBackendBaseUrl() {
  const extractUrl = getBackendExtractUrl();
  return extractUrl?.replace(/\/extract-receipt\/?$/, "");
}

export function getBackendReceiptsUrl() {
  const baseUrl = getBackendBaseUrl();
  return baseUrl ? `${baseUrl}/receipts` : undefined;
}

export function getBackendAccountUrl() {
  const baseUrl = getBackendBaseUrl();
  return baseUrl ? `${baseUrl}/account` : undefined;
}

export function getMissingBackendUrlResponse() {
  return Response.json(
    {
      error:
        "Missing RECEIPT_EXTRACTOR_API_URL. Add it to frontend/.env.local and restart npm run dev.",
    },
    { status: 500 },
  );
}

export function getBackendAuthHeaders(
  extraHeaders: Record<string, string> = {},
): Record<string, string> {
  const headers = { ...extraHeaders };
  const secret = process.env.BACKEND_API_SECRET;

  if (secret) {
    headers.Authorization = `Bearer ${secret}`;
  }

  return headers;
}

export function getBackendErrorMessage(errorData: unknown, fallback: string) {
  if (!errorData || typeof errorData !== "object") {
    return fallback;
  }

  const data = errorData as { error?: string; detail?: string };
  return data.error ?? data.detail ?? fallback;
}
