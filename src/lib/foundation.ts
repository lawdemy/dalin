/*
 * The scholarship and school fees foundation: names and lists shared by the
 * public application form, its validation and the admin review pages.
 * The database (migration 0012) enforces the same lists.
 */

/** Placeholder name: change it here (and in the page copy) when it's decided. */
export const FOUNDATION_NAME = "DaLin Education Foundation";
export const FOUNDATION_SHORT = "the Foundation";

/** The 54 African countries (ISO 3166-1 alpha-2). Only their nationals may apply. */
export const AFRICAN_COUNTRIES = [
  { code: "NG", name: "Nigeria" },
  { code: "DZ", name: "Algeria" },
  { code: "AO", name: "Angola" },
  { code: "BJ", name: "Benin" },
  { code: "BW", name: "Botswana" },
  { code: "BF", name: "Burkina Faso" },
  { code: "BI", name: "Burundi" },
  { code: "CV", name: "Cabo Verde" },
  { code: "CM", name: "Cameroon" },
  { code: "CF", name: "Central African Republic" },
  { code: "TD", name: "Chad" },
  { code: "KM", name: "Comoros" },
  { code: "CG", name: "Congo" },
  { code: "CD", name: "Congo (DR)" },
  { code: "CI", name: "Côte d’Ivoire" },
  { code: "DJ", name: "Djibouti" },
  { code: "EG", name: "Egypt" },
  { code: "GQ", name: "Equatorial Guinea" },
  { code: "ER", name: "Eritrea" },
  { code: "SZ", name: "Eswatini" },
  { code: "ET", name: "Ethiopia" },
  { code: "GA", name: "Gabon" },
  { code: "GM", name: "Gambia" },
  { code: "GH", name: "Ghana" },
  { code: "GN", name: "Guinea" },
  { code: "GW", name: "Guinea-Bissau" },
  { code: "KE", name: "Kenya" },
  { code: "LS", name: "Lesotho" },
  { code: "LR", name: "Liberia" },
  { code: "LY", name: "Libya" },
  { code: "MG", name: "Madagascar" },
  { code: "MW", name: "Malawi" },
  { code: "ML", name: "Mali" },
  { code: "MR", name: "Mauritania" },
  { code: "MU", name: "Mauritius" },
  { code: "MA", name: "Morocco" },
  { code: "MZ", name: "Mozambique" },
  { code: "NA", name: "Namibia" },
  { code: "NE", name: "Niger" },
  { code: "RW", name: "Rwanda" },
  { code: "ST", name: "São Tomé and Príncipe" },
  { code: "SN", name: "Senegal" },
  { code: "SC", name: "Seychelles" },
  { code: "SL", name: "Sierra Leone" },
  { code: "SO", name: "Somalia" },
  { code: "ZA", name: "South Africa" },
  { code: "SS", name: "South Sudan" },
  { code: "SD", name: "Sudan" },
  { code: "TZ", name: "Tanzania" },
  { code: "TG", name: "Togo" },
  { code: "TN", name: "Tunisia" },
  { code: "UG", name: "Uganda" },
  { code: "ZM", name: "Zambia" },
  { code: "ZW", name: "Zimbabwe" },
] as const;

export type CountryCode = (typeof AFRICAN_COUNTRIES)[number]["code"];

export function countryName(code: string) {
  return AFRICAN_COUNTRIES.find((c) => c.code === code)?.name ?? code;
}

export const LEVELS = [
  { value: "primary", label: "Primary school" },
  { value: "junior_secondary", label: "Junior secondary school" },
  { value: "senior_secondary", label: "Senior secondary school" },
  {
    value: "undergraduate",
    label: "University, polytechnic or college (first degree, ND, HND, NCE)",
  },
  { value: "masters", label: "Master’s (MSc, MA, MBA …)" },
  { value: "phd", label: "PhD or doctorate" },
] as const;
export type Level = (typeof LEVELS)[number]["value"];

/** Levels where the applicant names a course of study. */
export const TERTIARY_LEVELS: readonly Level[] = ["undergraduate", "masters", "phd"];

export const SCHOOL_TYPES = [
  { value: "public", label: "Public (government) school" },
  { value: "private", label: "Private school" },
] as const;
export type SchoolType = (typeof SCHOOL_TYPES)[number]["value"];

export const SUPPORT_TYPES = [
  { value: "scholarship", label: "Academic scholarship (for strong results)" },
  { value: "school_fees", label: "School fees support (financial need)" },
  { value: "both", label: "Either or both" },
] as const;
export type SupportType = (typeof SUPPORT_TYPES)[number]["value"];

export const FEE_PERIODS = [
  { value: "term", label: "Per term" },
  { value: "semester", label: "Per semester" },
  { value: "session", label: "Per session / academic year" },
  { value: "programme", label: "Whole programme" },
] as const;
export type FeePeriod = (typeof FEE_PERIODS)[number]["value"];

export const CURRENCIES = [
  "NGN",
  "GHS",
  "KES",
  "ZAR",
  "EGP",
  "XOF",
  "XAF",
  "USD",
  "GBP",
  "EUR",
] as const;
export type Currency = (typeof CURRENCIES)[number];

export const DOCUMENT_KINDS = [
  { value: "fee_invoice", label: "School fees invoice or bill" },
  { value: "admission_letter", label: "Admission letter or proof of enrolment" },
  { value: "results", label: "Latest results or transcript" },
  { value: "id_document", label: "ID, passport or birth certificate" },
  { value: "other", label: "Other supporting document" },
] as const;
export type DocumentKind = (typeof DOCUMENT_KINDS)[number]["value"];

export const MAX_DOCUMENTS = 6;
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

export const APPLICATION_STATUSES = [
  { value: "new", label: "New" },
  { value: "reviewing", label: "Reviewing" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "approved", label: "Approved" },
  { value: "declined", label: "Declined" },
  { value: "funded", label: "Funded (paid)" },
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]["value"];

export function labelOf<T extends { value: string; label: string }>(
  list: readonly T[],
  value: string | null | undefined,
) {
  return list.find((i) => i.value === value)?.label ?? value ?? "";
}

/** Age in whole years on a given day (yyyy-mm-dd strings). */
export function ageOn(dateOfBirth: string, today: string) {
  const [by, bm, bd] = dateOfBirth.split("-").map(Number);
  const [ty, tm, td] = today.split("-").map(Number);
  return ty - by - (tm < bm || (tm === bm && td < bd) ? 1 : 0);
}
