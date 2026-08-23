export class AppError extends Error {
    statusCode;
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}
export function statusCodeFor(error) {
    if (error instanceof AppError)
        return error.statusCode;
    if (error instanceof Error && error.name === "ZodError")
        return 400;
    if (error instanceof Error && "code" in error && error.code === "23505")
        return 409;
    return 500;
}
