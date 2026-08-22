import { randomUUID } from "node:crypto";
import { pool, transaction } from "../database.js";
import { createToken, hashToken } from "../utils/tokens.js";
import { daysInMonth } from "../utils/dates.js";
import { AppError } from "../utils/errors.js";
function validatePoll(input) {
    if (!input.question?.trim() || input.question.trim().length > 500)
        throw new AppError("A pergunta deve ter entre 1 e 500 caracteres.", 400);
    if (!["SINGLE_CHOICE", "MULTIPLE_CHOICE", "DATE_SELECTION"].includes(input.type))
        throw new AppError("Tipo de enquete inválido.", 400);
    if (input.type !== "DATE_SELECTION") {
        const options = input.options?.map((option) => option.trim()).filter(Boolean) ?? [];
        if (options.length < 2 ||
            options.length > 30 ||
            new Set(options.map((option) => option.toLowerCase())).size !==
                options.length)
            throw new AppError("Informe de 2 a 30 opções únicas.", 400);
    }
    else {
        if (!input.month || !input.year)
            throw new AppError("Informe mês e ano.", 400);
        if (!input.dateMode)
            throw new AppError("Informe se a enquete aceita um ou vários dias.", 400);
        try {
            daysInMonth(input.month, input.year);
        }
        catch {
            throw new AppError("Mês ou ano inválido.", 400);
        }
    }
}
export async function createPoll(input) {
    validatePoll(input);
    const slug = createToken(8);
    const adminToken = createToken(32);
    const poll = await transaction(async (client) => {
        const id = randomUUID();
        const result = await client.query(`insert into polls (id, slug, question, type, month, year, date_mode, expires_at, admin_token_hash)
       values ($1, $2, $3, $4::poll_type, $5, $6, $7::date_selection_mode, $8, $9)
       returning id, slug, question, type, month, year, date_mode as "dateMode", status,
                 expires_at as "expiresAt", created_at as "createdAt"`, [
            id,
            slug,
            input.question.trim(),
            input.type,
            input.type === "DATE_SELECTION" ? input.month : null,
            input.type === "DATE_SELECTION" ? input.year : null,
            input.type === "DATE_SELECTION" ? input.dateMode : null,
            input.expiresAt ? new Date(input.expiresAt) : null,
            hashToken(adminToken),
        ]);
        const options = [];
        for (const text of input.type === "DATE_SELECTION" ? [] : input.options) {
            const option = { id: randomUUID(), text: text.trim() };
            await client.query("insert into poll_options (id, poll_id, text) values ($1, $2, $3)", [option.id, id, option.text]);
            options.push(option);
        }
        return { ...result.rows[0], options };
    });
    return { poll, adminToken };
}
export async function getPoll(slug) {
    return findPoll("p.slug = $1", [slug]);
}
export async function getPollByAdminToken(token) {
    return findPoll("p.admin_token_hash = $1", [hashToken(token)]);
}
async function findPoll(where, values) {
    const result = await pool.query(`select p.id, p.slug, p.question, p.type, p.month, p.year,
    p.date_mode as "dateMode", p.status, p.expires_at as "expiresAt", p.created_at as "createdAt",
    coalesce(json_agg(json_build_object('id', o.id, 'text', o.text) order by o.created_at)
      filter (where o.id is not null), '[]') as options
    from polls p left join poll_options o on o.poll_id = p.id where ${where} group by p.id`, values);
    return result.rows[0] ?? null;
}
export async function closePoll(id) {
    await pool.query("update polls set status = 'CLOSED', updated_at = now() where id = $1", [id]);
}
export async function deletePoll(id) {
    await pool.query("delete from polls where id = $1", [id]);
}
