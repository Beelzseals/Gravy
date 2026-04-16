export class CustomError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number,
    public readonly code: string = statusCode.toString(),
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string) {
    return new CustomError(message, 400, "BAD_REQUEST");
  }

  static unauthorized(message: string) {
    return new CustomError(message, 401, "UNAUTHORIZED");
  }

  static forbidden(message: string) {
    return new CustomError(message, 403, "FORBIDDEN");
  }

  static notFound(message: string) {
    return new CustomError(message, 404, "NOT_FOUND");
  }

  static unprocessableEntity(message: string) {
    return new CustomError(message, 422, "UNPROCESSABLE_ENTITY");
  }

  static ownershipRequired(message: string) {
    return new CustomError(message, 409, "INVARIANT_VIOLATION");
  }
}
