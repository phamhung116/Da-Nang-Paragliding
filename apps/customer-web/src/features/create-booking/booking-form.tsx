import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import type { BookingCreatePayload } from "@paragliding/api-client";
import { Button, Card, Field, Input, Panel, Textarea } from "@paragliding/ui";
import { useAuth } from "@/shared/providers/auth-provider";
import { customerApi } from "@/shared/config/api";
import { formatCurrency } from "@/shared/lib/format";
import { checkoutStorage, trackingLookupStorage } from "@/shared/lib/storage";

type BookingFormProps = {
  serviceSlug: string;
  selectedDate: string;
  selectedTime: string;
};

type BookingSubmitForm = BookingCreatePayload & {
  agree_terms: boolean;
};

const paymentOptions = [
  {
    value: "wallet",
    title: "QR ví điện tử",
    description: "Thanh toán đặt cọc online bằng QR."
  },
  {
    value: "gateway",
    title: "QR cổng thanh toán",
    description: "Checkout online và nhận booking xác nhận ngay sau khi trả cọc."
  },
  {
    value: "bank_transfer",
    title: "QR chuyển khoản",
    description: "Hiển thị QR và nội dung chuyển khoản theo mã booking."
  }
] as const;

const PICKUP_FEE = 50000;
const DEPOSIT_PERCENT = 40;

export const BookingForm = ({ serviceSlug, selectedDate, selectedTime }: BookingFormProps) => {
  const navigate = useNavigate();
  const { account } = useAuth();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const accountNeedsContactDetails = !account?.phone || account.phone.startsWith("EMAIL");
  const accountPhone = accountNeedsContactDetails ? "" : account?.phone ?? "";
  const { data: servicePackage } = useQuery({
    queryKey: ["service", serviceSlug],
    queryFn: () => customerApi.getService(serviceSlug)
  });

  const defaultValues = useMemo<BookingSubmitForm>(
    () => ({
      service_slug: serviceSlug,
      flight_date: selectedDate,
      flight_time: selectedTime,
      customer_name: account?.full_name ?? "",
      phone: accountPhone,
      email: account?.email ?? "",
      adults: 1,
      children: 0,
      notes: "",
      payment_method: "bank_transfer",
      pickup_option: "self",
      pickup_address: "",
      agree_terms: false
    }),
    [account?.email, account?.full_name, accountPhone, selectedDate, selectedTime, serviceSlug]
  );

  const { register, handleSubmit, watch, formState, reset } = useForm<BookingSubmitForm>({
    defaultValues,
    mode: "onChange"
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const paymentMethod = watch("payment_method");
  const pickupOption = watch("pickup_option");
  const adults = Number(watch("adults") ?? 0);
  const children = Number(watch("children") ?? 0);
  const totalGuests = Math.max(0, adults + children);
  const tourTotal = Number(servicePackage?.price ?? 0) * totalGuests;
  const pickupFee = pickupOption === "pickup" ? PICKUP_FEE : 0;
  const finalTotal = tourTotal + pickupFee;
  const depositAmount = tourTotal * (DEPOSIT_PERCENT / 100) + pickupFee;

  const mutation = useMutation({
    mutationFn: ({ agree_terms: _, ...payload }: BookingSubmitForm) => customerApi.createBooking(payload),
    onSuccess: (result) => {
      setSuccessMessage(`Đặt lịch thành công. Mã booking ${result.booking.code}. Đang chuyển sang bước thanh toán đặt cọc...`);
      checkoutStorage.set(result);
      trackingLookupStorage.set(account?.email ?? account?.phone ?? "");
      window.setTimeout(() => navigate("/checkout"), 900);
    }
  });

  return (
    <div className="booking-form-layout">
      {successMessage ? <div className="booking-toast">{successMessage}</div> : null}
      <Card>
        <Panel className="booking-summary-card">
          <h3>Tóm tắt booking</h3>
          <div className="booking-summary-card__fact">
            <span>Dịch vụ</span>
            <strong>{servicePackage?.name ?? serviceSlug}</strong>
          </div>
          <div className="booking-summary-card__fact">
            <span>Ngày bay</span>
            <strong>{selectedDate}</strong>
          </div>
          <div className="booking-summary-card__fact">
            <span>Khung giờ</span>
            <strong>{selectedTime}</strong>
          </div>
          <div className="booking-summary-card__fact">
            <span>Trẻ em tối thiểu</span>
            <strong>{servicePackage?.min_child_age ?? 6}+ tuổi</strong>
          </div>
          <div className="booking-summary-card__fact">
            <span>Giá trị tour</span>
            <strong>{formatCurrency(tourTotal)}</strong>
          </div>
          <div className="booking-summary-card__fact">
            <span>Xe đón</span>
            <strong>{pickupFee ? formatCurrency(pickupFee) : "Tự đến"}</strong>
          </div>
          <div className="booking-summary-card__fact">
            <span>Tổng giá trị</span>
            <strong>{formatCurrency(finalTotal)}</strong>
          </div>
          <div className="booking-summary-card__fact">
            <span>Cần trả trước</span>
            <strong>{formatCurrency(depositAmount)}</strong>
          </div>
          {servicePackage?.included_services.length ? (
            <div className="booking-summary-card__features">
              <span>Dịch vụ đi kèm</span>
              <ul>
                {servicePackage.included_services.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <p className="booking-summary-card__note">
            Tiền trả trước gồm {DEPOSIT_PERCENT}% giá trị tour và phí xe đón nếu khách chọn xe đến đón.
          </p>
        </Panel>
      </Card>

      <Card>
        <Panel className="stack">
          <form className="booking-form-grid" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
            <div className="booking-form-grid__cols">
              <Field label="Ho va ten">
                {accountNeedsContactDetails ? (
                  <Input {...register("customer_name", { required: true })} />
                ) : (
                  <Input value={account?.full_name ?? ""} disabled readOnly />
                )}
              </Field>
              <Field label="So dien thoai">
                {accountNeedsContactDetails ? (
                  <Input {...register("phone", { required: true })} />
                ) : (
                  <Input value={accountPhone} disabled readOnly />
                )}
              </Field>
            </div>

            <div className="booking-form-grid__cols">
              <Field label="Email">
                <Input type="email" value={account?.email ?? ""} disabled readOnly />
              </Field>
              <Field label="So nguoi lon">
                <Input type="number" min={0} {...register("adults", { valueAsNumber: true })} />
              </Field>
            </div>

            <div className="booking-form-grid__cols">
              <Field label="Số trẻ em" hint={`Trẻ em từ ${servicePackage?.min_child_age ?? 6} tuổi trở lên.`}>
                <Input type="number" min={0} {...register("children", { valueAsNumber: true })} />
              </Field>
              <Field label="Ghi chu">
                <Textarea {...register("notes")} />
              </Field>
            </div>

            <div className="stack-sm">
              <strong>Di chuyển đến điểm bay</strong>
              <div className="payment-options payment-options--pickup">
                <label className={`payment-option ${pickupOption !== "pickup" ? "is-active" : ""}`}>
                  <input type="radio" value="self" {...register("pickup_option")} />
                  <strong>Tự đến điểm hẹn</strong>
                  <span>Khách tự di chuyển đến khu vực Chùa Bửu Đài Sơn.</span>
                </label>
                <label className={`payment-option ${pickupOption === "pickup" ? "is-active" : ""}`}>
                  <input type="radio" value="pickup" {...register("pickup_option")} />
                  <strong>Xe đến đón</strong>
                  <span>Cộng thêm 50.000 VND vào tiền trả trước.</span>
                </label>
              </div>
              {pickupOption === "pickup" ? (
                <Field label="Địa chỉ đón">
                  <Input
                    placeholder="Nhập địa chỉ đón tại Đà Nẵng"
                    {...register("pickup_address", {
                      required: pickupOption === "pickup" ? "Nhập địa chỉ đón." : false
                    })}
                  />
                </Field>
              ) : null}
              {formState.errors.pickup_address ? (
                <p className="form-error">{formState.errors.pickup_address.message}</p>
              ) : null}
            </div>

            <div className="stack-sm">
              <strong>Phương thức thanh toán</strong>
              <div className="payment-options">
                {paymentOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`payment-option ${paymentMethod === option.value ? "is-active" : ""}`}
                  >
                    <input type="radio" value={option.value} {...register("payment_method")} />
                    <strong>{option.title}</strong>
                    <span>{option.description}</span>
                  </label>
                ))}
              </div>
            </div>

            <label className="terms-check">
              <input type="checkbox" {...register("agree_terms", { required: true })} />
              <span>
                Tôi đồng ý điều khoản bay, điều kiện sức khỏe và chính sách hoàn hủy booking của doanh
                nghiệp.
              </span>
            </label>

            {mutation.error instanceof Error ? <p className="form-error">{mutation.error.message}</p> : null}

            <div className="booking-form-actions">
              <p>Thông tin liên hệ được lấy từ tài khoản. Nếu cần chỉnh sửa, hãy cập nhật trong trang tài khoản.</p>
              <Button disabled={mutation.isPending || !formState.isValid}>
                {mutation.isPending ? "Đang gửi booking..." : "Xác nhận đặt lịch"}
              </Button>
            </div>
          </form>
        </Panel>
      </Card>
    </div>
  );
};
