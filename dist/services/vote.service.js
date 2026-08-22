import { PollType } from "@prisma/client";
import { prisma } from "../prisma.js";
import { dateKey, daysInMonth } from "../utils/dates.js";
import { hashToken } from "../utils/tokens.js";
export async function createVote(slug, voterToken, selectedOptionIds = [], selectedDays = []) {
    if (!voterToken || voterToken.length < 20 || voterToken.length > 200)
        throw new Error("Token de participante inválido.");
    const poll = await prisma.poll.findUnique({
        where: { slug },
        include: { options: true },
    });
    if (!poll)
        throw new Error("Enquete não encontrada.");
    if (poll.status !== "OPEN" ||
        (poll.expiresAt && poll.expiresAt <= new Date()))
        throw new Error("Esta enquete não está mais aberta.");
    const optionIds = [...new Set(selectedOptionIds)];
    const days = [...new Set(selectedDays)];
    if (poll.type === PollType.SINGLE_CHOICE && optionIds.length !== 1)
        throw new Error("Escolha exatamente uma opção.");
    if (poll.type === PollType.MULTIPLE_CHOICE &&
        (optionIds.length < 1 || optionIds.length > poll.options.length))
        throw new Error("Selecione ao menos uma opção.");
    if (poll.type === PollType.DATE_SELECTION) {
        if (!poll.month ||
            !poll.year ||
            days.length < 1 ||
            days.some((day) => !Number.isInteger(day) ||
                day < 1 ||
                day > daysInMonth(poll.month, poll.year)))
            throw new Error("Selecione dias válidos deste mês.");
        if (poll.dateMode === "ONE_DAY" && days.length !== 1)
            throw new Error("Selecione exatamente um dia.");
    }
    if (poll.type !== PollType.DATE_SELECTION &&
        optionIds.some((id) => !poll.options.some((option) => option.id === id)))
        throw new Error("Opção inválida.");
    return prisma.vote.create({
        data: {
            pollId: poll.id,
            voterTokenHash: hashToken(voterToken),
            options: { create: optionIds.map((optionId) => ({ optionId })) },
            days: {
                create: days.map((day) => ({
                    date: new Date(`${dateKey(poll.year, poll.month, day)}T00:00:00.000Z`),
                })),
            },
        },
        select: { id: true },
    });
}
export async function getResults(slug) {
    const poll = await prisma.poll.findUnique({
        where: { slug },
        include: {
            options: { include: { _count: { select: { votes: true } } } },
            votes: { include: { days: true } },
        },
    });
    if (!poll)
        return null;
    const participantCount = poll.votes.length;
    const optionResults = poll.options.map((option) => ({
        id: option.id,
        text: option.text,
        count: option._count.votes,
        percentage: participantCount
            ? Math.round((option._count.votes / participantCount) * 100)
            : 0,
    }));
    const dayCounts = new Map();
    for (const vote of poll.votes)
        for (const day of vote.days) {
            const key = day.date.toISOString().slice(0, 10);
            dayCounts.set(key, (dayCounts.get(key) ?? 0) + 1);
        }
    const days = [...dayCounts.entries()]
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
    return {
        poll: {
            slug: poll.slug,
            question: poll.question,
            type: poll.type,
            month: poll.month,
            year: poll.year,
            status: poll.status,
        },
        participantCount,
        options: optionResults,
        days,
    };
}
