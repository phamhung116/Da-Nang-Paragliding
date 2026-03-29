export const flightStatusLabels: Record<string, string> = {
  WAITING: "Dang cho",
  EN_ROUTE: "Dang di chuyen den diem bay",
  FLYING: "Dang bay",
  LANDED: "Da ha canh"
};

export const approvalStatusLabels: Record<string, string> = {
  PENDING: "Cho duyet",
  CONFIRMED: "Da xac nhan",
  REJECTED: "Da tu choi"
};

export const paymentStatusLabels: Record<string, string> = {
  AWAITING_CASH: "Thanh toan tai diem bay",
  PENDING: "Cho thanh toan online",
  PAID: "Da thanh toan",
  FAILED: "Thanh toan that bai",
  EXPIRED: "Da het han thanh toan"
};
