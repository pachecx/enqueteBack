import { z } from "zod";
import { createPoll, closePoll as closePollService, deletePoll as deletePollService, getPoll, getPollByAdminToken, } from "../services/poll.service.js";
import { createVote, getResults } from "../services/vote.service.js";
import { createToken } from "../utils/tokens.js";
import { statusCodeFor } from "../utils/errors.js";
const createSchema = z.object({
    question: z.string(),
    type: z.enum(["SINGLE_CHOICE", "MULTIPLE_CHOICE", "DATE_SELECTION"]),
    options: z.array(z.string()).optional(),
    month: z.number().int().optional(),
    year: z.number().int().optional(),
    dateMode: z.enum(["ONE_DAY", "MULTIPLE_DAYS"]).optional(),
    expiresAt: z.string().datetime().optional(),
});
const voteSchema = z.object({
    optionIds: z.array(z.string()).optional(),
    days: z.array(z.number().int()).optional(),
});
export async function postPoll(req, res) {
    try {
        const result = await createPoll(createSchema.parse(req.body), req.user?.id);
        res.status(201).json(result);
    }
    catch (error) {
        res.status(statusCodeFor(error)).json({
            error: error instanceof Error ? error.message : "Dados inválidos.",
        });
    }
}
export async function showPoll(req, res) {
    try {
        const poll = await getPoll(String(req.params.slug));
        if (!poll)
            return res.status(404).json({ error: "Enquete não encontrada." });
        return res.json(poll);
    }
    catch (error) {
        return res
            .status(statusCodeFor(error))
            .json({ error: "Erro interno do servidor." });
    }
}
export async function postVote(req, res) {
    try {
        const token = req.cookies?.voterToken ?? createToken(32);
        const { optionIds = [], days = [] } = voteSchema.parse(req.body);
        const result = await createVote(String(req.params.slug), token, optionIds, days);
        res.cookie("voterToken", token, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: 1000 * 60 * 60 * 24 * 365,
        });
        return res.status(201).json(result);
    }
    catch (error) {
        return res.status(statusCodeFor(error)).json({
            error: error instanceof Error
                ? error.message
                : "Não foi possível registrar o voto.",
        });
    }
}
export async function showResults(req, res) {
    try {
        const results = await getResults(String(req.params.slug));
        if (!results)
            return res.status(404).json({ error: "Enquete não encontrada." });
        return res.json(results);
    }
    catch (error) {
        return res
            .status(statusCodeFor(error))
            .json({ error: "Erro interno do servidor." });
    }
}
export async function showAdmin(req, res) {
    const poll = await getPollByAdminToken(String(req.params.token));
    if (!poll)
        return res.status(401).json({ error: "Link administrativo inválido." });
    const results = await getResults(poll.slug);
    return res.json({ poll, results });
}
export async function closePoll(req, res) {
    const poll = await getPollByAdminToken(String(req.params.token));
    if (!poll)
        return res.status(401).json({ error: "Link administrativo inválido." });
    await closePollService(poll.id);
    return res.json({ message: "Enquete encerrada." });
}
export async function deletePoll(req, res) {
    const poll = await getPollByAdminToken(String(req.params.token));
    if (!poll)
        return res.status(401).json({ error: "Link administrativo inválido." });
    await deletePollService(poll.id);
    return res.status(204).send();
}
