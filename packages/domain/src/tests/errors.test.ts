import { describe, expect, it } from "vitest";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../errors.js";

describe("errors", () => {
  it("NotFoundError carries the NOT_FOUND code", () => {
    const error = new NotFoundError("missing row");
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("NotFoundError");
    expect(error.code).toBe("NOT_FOUND");
    expect(error.message).toBe("missing row");
  });

  it("ConflictError carries the CONFLICT code", () => {
    const error = new ConflictError("dates clash");
    expect(error.name).toBe("ConflictError");
    expect(error.code).toBe("CONFLICT");
  });

  it("ValidationError carries the VALIDATION code", () => {
    const error = new ValidationError("bad range");
    expect(error.name).toBe("ValidationError");
    expect(error.code).toBe("VALIDATION");
  });
});
