import { useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Button, Card, Container, Panel } from "@paragliding/ui";
import type { PaymentTransaction } from "@paragliding/api-client";
import { customerApi } from "@/shared/config/api";
import { checkoutGuidelines } from "@/shared/constants/customer-content";
import { approvalStatusLabels, paymentStatusLabels } from "@/shared/constants/status";
import { formatCurrency, formatDateTime } from "@/shared/lib/format";
import { localizeBookingServiceName } from "@/shared/lib/localized-content";
import { checkoutStorage } from "@/shared/lib/storage";
import { useI18n } from "@/shared/providers/i18n-provider";
import { SiteLayout } from "@/widgets/layout/site-layout";

type CheckoutState = Awaited<ReturnType<typeof customerApi.createBooking>> & {
  transaction?: PaymentTransaction | null;
};

export const CheckoutPage = () => {
  const { locale, tText } = useI18n();
  const [checkoutState, setCheckoutState] = useState<CheckoutState | null>(() =>
    checkoutStorage.get<CheckoutState>()
  );

  const paymentMutation = useMutation({
    mutationFn: (code: string) => customerApi.completePayment(code),
    onSuccess: (result) => {
      if (checkoutState) {
        const nextState = {
          ...checkoutState,
          booking: result.booking,
          transaction: result.transaction
        };
        checkoutStorage.set(nextState);
        setCheckoutState(nextState);
      }
    }
  });

  const transaction = checkoutState?.transaction ?? null;
  const paymentSession = checkoutState?.payment_session ?? null;
  const expiresAt = useMemo(
    () => (paymentSession?.expires_at ? new Date(paymentSession.expires_at) : null),
    [paymentSession?.expires_at]
  );
  const isExpired = Boolean(expiresAt && expiresAt.getTime() <= Date.now());
  const serviceName = checkoutState ? localizeBookingServiceName(checkoutState.booking, locale) : "";

  if (!checkoutState) {
    return (
      <SiteLayout>
        <section className="section">
          <Container className="stack">
            <Badge tone="danger">{tText("Chưa có lịch đặt")}</Badge>
            <p>{tText("Hãy tạo lịch đặt trước khi vào trang thanh toán.")}</p>
            <Link to="/services">
              <Button variant="secondary">{tText("Chọn gói dịch vụ")}</Button>
            </Link>
          </Container>
        </section>
      </SiteLayout>
    );
  }

  const { booking } = checkoutState;

  return (
    <SiteLayout>
      <section className="section">
        <Container className="stack">
          <div className="section-heading">
            <div>
              <Badge>{tText(paymentStatusLabels[booking.payment_status] ?? booking.payment_status)}</Badge>
              <h2>{tText("Thanh toán và xác nhận lịch đặt")}</h2>
            </div>
            <p>
              {tText("Sau khi thanh toán thành công, lịch đặt sẽ chuyển sang đã xác nhận và khách hàng có thể vào trang theo dõi để xem hành trình.")}
            </p>
          </div>

          <div className="info-grid">
            {checkoutGuidelines.map((item) => (
              <Card key={item} className="info-card">
                <Panel className="stack-sm">
                  <strong>{tText("Hướng dẫn thanh toán")}</strong>
                  <p>{tText(item)}</p>
                </Panel>
              </Card>
            ))}
          </div>

          <div className="checkout-grid">
            <Card className="checkout-summary-card">
              <Panel className="stack">
                <div className="checkout-summary-card__head">
                  <Badge>{tText(paymentStatusLabels[booking.payment_status] ?? booking.payment_status)}</Badge>
                  <h2 className="checkout-summary-card__code">{booking.code}</h2>
                </div>

                <div className="checkout-summary-card__list">
                  <div className="booking-summary-card__fact">
                    <span>{tText("Dịch vụ")}</span>
                    <strong>{serviceName || booking.service_name}</strong>
                  </div>
                  <div className="booking-summary-card__fact">
                    <span>{tText("Lịch bay")}</span>
                    <strong>
                      {booking.flight_date} - {booking.flight_time}
                    </strong>
                  </div>
                  <div className="booking-summary-card__fact">
                    <span>{tText("Tổng giá trị")}</span>
                    <strong>{formatCurrency(booking.final_total)}</strong>
                  </div>
                  <div className="booking-summary-card__fact">
                    <span>{tText("Di chuyển")}</span>
                    <strong>{booking.pickup_option === "pickup" ? tText("Xe đến đón") : tText("Tự đến")}</strong>
                  </div>
                  {booking.pickup_option === "pickup" ? (
                    <div className="booking-summary-card__fact">
                      <span>{tText("Địa chỉ đón")}</span>
                      <strong>{booking.pickup_address ?? tText("Đang cập nhật")}</strong>
                    </div>
                  ) : null}
                  <div className="booking-summary-card__fact">
                    <span>{tText("Trạng thái")}</span>
                    <strong>{tText(approvalStatusLabels[booking.approval_status] ?? booking.approval_status)}</strong>
                  </div>
                </div>
              </Panel>
            </Card>

            <Card className="checkout-action-card">
              <Panel className="stack">
                <Badge>{tText("Đặt cọc bằng QR")}</Badge>
                    <p className="detail-copy">
                      {tText("Thanh toán số tiền trả trước qua cổng thanh toán. Sau khi nhà cung cấp trả về trạng thái đã thanh toán, lịch đặt sẽ được xác nhận và email xác nhận sẽ được gửi cho khách.")}
                    </p>
                    <div className="checkout-qr">
                      <img src={paymentSession?.qr_code_url} alt={`QR ${booking.code}`} />
                      <div className="stack-sm">
                        <div className="booking-summary-card__fact">
                          <span>{tText("Số tiền đặt cọc")}</span>
                          <strong>{formatCurrency(paymentSession?.amount ?? "0")}</strong>
                        </div>
                        <div className="booking-summary-card__fact">
                          <span>{tText("Nội dung chuyển khoản")}</span>
                          <strong>{paymentSession?.transfer_content}</strong>
                        </div>
                        <div className="booking-summary-card__fact">
                          <span>{tText("Hết hạn lúc")}</span>
                          <strong>{formatDateTime(expiresAt)}</strong>
                        </div>
                      </div>
                    </div>
                    {transaction ? (
                      <div className="booking-summary-card__fact">
                        <span>{tText("Giao dịch")}</span>
                        <strong>{transaction.provider_reference}</strong>
                      </div>
                    ) : null}
                    {paymentSession?.payment_url ? (
                      <a href={paymentSession.payment_url} target="_blank" rel="noreferrer">
                        <Button>{tText("Mở cổng thanh toán")}</Button>
                      </a>
                    ) : null}
                    <Button
                      onClick={() => paymentMutation.mutate(booking.code)}
                      disabled={
                        paymentMutation.isPending || booking.payment_status === "PAID" || isExpired
                      }
                    >
                      {booking.payment_status === "PAID"
                        ? tText("Đã thanh toán")
                        : isExpired
                          ? tText("QR đã hết hạn")
                        : paymentMutation.isPending
                            ? tText("Đang xử lý...")
                            : tText("Kiểm tra trạng thái thanh toán")}
                    </Button>
                    {paymentMutation.isSuccess && booking.payment_status !== "PAID" ? (
                      <p className="calendar-selection-note">
                        {tText("Hệ thống chưa nhận được trạng thái đã thanh toán từ cổng thanh toán. Hãy kiểm tra lại sau khi thanh toán xong.")}
                      </p>
                    ) : null}
                <Link to="/tracking">
                  <Button variant="secondary">{tText("Theo dõi hành trình bay")}</Button>
                </Link>
              </Panel>
            </Card>
          </div>
        </Container>
      </section>
    </SiteLayout>
  );
};
