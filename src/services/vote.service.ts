import { randomUUID } from "node:crypto";
import { pool, transaction } from "../database.js";
import { dateKey, daysInMonth } from "../utils/dates.js";
import { hashToken } from "../utils/tokens.js";
import { AppError } from "../utils/errors.js";

export async function createVote(
  slug: string,
  voterToken: string,
  selectedOptionIds: string[] = [],
  selectedDays: number[] = [],
) {
  if (!voterToken || voterToken.length < 20 || voterToken.length > 200)
    throw new AppError("Token de participante inválido.", 400);
  return transaction(async (client) => {
    const result = await client.query(
      `select p.*, coalesce(json_agg(json_build_object('id', o.id))
      filter (where o.id is not null), '[]') options from polls p left join poll_options o on o.poll_id = p.id
      where p.slug = $1 group by p.id`,
      [slug],
    );
    const poll = result.rows[0];
    if (!poll) throw new AppError("Enquete não encontrada.", 404);
    if (
      poll.status !== "OPEN" ||
      (poll.expires_at && poll.expires_at <= new Date())
    )
      throw new AppError("Esta enquete não está mais aberta.", 409);
    const optionIds = [...new Set(selectedOptionIds)];
    const days = [...new Set(selectedDays)];
    const pollOptionIds = new Set(
      (poll.options as { id: string }[]).map((option) => option.id),
    );
    if (poll.type === "SINGLE_CHOICE" && optionIds.length !== 1)
      throw new AppError("Escolha exatamente uma opção.", 400);
    if (
      poll.type === "MULTIPLE_CHOICE" &&
      (optionIds.length < 1 || optionIds.length > pollOptionIds.size)
    )
      throw new AppError("Selecione ao menos uma opção.", 400);
    if (
      poll.type !== "DATE_SELECTION" &&
      optionIds.some((id) => !pollOptionIds.has(id))
    )
      throw new AppError("Opção inválida.", 400);
    if (poll.type === "DATE_SELECTION") {
      if (
        !poll.month ||
        !poll.year ||
        days.length < 1 ||
        days.some(
          (day) =>
            !Number.isInteger(day) ||
            day < 1 ||
            day > daysInMonth(poll.month, poll.year),
        )
      )
        throw new AppError("Selecione dias válidos deste mês.", 400);
      if (poll.date_mode === "ONE_DAY" && days.length !== 1)
        throw new AppError("Selecione exatamente um dia.", 400);
    }
    const voteId = randomUUID();
    try {
      await client.query(
        "insert into votes (id, poll_id, voter_token_hash) values ($1, $2, $3)",
        [voteId, poll.id, hashToken(voterToken)],
      );
    } catch (error) {
      if ((error as { code?: string }).code === "23505")
        throw new AppError("Este participante já votou nesta enquete.", 409);
      throw error;
    }
    for (const optionId of optionIds)
      await client.query(
        "insert into vote_options (id, vote_id, option_id) values ($1, $2, $3)",
        [randomUUID(), voteId, optionId],
      );
    for (const day of days)
      await client.query(
        "insert into vote_days (id, vote_id, date) values ($1, $2, $3)",
        [randomUUID(), voteId, dateKey(poll.year, poll.month, day)],
      );
    return { id: voteId };
  });
}

export async function getResults(slug: string) {
  const pollResult = await pool.query(
    "select slug, question, type, month, year, status from polls where slug = $1",
    [slug],
  );
  const poll = pollResult.rows[0];
  if (!poll) return null;
  const pollId = await pool.query("select id from polls where slug = $1", [
    slug,
  ]);
  const id = pollId.rows[0].id;
  const [participants, options, days] = await Promise.all([
    pool.query("select count(*)::int count from votes where poll_id = $1", [
      id,
    ]),
    pool.query(
      `select o.id, o.text, count(vo.id)::int count from poll_options o left join vote_options vo on vo.option_id = o.id
      where o.poll_id = $1 group by o.id order by o.created_at`,
      [id],
    ),
    pool.query(
      `select vd.date::text date, count(*)::int count from vote_days vd join votes v on v.id = vd.vote_id
      where v.poll_id = $1 group by vd.date order by vd.date`,
      [id],
    ),
  ]);
  const participantCount = participants.rows[0].count;
  return {
    poll,
    participantCount,
    options: options.rows.map((option) => ({
      ...option,
      percentage: participantCount
        ? Math.round((option.count / participantCount) * 100)
        : 0,
    })),
    days: days.rows,
  };
}
