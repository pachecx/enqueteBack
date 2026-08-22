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
