export type PollType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "DATE_SELECTION";
export type DateSelectionMode = "ONE_DAY" | "MULTIPLE_DAYS";

export interface CreatePollInput {
  question: string;
  type: PollType;
  options?: string[];
  month?: number;
  year?: number;
  dateMode?: DateSelectionMode;
  expiresAt?: string;
}

export interface PollRecord {
  id: string;
  slug: string;
  question: string;
  type: PollType;
  month: number | null;
  year: number | null;
  dateMode: DateSelectionMode | null;
  status: "OPEN" | "CLOSED";
  expiresAt: Date | null;
  createdAt: Date;
  options: { id: string; text: string }[];
}
