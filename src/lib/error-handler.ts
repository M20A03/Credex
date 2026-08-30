/**
 * Centralized error normalization and PostgreSQL/Supabase code mapper.
 */

export interface AppError {
  message: string;
  statusCode: number;
  code?: string;
  details?: unknown;
}

interface DatabaseErrorLike {
  code?: string;
  name?: string;
  message?: string;
  status?: number;
}

export function normalizeDatabaseError(error: unknown): AppError {
  const err = (error && typeof error === "object" ? error : {}) as DatabaseErrorLike;

  // PostgreSQL / Supabase Error Code Mapping
  if (err.code) {
    switch (err.code) {
      case "23505": // unique_violation
        return {
          message: "This email or record has already been registered.",
          statusCode: 409,
          code: err.code,
        };
      case "23503": // foreign_key_violation
        return {
          message: "Referenced resource does not exist.",
          statusCode: 400,
          code: err.code,
        };
      case "23502": // not_null_violation
        return {
          message: "A required data field was missing.",
          statusCode: 400,
          code: err.code,
        };
      case "P2002": // Prisma Unique Constraint failure
        return {
          message: "A duplicate record was found. Please verify your details.",
          statusCode: 409,
          code: err.code,
        };
      case "PGRST116": // PostgREST row count error
        return {
          message: "Requested record could not be found.",
          statusCode: 404,
          code: err.code,
        };
      default:
        break;
    }
  }

  // Network / Connection errors
  if (err.name === "AbortError" || err.code === "ETIMEDOUT") {
    return {
      message: "Database operation timed out. Please try again.",
      statusCode: 504,
      code: "TIMEOUT",
    };
  }

  return {
    message: err.message || "An unexpected system error occurred.",
    statusCode: err.status || 500,
    code: err.code || "INTERNAL_ERROR",
    details: process.env.NODE_ENV === "development" ? error : undefined,
  };
}
