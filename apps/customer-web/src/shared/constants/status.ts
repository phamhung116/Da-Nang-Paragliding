export const flightStatusLabels: Record<string, string> = {
  WAITING_CONFIRMATION: "Cho xac nhan",
  WAITING: "Dang cho",
  PICKING_UP: "Dang di chuyen den diem don",
  EN_ROUTE: "Dang di chuyen den diem bay",
  FLYING: "Dang bay",
  LANDED: "Da ha canh"
};

export const approvalStatusLabels: Record<string, string> = {
  PENDING: "Cho duyet",
  CONFIRMED: "Da xac nhan",
  REJECTED: "Da huy",
  CANCELLED: "Da huy"
};

export const paymentStatusLabels: Record<string, string> = {
  AWAITING_CASH: "Cho thanh toan",
  PENDING: "Cho thanh toan online",
  PAID: "Da thanh toan",
  FAILED: "Thanh toan that bai",
  EXPIRED: "Da het han thanh toan"
};
