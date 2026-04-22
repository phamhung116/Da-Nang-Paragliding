export type AppLocale = "vi" | "en";

export const resolveLocaleTag = (_locale?: AppLocale) => "vi-VN";

export const formatCurrency = (value: string | number, locale?: AppLocale) =>
  new Intl.NumberFormat(resolveLocaleTag(locale), {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(Number(value));

export const formatDate = (
  value: string | Date,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  },
  locale?: AppLocale
) => new Intl.DateTimeFormat(resolveLocaleTag(locale), options).format(new Date(value));

export const formatDateTime = (
  value: string | Date | null,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  },
  locale?: AppLocale
) => (value ? new Intl.DateTimeFormat(resolveLocaleTag(locale), options).format(new Date(value)) : "-");

export const weekdayLabel = (value: string | Date, locale?: AppLocale) =>
  new Intl.DateTimeFormat(resolveLocaleTag(locale), {
    weekday: "short"
  }).format(new Date(value));

export const monthLabel = (year: number, month: number, locale?: AppLocale) =>
  new Intl.DateTimeFormat(resolveLocaleTag(locale), {
    month: "long",
    year: "numeric"
  }).format(new Date(year, month - 1, 1));
