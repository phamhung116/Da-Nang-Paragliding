import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, Navigate } from "react-router-dom";
import { Badge, Button, Card, Container, Field, Input, Panel } from "@paragliding/ui";
import type { UpdateProfilePayload } from "@paragliding/api-client";
import { useAuth } from "@/shared/providers/auth-provider";
import { customerApi } from "@/shared/config/api";
import { accountSupportNotes } from "@/shared/constants/customer-content";
import { flightStatusLabels, paymentStatusLabels } from "@/shared/constants/status";
import { routes } from "@/shared/config/routes";
import { localizeBookingServiceName } from "@/shared/lib/localized-content";
import { useI18n } from "@/shared/providers/i18n-provider";
import { SiteLayout } from "@/widgets/layout/site-layout";

const normalizeFullName = (value: string) => value.trim().replace(/\s+/g, " ");
const normalizePhone = (value: string) => {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");
  return trimmed.startsWith("+") ? `+${digits}` : digits;
};

type AccountBooking = Awaited<ReturnType<typeof customerApi.getMyBookings>>[number];

const AccountBookingCard = ({ booking }: { booking: AccountBooking }) => {
  const { locale, tText } = useI18n();
  const serviceName = localizeBookingServiceName(booking, locale);

  return (
    <article className="account-booking-card">
      <strong>{serviceName || booking.service_name}</strong>
      <span>
        {booking.flight_date} - {booking.flight_time}
      </span>
      <span>
        {tText(paymentStatusLabels[booking.payment_status] ?? booking.payment_status)} /{" "}
        {tText(flightStatusLabels[booking.flight_status] ?? booking.flight_status)}
      </span>
      <span>{tText("Mã đặt lịch")}: {booking.code}</span>
      <Link to={`/account/bookings/${booking.code}`}>
        <Button variant="secondary">{tText("Xem chi tiết đặt lịch")}</Button>
      </Link>
    </article>
  );
};

export const AccountPage = () => {
  const { account, isAuthenticated, updateProfile } = useAuth();
  const { tText } = useI18n();

  const form = useForm<UpdateProfilePayload>({
    defaultValues: {
      full_name: "",
      phone: "",
      preferred_language: "vi"
    },
    mode: "onBlur"
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ["my-bookings"],
    queryFn: () => customerApi.getMyBookings(),
    enabled: isAuthenticated
  });

  useEffect(() => {
    if (!account) {
      return;
    }

    form.reset({
      full_name: account.full_name ?? "",
      phone: account.phone ?? "",
      preferred_language: "vi"
    });
  }, [account, form]);

  const updateProfileMutation = useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateProfile(payload),
    onSuccess: (nextAccount) => {
      form.reset({
        full_name: nextAccount.full_name ?? "",
        phone: nextAccount.phone ?? "",
        preferred_language: "vi"
      });
    }
  });

  useEffect(() => {
    const subscription = form.watch(() => {
      if (updateProfileMutation.isSuccess || updateProfileMutation.isError) {
        updateProfileMutation.reset();
      }
    });
    return () => subscription.unsubscribe();
  }, [form, updateProfileMutation]);

  if (!isAuthenticated) {
    return <Navigate to={routes.login} replace />;
  }

  const submitError =
    updateProfileMutation.error instanceof Error ? updateProfileMutation.error.message : null;

  return (
    <SiteLayout>
      <section className="section">
        <Container className="stack">
          <div className="account-layout">
            <Card>
              <Panel className="stack">
                <Badge>{tText("Hồ sơ cá nhân")}</Badge>
                <h2 className="detail-title">{account?.full_name}</h2>
                <p className="detail-copy">{account?.email}</p>
                <form
                  className="stack"
                  onSubmit={form.handleSubmit((values) =>
                    updateProfileMutation.mutate({
                      full_name: normalizeFullName(values.full_name ?? ""),
                      phone: normalizePhone(values.phone ?? ""),
                      preferred_language: "vi"
                    })
                  )}
                >
                  <Field label={tText("Họ và tên")}>
                    <Input
                      {...form.register("full_name", {
                        required: tText("Họ và tên là bắt buộc."),
                        validate: (value) =>
                          normalizeFullName(value ?? "").length >= 2 || tText("Họ và tên phải có ít nhất 2 ký tự.")
                      })}
                    />
                  </Field>
                  {form.formState.errors.full_name ? (
                    <p className="form-error">{form.formState.errors.full_name.message}</p>
                  ) : null}
                  <Field label={tText("Số điện thoại")}>
                    <Input
                      {...form.register("phone", {
                        required: tText("Số điện thoại là bắt buộc."),
                        validate: (value) => {
                          const digits = normalizePhone(value ?? "").replace("+", "");
                          return digits.length >= 9 && digits.length <= 15 || tText("Số điện thoại không hợp lệ.");
                        }
                      })}
                    />
                  </Field>
                  {form.formState.errors.phone ? (
                    <p className="form-error">{form.formState.errors.phone.message}</p>
                  ) : null}
                  {updateProfileMutation.isSuccess ? (
                    <div className="account-form-status is-success" role="status" aria-live="polite">
                      {tText("Đã lưu thông tin thành công.")}
                    </div>
                  ) : null}
                  {submitError ? (
                    <div className="account-form-status is-error" role="alert">
                      {submitError}
                    </div>
                  ) : null}
                  <Button disabled={updateProfileMutation.isPending}>
                    {updateProfileMutation.isPending ? tText("Đang lưu...") : tText("Lưu thông tin")}
                  </Button>
                </form>
              </Panel>
            </Card>

            <Card>
              <Panel className="stack">
                <Badge>{tText("Lịch sử đặt lịch")}</Badge>
                {bookings.length === 0 ? (
                  <div className="account-bookings">
                    <article className="account-booking-card">
                      <strong>{tText("Chưa có lịch đặt nào trong tài khoản này.")}</strong>
                      <span>{tText("Hãy chọn một gói dịch vụ và đặt lịch để bắt đầu lưu lịch sử đặt lịch.")}</span>
                    </article>
                  </div>
                ) : (
                  <div className="account-bookings">
                    {bookings.map((booking) => (
                      <AccountBookingCard key={booking.code} booking={booking} />
                    ))}
                  </div>
                )}
              </Panel>
            </Card>
          </div>

          <div className="info-grid">
            {accountSupportNotes.map((item) => (
              <Card key={item} className="info-card">
                <Panel className="stack-sm">
                  <strong>{tText("Ghi chú hỗ trợ")}</strong>
                  <p>{tText(item)}</p>
                </Panel>
              </Card>
            ))}
          </div>
        </Container>
      </section>
    </SiteLayout>
  );
};
