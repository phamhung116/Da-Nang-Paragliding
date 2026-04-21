export const flightStatusLabels: Record<string, string> = {
  WAITING_CONFIRMATION: "Chờ xác nhận",
  WAITING: "Đang chờ",
  PICKING_UP: "Đang di chuyển đến điểm đón",
  EN_ROUTE: "Đang di chuyển đến điểm bay",
  FLYING: "Đang bay",
  LANDED: "Đã hạ cánh"
};

export const approvalStatusLabels: Record<string, string> = {
  PENDING: "Chờ duyệt",
  CONFIRMED: "Đã xác nhận",
  REJECTED: "Đã hủy",
  CANCELLED: "Đã hủy"
};

export const paymentStatusLabels: Record<string, string> = {
  AWAITING_CASH: "Chờ thanh toán",
  PENDING: "Chờ thanh toán online",
  PAID: "Đã thanh toán",
  FAILED: "Thanh toán thất bại",
  EXPIRED: "Đã hết hạn thanh toán"
};
