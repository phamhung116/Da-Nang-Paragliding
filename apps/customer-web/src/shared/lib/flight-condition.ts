const normalizeCondition = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0111/g, "d")
    .replace(/\u0110/g, "D")
    .trim()
    .toLowerCase();

export const repairFlightConditionLabel = (value: string) => {
  const normalized = normalizeCondition(value);

  if (normalized === "ly tuong") {
    return "L\u00fd t\u01b0\u1edfng";
  }

  if (normalized === "khong ly tuong") {
    return "Kh\u00f4ng l\u00fd t\u01b0\u1edfng";
  }

  return value;
};
