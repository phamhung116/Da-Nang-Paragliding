const normalizeCondition = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .trim()
    .toLowerCase();

export const repairFlightConditionLabel = (value: string) => {
  const normalized = normalizeCondition(value);

  if (normalized === "ly tuong") {
    return "Lý tưởng";
  }

  if (normalized === "khong ly tuong") {
    return "Không lý tưởng";
  }

  return value;
};
