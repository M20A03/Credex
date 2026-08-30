import { useToastStore } from "@/lib/toast-store";

export interface FetcherOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
  idempotencyKey?: string;
  showToastOnError?: boolean;
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

interface ErrorPayload {
  error?: string;
  message?: string;
}

/**
 * Enterprise resilient fetcher with exponential backoff, jittered retries,
 * timeout aborts, idempotency keys, and automated toast alerts.
 */
export async function apiFetch<T = unknown>(
  url: string,
  options: FetcherOptions = {}
): Promise<T> {
  const {
    timeoutMs = 15000,
    retries = 2,
    retryDelayMs = 800,
    idempotencyKey,
    showToastOnError = true,
    headers = {},
    ...rest
  } = options;

  let attempt = 0;
  const mergedHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(idempotencyKey ? { "x-idempotency-key": idempotencyKey } : {}),
    ...(headers as Record<string, string>),
  };

  while (attempt <= retries) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        ...rest,
        headers: mergedHeaders,
        signal: rest.signal || controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorData: ErrorPayload | null = null;
        try {
          errorData = (await response.json()) as ErrorPayload;
        } catch {
          errorData = { error: response.statusText };
        }

        const errorMessage =
          errorData?.error || errorData?.message || `Request failed with status ${response.status}`;

        // 401 Unauthorized handling
        if (response.status === 401 && typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("credex:auth-expired"));
        }

        // Retryable HTTP status codes (429 Rate Limit, 502/503/504 Bad Gateway / Unavailable)
        if ([429, 502, 503, 504].includes(response.status) && attempt < retries) {
          attempt++;
          const jitter = Math.random() * 200;
          const delay = retryDelayMs * Math.pow(2, attempt - 1) + jitter;
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }

        throw new ApiError(errorMessage, response.status, errorData);
      }

      // Successful JSON response
      return (await response.json()) as T;
    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      const isLastAttempt = attempt >= retries;

      if (isAbort) {
        const error = new ApiError("Request timed out. Please check your network connection.", 408);
        if (showToastOnError && typeof window !== "undefined") {
          useToastStore.getState().addToast({
            type: "error",
            message: "Request timed out. Please try again.",
          });
        }
        throw error;
      }

      if (isLastAttempt) {
        const message = err instanceof Error ? err.message : "A network error occurred.";
        if (showToastOnError && typeof window !== "undefined") {
          useToastStore.getState().addToast({
            type: "error",
            message,
          });
        }
        throw err;
      }

      attempt++;
      const delay = retryDelayMs * Math.pow(2, attempt - 1) + Math.random() * 200;
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw new ApiError("Maximum retry attempts exceeded", 500);
}
