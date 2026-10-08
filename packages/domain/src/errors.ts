export type AppErrorCode = "NOT_FOUND" | "CONFLICT" | "VALIDATION";

export class NotFoundError extends Error {
  readonly code: AppErrorCode = "NOT_FOUND";

  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends Error {
  readonly code: AppErrorCode = "CONFLICT";

  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

export class ValidationError extends Error {
  readonly code: AppErrorCode = "VALIDATION";

  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}
