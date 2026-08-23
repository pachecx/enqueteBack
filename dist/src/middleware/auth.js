import { getUserBySession } from "../services/auth.service.js";
import { AppError } from "../utils/errors.js";
export async function requireAuth(req, _res, next) {
    const user = await getUserBySession(req.cookies?.authToken);
    if (!user)
        return next(new AppError("Faça login para continuar.", 401));
    req.user = user;
    return next();
}
