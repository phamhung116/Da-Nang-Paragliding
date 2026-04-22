import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, Navigate } from "react-router-dom";
import { Badge, Button, Card, Container, Field, Input, Panel } from "@paragliding/ui";
import type { UpdateProfilePayload } from "@paragliding/api-client";
import { useAuth } from "@/shared/providers/auth-provider";
import { customerApi } from "@/shared/config/api";
import { accountSupportNotes } from "@/shared/constants/customer-content";
import { routes } from "@/shared/config/routes";
import { SiteLayout } from "@/widgets/layout/site-layout";

const normalizeFullName = (value: string) => value.trim().replace(/\s+/g, " ");
const normalizePhone = (value: string) => {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");
  return trimmed.startsWith("+") ? `+${digits}` : digits;
};

export const AccountPage = () => {
  const { account, isAuthenticated, updateProfile } = useAuth();

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
          <div className="section-heading">
            <div>
              <Badge>Tài khoản</Badge>
              <h2>Quản lý thông tin cá nhân và lịch sử booking</h2>
            </div>
            <p>Customer có thể cập nhật thông tin liên hệ để booking sau được điền nhanh và chính xác hơn.</p>
          </div>

          <div className="account-layout">
            <Card>
              <Panel className="stack">
                <Badge>Hồ sơ cá nhân</Badge>
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
                  <Field label="Họ và tên">
                    <Input
                      {...form.register("full_name", {
                        required: "Họ và tên là bắt buộc.",
                        validate: (value) =>
                          normalizeFullName(value ?? "").length >= 2 || "Họ và tên phải có ít nhất 2 ký tự."
                      })}
                    />
                  </Field>
                  {form.formState.errors.full_name ? (
                    <p className="form-error">{form.formState.errors.full_name.message}</p>
                  ) : null}
                  <Field label="Số điện thoại">
                    <Input
                      {...form.register("phone", {
                        required: "Số điện thoại là bắt buộc.",
                        validate: (value) => {
                          const digits = normalizePhone(value ?? "").replace("+", "");
                          return digits.length >= 9 && digits.length <= 15 || "Số điện thoại không hợp lệ.";
                        }
                      })}
                    />
                  </Field>
                  {form.formState.errors.phone ? (
                    <p className="form-error">{form.formState.errors.phone.message}</p>
                  ) : null}
                  {updateProfileMutation.isSuccess ? (
                    <div className="account-form-status is-success" role="status" aria-live="polite">
                      Đã lưu thông tin thành công.
                    </div>
                  ) : null}
                  {submitError ? (
                    <div className="account-form-status is-error" role="alert">
                      {submitError}
                    </div>
                  ) : null}
                  <Button disabled={updateProfileMutation.isPending}>
                    {updateProfileMutation.isPending ? "Đang lưu..." : "Lưu thông tin"}
                  </Button>
                </form>
              </Panel>
            </Card>

            <Card>
              <Panel className="stack">
                <Badge>Lịch sử booking</Badge>
                {bookings.length === 0 ? (
                  <div className="account-bookings">
                    <article className="account-booking-card">
                      <strong>Chưa có booking nào trong tài khoản này.</strong>
                      <span>Hãy chọn một gói dịch vụ và đặt lịch để bắt đầu lưu lịch sử booking.</span>
                    </article>
                  </div>
                ) : (
                  <div className="account-bookings">
                    {bookings.map((booking) => (
                      <article key={booking.code} className="account-booking-card">
                        <strong>{booking.service_name}</strong>
                        <span>
                          {booking.flight_date} - {booking.flight_time}
                        </span>
                        <span>
                          {booking.payment_status} / {booking.flight_status}
                        </span>
                        <span>Mã booking: {booking.code}</span>
                        <Link to={`/account/bookings/${booking.code}`}>
                          <Button variant="secondary">Xem chi tiet booking</Button>
                        </Link>
                      </article>
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
                  <strong>Ghi chú hỗ trợ</strong>
                  <p>{item}</p>
                </Panel>
              </Card>
            ))}
          </div>
        </Container>
      </section>
    </SiteLayout>
  );
};
