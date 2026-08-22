import { PollType, Prisma } from "@prisma/client";
import { prisma } from "../prisma.js";
import { createToken, hashToken } from "../utils/tokens.js";
import { daysInMonth } from "../utils/dates.js";
import type { CreatePollInput } from "../types/poll.js";

const publicPoll = {
  id: true,
  slug: true,
  question: true,
  type: true,
  month: true,
  year: true,
  dateMode: true,
  status: true,
  expiresAt: true,
  createdAt: true,
  options: { select: { id: true, text: true } },
} satisfies Prisma.PollSelect;

function validatePoll(input: CreatePollInput): void {
  if (!input.question?.trim() || input.question.trim().length > 500)
    throw new Error("A pergunta deve ter entre 1 e 500 caracteres.");
  if (!Object.values(PollType).includes(input.type as PollType))
    throw new Error("Tipo de enquete inválido.");
  if (input.type !== "DATE_SELECTION") {
    const options =
      input.options?.map((option) => option.trim()).filter(Boolean) ?? [];
    if (
      options.length < 2 ||
      options.length > 30 ||
      new Set(options.map((option) => option.toLowerCase())).size !==
        options.length
    )
      throw new Error("Informe de 2 a 30 opções únicas.");
  } else {
    if (!input.month || !input.year) throw new Error("Informe mês e ano.");
    if (!input.dateMode)
      throw new Error("Informe se a enquete aceita um ou vários dias.");
    daysInMonth(input.month, input.year);
  }
}

export async function createPoll(input: CreatePollInput) {
  validatePoll(input);
  const slug = createToken(8);
  const adminToken = createToken(32);
  const poll = await prisma.poll.create({
    data: {
      slug,
      question: input.question.trim(),
      type: input.type,
      month: input.type === "DATE_SELECTION" ? input.month : null,
      year: input.type === "DATE_SELECTION" ? input.year : null,
      dateMode: input.type === "DATE_SELECTION" ? input.dateMode : null,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      adminTokenHash: hashToken(adminToken),
      options:
        input.type === "DATE_SELECTION"
          ? undefined
          : { create: input.options!.map((text) => ({ text: text.trim() })) },
    },
    select: publicPoll,
  });
  return { poll, adminToken };
}

export async function getPoll(slug: string) {
  return prisma.poll.findUnique({ where: { slug }, select: publicPoll });
}

export async function getPollByAdminToken(token: string) {
  return prisma.poll.findUnique({
    where: { adminTokenHash: hashToken(token) },
    select: publicPoll,
  });
}
