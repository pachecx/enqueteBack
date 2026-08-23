import { randomUUID } from "node:crypto";
import { pool } from "../database.js";
import { AppError } from "../utils/errors.js";
import { hashPassword, verifyPassword } from "../utils/passwords.js";
import { createToken, hashToken } from "../utils/tokens.js";
const SESSION_DAYS = 30;
function normalizeIdentifier(identifier) {
    return identifier.trim().toLowerCase();
}
function validateCredentials(identifier, password) {
    if (!identifier || identifier.length > 120)
        throw new AppError("Informe um e-mail ou usuário válido.", 400);
    if (identifier.includes("@") && !/^\S+@\S+\.\S+$/.test(identifier))
        throw new AppError("Informe um e-mail válido.", 400);
    if (!identifier.includes("@") && !/^[a-z0-9_.-]{3,30}$/.test(identifier))
        throw new AppError("O usuário deve ter entre 3 e 30 caracteres.", 400);
    if (password.length < 8)
        throw new AppError("A senha deve ter pelo menos 8 caracteres.", 400);
}
async function createSession(user) {
    const token = createToken(32);
    await pool.query(`insert into auth_sessions (id, user_id, token_hash, expires_at)
     values ($1, $2, $3, now() + interval '${SESSION_DAYS} days')`, [randomUUID(), user.id, hashToken(token)]);
    return { token, user };
}
export async function register(identifier, password) {
    const normalizedIdentifier = normalizeIdentifier(identifier);
    validateCredentials(normalizedIdentifier, password);
    const passwordHash = await hashPassword(password);
    const isEmail = normalizedIdentifier.includes("@");
    try {
        const result = await pool.query("insert into users (id, email, username, password_hash) values ($1, $2, $3, $4) returning id, email, username", [
            randomUUID(),
            isEmail ? normalizedIdentifier : null,
            isEmail ? null : normalizedIdentifier,
            passwordHash,
        ]);
        return createSession(result.rows[0]);
    }
    catch (error) {
        if (error.code === "23505") {
            const existing = await pool.query("select id, email, username, password_hash from users where email = $1 or username = $1", [normalizedIdentifier]);
            const user = existing.rows[0];
            if (user && (await verifyPassword(password, user.password_hash)))
                return createSession({
                    id: user.id,
                    email: user.email,
                    username: user.username,
                });
            throw new AppError("Este e-mail ou usuário já está cadastrado.", 409);
        }
        throw error;
    }
}
export async function login(identifier, password) {
    const normalizedIdentifier = normalizeIdentifier(identifier);
    validateCredentials(normalizedIdentifier, password);
    const result = await pool.query("select id, email, username, password_hash from users where email = $1 or username = $1", [normalizedIdentifier]);
    const user = result.rows[0];
    if (!user || !(await verifyPassword(password, user.password_hash)))
        throw new AppError("E-mail, usuário ou senha inválidos.", 401);
    return createSession({
        id: user.id,
        email: user.email,
        username: user.username,
    });
}
export async function getUserBySession(token) {
    if (!token)
        return null;
    const result = await pool.query(`select u.id, u.email, u.username from auth_sessions s
     join users u on u.id = s.user_id
     where s.token_hash = $1 and s.expires_at > now()`, [hashToken(token)]);
    return result.rows[0] ?? null;
}
export async function logout(token) {
    if (token)
        await pool.query("delete from auth_sessions where token_hash = $1", [
            hashToken(token),
        ]);
}
