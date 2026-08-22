export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
  }
}

export function statusCodeFor(error: unknown): number {
  if (error instanceof AppError) return error.statusCode;
  if (error instanceof Error && error.name === "ZodError") return 400;
  if (error instanceof Error && "code" in error && error.code === "23505")
    return 409;
  return 500;
}
