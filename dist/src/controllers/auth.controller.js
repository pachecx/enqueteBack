import { z } from "zod";
import { login, logout, register } from "../services/auth.service.js";
import { claimPoll as claimPollService } from "../services/poll.service.js";
import { getPollsByOwner } from "../services/poll.service.js";
import { statusCodeFor } from "../utils/errors.js";
const credentialsSchema = z.object({
    identifier: z.string(),
    password: z.string(),
});
const cookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 30,
};
function respondWithSession(res, session) {
    res.cookie("authToken", session.token, cookieOptions);
    return res.status(200).json({ user: session.user });
}
export async function postRegister(req, res) {
    try {
        const { identifier, password } = credentialsSchema.parse(req.body);
        return respondWithSession(res, await register(identifier, password));
    }
    catch (error) {
        return res.status(statusCodeFor(error)).json({
            error: error instanceof Error
                ? error.message
                : "Não foi possível criar a conta.",
        });
    }
}
export async function postLogin(req, res) {
    try {
        const { identifier, password } = credentialsSchema.parse(req.body);
        return respondWithSession(res, await login(identifier, password));
    }
    catch (error) {
        return res.status(statusCodeFor(error)).json({
            error: error instanceof Error ? error.message : "Não foi possível entrar.",
        });
    }
}
export async function postLogout(req, res) {
    await logout(req.cookies?.authToken);
    res.clearCookie("authToken");
    return res.status(204).send();
}
export function getMe(req, res) {
    return res.json({ user: req.user });
}
export async function getMyPolls(req, res) {
    return res.json({ polls: await getPollsByOwner(req.user.id) });
}
export async function claimPoll(req, res) {
    try {
        await claimPollService(String(req.body.adminToken), req.user.id);
        return res.status(204).send();
    }
    catch (error) {
        return res.status(statusCodeFor(error)).json({
            error: error instanceof Error
                ? error.message
                : "Não foi possível associar a enquete.",
        });
    }
}
