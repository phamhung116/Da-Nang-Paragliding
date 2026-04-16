import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, Navigate } from "react-router-dom";
import { Badge, Button, Card, Container, Field, Input, Panel, Select } from "@paragliding/ui";
import type { UpdateProfilePayload } from "@paragliding/api-client";
import { useAuth } from "@/shared/providers/auth-provider";
import { useI18n } from "@/shared/providers/i18n-provider";
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
  const { setLocale } = useI18n();

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
      preferred_language: account.preferred_language === "en" ? "en" : "vi"
    });
  }, [account, form]);

  const updateProfileMutation = useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateProfile(payload),
    onSuccess: (nextAccount) => {
      form.reset({
        full_name: nextAccount.full_name ?? "",
        phone: nextAccount.phone ?? "",
        preferred_language: nextAccount.preferred_language === "en" ? "en" : "vi"
      });

      if (nextAccount.preferred_language === "en" || nextAccount.preferred_language === "vi") {
        setLocale(nextAccount.preferred_language);
      }
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
              <Badge>Tai khoan</Badge>
              <h2>Quan ly thong tin ca nhan va lich su booking</h2>
            </div>
            <p>Customer co the cap nhat thong tin lien he de booking sau duoc dien nhanh va chinh xac hon.</p>
          </div>

          <div className="account-layout">
            <Card>
              <Panel className="stack">
                <Badge>Ho so ca nhan</Badge>
                <h2 className="detail-title">{account?.full_name}</h2>
                <p className="detail-copy">{account?.email}</p>
                <form
                  className="stack"
                  onSubmit={form.handleSubmit((values) =>
                    updateProfileMutation.mutate({
                      full_name: normalizeFullName(values.full_name ?? ""),
                      phone: normalizePhone(values.phone ?? ""),
                      preferred_language: values.preferred_language === "en" ? "en" : "vi"
                    })
                  )}
                >
                  <Field label="Ho va ten">
                    <Input
                      {...form.register("full_name", {
                        required: "Ho va ten la bat buoc.",
                        validate: (value) =>
                          normalizeFullName(value ?? "").length >= 2 || "Ho va ten phai co it nhat 2 ky tu."
                      })}
                    />
                  </Field>
                  {form.formState.errors.full_name ? (
                    <p className="form-error">{form.formState.errors.full_name.message}</p>
                  ) : null}
                  <Field label="So dien thoai">
                    <Input
                      {...form.register("phone", {
                        required: "So dien thoai la bat buoc.",
                        validate: (value) => {
                          const digits = normalizePhone(value ?? "").replace("+", "");
                          return digits.length >= 9 && digits.length <= 15 || "So dien thoai khong hop le.";
                        }
                      })}
                    />
                  </Field>
                  {form.formState.errors.phone ? (
                    <p className="form-error">{form.formState.errors.phone.message}</p>
                  ) : null}
                  <Field label="Ngon ngu">
                    <Select {...form.register("preferred_language")}>
                      <option value="vi">Tieng Viet</option>
                      <option value="en">English</option>
                    </Select>
                  </Field>
                  {updateProfileMutation.isSuccess ? (
                    <div className="account-form-status is-success" role="status" aria-live="polite">
                      Da luu thong tin thanh cong.
                    </div>
                  ) : null}
                  {submitError ? (
                    <div className="account-form-status is-error" role="alert">
                      {submitError}
                    </div>
                  ) : null}
                  <Button disabled={updateProfileMutation.isPending}>
                    {updateProfileMutation.isPending ? "Dang luu..." : "Luu thong tin"}
                  </Button>
                </form>
              </Panel>
            </Card>

            <Card>
              <Panel className="stack">
                <Badge>Lich su booking</Badge>
                {bookings.length === 0 ? (
                  <div className="account-bookings">
                    <article className="account-booking-card">
                      <strong>Chua co booking nao trong tai khoan nay.</strong>
                      <span>Hay chon mot goi dich vu va dat lich de bat dau luu lich su booking.</span>
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
                        <span>Ma booking: {booking.code}</span>
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
                  <strong>Ghi chu ho tro</strong>
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
