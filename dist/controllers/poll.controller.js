import { z } from "zod";
import { createPoll, getPoll, getPollByAdminToken, } from "../services/poll.service.js";
import { createVote, getResults } from "../services/vote.service.js";
import { createToken } from "../utils/tokens.js";
import { prisma } from "../prisma.js";
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
        const result = await createPoll(createSchema.parse(req.body));
        res.status(201).json(result);
    }
    catch (error) {
        res.status(400).json({
            error: error instanceof Error ? error.message : "Dados inválidos.",
        });
    }
}
export async function showPoll(req, res) {
    const poll = await getPoll(String(req.params.slug));
    if (!poll)
        return res.status(404).json({ error: "Enquete não encontrada." });
    return res.json(poll);
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
        return res.status(400).json({
            error: error instanceof Error
                ? error.message
                : "Não foi possível registrar o voto.",
        });
    }
}
export async function showResults(req, res) {
    const results = await getResults(String(req.params.slug));
    if (!results)
        return res.status(404).json({ error: "Enquete não encontrada." });
    return res.json(results);
}
export async function showAdmin(req, res) {
    const poll = await getPollByAdminToken(String(req.params.token));
    if (!poll)
        return res.status(404).json({ error: "Link administrativo inválido." });
    const results = await getResults(poll.slug);
    return res.json({ poll, results });
}
export async function closePoll(req, res) {
    const poll = await getPollByAdminToken(String(req.params.token));
    if (!poll)
        return res.status(404).json({ error: "Link administrativo inválido." });
    await prisma.poll.update({
        where: { id: poll.id },
        data: { status: "CLOSED" },
    });
    return res.json({ message: "Enquete encerrada." });
}
export async function deletePoll(req, res) {
    const poll = await getPollByAdminToken(String(req.params.token));
    if (!poll)
        return res.status(404).json({ error: "Link administrativo inválido." });
    await prisma.poll.delete({ where: { id: poll.id } });
    return res.status(204).send();
}
