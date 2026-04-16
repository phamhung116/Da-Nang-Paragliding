import { useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Button, Card, Container, Panel } from "@paragliding/ui";
import type { PaymentTransaction } from "@paragliding/api-client";
import { customerApi } from "@/shared/config/api";
import { checkoutGuidelines } from "@/shared/constants/customer-content";
import { paymentStatusLabels } from "@/shared/constants/status";
import { formatCurrency } from "@/shared/lib/format";
import { checkoutStorage } from "@/shared/lib/storage";
import { SiteLayout } from "@/widgets/layout/site-layout";

type CheckoutState = Awaited<ReturnType<typeof customerApi.createBooking>> & {
  transaction?: PaymentTransaction | null;
};

export const CheckoutPage = () => {
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

  if (!checkoutState) {
    return (
      <SiteLayout>
        <section className="section">
          <Container className="stack">
            <Badge tone="danger">Chua co booking</Badge>
            <p>Hay tao booking truoc khi vao trang thanh toan.</p>
            <Link to="/services">
              <Button variant="secondary">Chon goi dich vu</Button>
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
              <Badge>{paymentStatusLabels[booking.payment_status] ?? booking.payment_status}</Badge>
              <h2>Thanh toan va xac nhan booking</h2>
            </div>
            <p>
              Sau khi thanh toan thanh cong, booking se chuyen sang confirmed va customer co the vao tracking
              page de xem hanh trinh.
            </p>
          </div>

          <div className="info-grid">
            {checkoutGuidelines.map((item) => (
              <Card key={item} className="info-card">
                <Panel className="stack-sm">
                  <strong>Huong dan thanh toan</strong>
                  <p>{item}</p>
                </Panel>
              </Card>
            ))}
          </div>

          <div className="checkout-grid">
            <Card className="checkout-summary-card">
              <Panel className="stack">
                <div className="checkout-summary-card__head">
                  <Badge>{paymentStatusLabels[booking.payment_status] ?? booking.payment_status}</Badge>
                  <h2 className="checkout-summary-card__code">{booking.code}</h2>
                </div>

                <div className="checkout-summary-card__list">
                  <div className="booking-summary-card__fact">
                    <span>Service</span>
                    <strong>{booking.service_name}</strong>
                  </div>
                  <div className="booking-summary-card__fact">
                    <span>Lich bay</span>
                    <strong>
                      {booking.flight_date} - {booking.flight_time}
                    </strong>
                  </div>
                  <div className="booking-summary-card__fact">
                    <span>Tong gia tri</span>
                    <strong>{formatCurrency(booking.final_total)}</strong>
                  </div>
                  <div className="booking-summary-card__fact">
                    <span>Trang thai</span>
                    <strong>{booking.approval_status}</strong>
                  </div>
                </div>
              </Panel>
            </Card>

            <Card className="checkout-action-card">
              <Panel className="stack">
                <Badge>Dat coc bang QR</Badge>
                    <p className="detail-copy">
                      Dat coc {paymentSession?.deposit_percentage}% de xac nhan booking. Sau khi thanh toan
                      thanh cong, booking se duoc confirm va email xac nhan se duoc gui cho khach.
                    </p>
                    <div className="checkout-qr">
                      <img src={paymentSession?.qr_code_url} alt={`QR ${booking.code}`} />
                      <div className="stack-sm">
                        <div className="booking-summary-card__fact">
                          <span>So tien dat coc</span>
                          <strong>{formatCurrency(paymentSession?.amount ?? "0")}</strong>
                        </div>
                        <div className="booking-summary-card__fact">
                          <span>Noi dung chuyen khoan</span>
                          <strong>{paymentSession?.transfer_content}</strong>
                        </div>
                        <div className="booking-summary-card__fact">
                          <span>Het han luc</span>
                          <strong>{expiresAt?.toLocaleString("vi-VN")}</strong>
                        </div>
                      </div>
                    </div>
                    {transaction ? (
                      <div className="booking-summary-card__fact">
                        <span>Giao dich</span>
                        <strong>{transaction.provider_reference}</strong>
                      </div>
                    ) : null}
                    <Button
                      onClick={() => paymentMutation.mutate(booking.code)}
                      disabled={
                        paymentMutation.isPending || booking.payment_status === "PAID" || isExpired
                      }
                    >
                      {booking.payment_status === "PAID"
                        ? "Da thanh toan"
                        : isExpired
                          ? "QR da het han"
                        : paymentMutation.isPending
                            ? "Dang xu ly..."
                            : "Gia lap thanh toan thanh cong"}
                    </Button>
                <Link to="/tracking">
                  <Button variant="secondary">Theo doi hanh trinh bay</Button>
                </Link>
              </Panel>
            </Card>
          </div>
        </Container>
      </section>
    </SiteLayout>
  );
};
