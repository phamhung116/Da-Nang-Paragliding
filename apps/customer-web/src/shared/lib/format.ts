export const formatCurrency = (value: string | number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(Number(value));

export const formatDate = (value: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));

export const weekdayLabel = (value: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    weekday: "short"
  }).format(new Date(value));

export const monthLabel = (year: number, month: number) =>
  new Intl.DateTimeFormat("vi-VN", {
    month: "long",
    year: "numeric"
  }).format(new Date(year, month - 1, 1));
