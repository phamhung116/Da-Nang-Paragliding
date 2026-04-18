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
    title: "QR vi dien tu",
    description: "Thanh toan dat coc online bang QR."
  },
  {
    value: "gateway",
    title: "QR cong thanh toan",
    description: "Checkout online va nhan booking confirm ngay sau khi tra coc."
  },
  {
    value: "bank_transfer",
    title: "QR chuyen khoan",
    description: "Hien thi QR va noi dung chuyen khoan theo ma booking."
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
      setSuccessMessage(`Dat lich thanh cong. Ma booking ${result.booking.code}. Dang chuyen sang buoc thanh toan dat coc...`);
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
          <h3>Booking summary</h3>
          <div className="booking-summary-card__fact">
            <span>Service</span>
            <strong>{servicePackage?.name ?? serviceSlug}</strong>
          </div>
          <div className="booking-summary-card__fact">
            <span>Ngay bay</span>
            <strong>{selectedDate}</strong>
          </div>
          <div className="booking-summary-card__fact">
            <span>Khung gio</span>
            <strong>{selectedTime}</strong>
          </div>
          <div className="booking-summary-card__fact">
            <span>Tre em toi thieu</span>
            <strong>{servicePackage?.min_child_age ?? 6}+ tuoi</strong>
          </div>
          <div className="booking-summary-card__fact">
            <span>Gia tri tour</span>
            <strong>{formatCurrency(tourTotal)}</strong>
          </div>
          <div className="booking-summary-card__fact">
            <span>Xe don</span>
            <strong>{pickupFee ? formatCurrency(pickupFee) : "Tu den"}</strong>
          </div>
          <div className="booking-summary-card__fact">
            <span>Tong gia tri</span>
            <strong>{formatCurrency(finalTotal)}</strong>
          </div>
          <div className="booking-summary-card__fact">
            <span>Can tra truoc</span>
            <strong>{formatCurrency(depositAmount)}</strong>
          </div>
          <p className="booking-summary-card__note">
            Tien tra truoc gom {DEPOSIT_PERCENT}% gia tri tour va phi xe don neu khach chon xe den don.
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
              <Field label="So tre em" hint={`Tre em tu ${servicePackage?.min_child_age ?? 6} tuoi tro len.`}>
                <Input type="number" min={0} {...register("children", { valueAsNumber: true })} />
              </Field>
              <Field label="Ghi chu">
                <Textarea {...register("notes")} />
              </Field>
            </div>

            <div className="stack-sm">
              <strong>Di chuyen den diem bay</strong>
              <div className="payment-options payment-options--pickup">
                <label className={`payment-option ${pickupOption !== "pickup" ? "is-active" : ""}`}>
                  <input type="radio" value="self" {...register("pickup_option")} />
                  <strong>Tu den diem hen</strong>
                  <span>Khach tu di chuyen den khu vuc Chua Buu Dai Son.</span>
                </label>
                <label className={`payment-option ${pickupOption === "pickup" ? "is-active" : ""}`}>
                  <input type="radio" value="pickup" {...register("pickup_option")} />
                  <strong>Xe den don</strong>
                  <span>Cong them 50.000 VND vao tien tra truoc.</span>
                </label>
              </div>
              {pickupOption === "pickup" ? (
                <Field label="Dia chi don">
                  <Input
                    placeholder="Nhap dia chi don tai Da Nang"
                    {...register("pickup_address", {
                      required: pickupOption === "pickup" ? "Nhap dia chi don." : false
                    })}
                  />
                </Field>
              ) : null}
              {formState.errors.pickup_address ? (
                <p className="form-error">{formState.errors.pickup_address.message}</p>
              ) : null}
            </div>

            <div className="stack-sm">
              <strong>Phuong thuc thanh toan</strong>
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
                Toi dong y dieu khoan bay, dieu kien suc khoe va chinh sach hoan huy booking cua doanh
                nghiep.
              </span>
            </label>

            {mutation.error instanceof Error ? <p className="form-error">{mutation.error.message}</p> : null}

            <div className="booking-form-actions">
              <p>Thong tin lien he duoc lay tu tai khoan. Neu can chinh sua, hay cap nhat trong trang tai khoan.</p>
              <Button disabled={mutation.isPending || !formState.isValid}>
                {mutation.isPending ? "Dang gui booking..." : "Xac nhan dat lich"}
              </Button>
            </div>
          </form>
        </Panel>
      </Card>
    </div>
  );
};
