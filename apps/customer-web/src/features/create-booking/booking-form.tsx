import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import type { BookingCreatePayload } from "@paragliding/api-client";
import { Button, Card, Field, Input, Panel, Textarea } from "@paragliding/ui";
import { useAuth } from "@/app/providers/auth-provider";
import { customerApi } from "@/shared/config/api";
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
    value: "cash",
    title: "Tien mat tai diem bay",
    description: "Giu cho truoc, admin se review va thanh toan khi check-in."
  },
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

export const BookingForm = ({ serviceSlug, selectedDate, selectedTime }: BookingFormProps) => {
  const navigate = useNavigate();
  const { account } = useAuth();
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
      phone: account?.phone ?? "",
      email: account?.email ?? "",
      adults: 1,
      children: 0,
      notes: "",
      payment_method: "cash",
      agree_terms: false
    }),
    [account?.email, account?.full_name, account?.phone, selectedDate, selectedTime, serviceSlug]
  );

  const { register, handleSubmit, watch, formState } = useForm<BookingSubmitForm>({
    defaultValues,
    mode: "onChange"
  });

  const paymentMethod = watch("payment_method");

  const mutation = useMutation({
    mutationFn: ({ agree_terms: _, ...payload }: BookingSubmitForm) => customerApi.createBooking(payload),
    onSuccess: (result) => {
      checkoutStorage.set(result);
      trackingLookupStorage.set(account?.email ?? account?.phone ?? "");
      navigate("/checkout");
    }
  });

  return (
    <div className="booking-form-layout">
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
          <p className="booking-summary-card__note">
            Khung gio da chon se duoc giu sau khi gui booking. Neu chon thanh toan online, he thong se tao
            QR dat coc va timeout sau 30 phut.
          </p>
        </Panel>
      </Card>

      <Card>
        <Panel className="stack">
          <form className="booking-form-grid" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
            <div className="booking-form-grid__cols">
              <Field label="Ho va ten">
                <Input value={account?.full_name ?? ""} disabled readOnly />
              </Field>
              <Field label="So dien thoai">
                <Input value={account?.phone ?? ""} disabled readOnly />
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
