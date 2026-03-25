export class CustomError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string) {
    return new CustomError(message, 400);
  }

  static unauthorized(message: string) {
    return new CustomError(message, 401);
  }

  static forbidden(message: string) {
    return new CustomError(message, 403);
  }

  static notFound(message: string) {
    return new CustomError(message, 404);
  }

  static unprocessableEntity(message: string) {
    return new CustomError(message, 422);
  }
}
