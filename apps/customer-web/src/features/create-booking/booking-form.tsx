import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import type { BookingCreatePayload, PickupLocation } from "@paragliding/api-client";
import { Button, Card, Field, Input, Panel, Textarea } from "@paragliding/ui";
import { customerApi } from "@/shared/config/api";
import { formatCurrency } from "@/shared/lib/format";
import { serviceQueryOptions } from "@/shared/lib/query-options";
import { checkoutStorage, trackingLookupStorage } from "@/shared/lib/storage";
import { useTranslatedText } from "@/shared/lib/use-translated-text";
import { useAuth } from "@/shared/providers/auth-provider";
import { useI18n } from "@/shared/providers/i18n-provider";
import { PickupLocationMap } from "./pickup-location-map";

type BookingFormProps = {
  serviceSlug: string;
  selectedDate: string;
  selectedTime: string;
};

type BookingSubmitForm = BookingCreatePayload & {
  agree_terms: boolean;
};

const PICKUP_FEE = 50000;
const DEPOSIT_PERCENT = 40;
const PAYOS_PAYMENT_METHOD = "gateway";

export const BookingForm = ({ serviceSlug, selectedDate, selectedTime }: BookingFormProps) => {
  const navigate = useNavigate();
  const { account } = useAuth();
  const { tText } = useI18n();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pickupPoint, setPickupPoint] = useState<PickupLocation | null>(null);
  const [pickupConfirmed, setPickupConfirmed] = useState(false);
  const [resolvedPickupAddress, setResolvedPickupAddress] = useState("");
  const [debouncedPickupAddress, setDebouncedPickupAddress] = useState("");

  const accountNeedsContactDetails = !account?.phone || account.phone.startsWith("EMAIL");
  const accountPhone = accountNeedsContactDetails ? "" : account?.phone ?? "";

  const { data: servicePackage } = useQuery({
    ...serviceQueryOptions(serviceSlug),
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
      payment_method: PAYOS_PAYMENT_METHOD,
      pickup_option: "self",
      pickup_address: "",
      pickup_lat: null,
      pickup_lng: null,
      agree_terms: false,
    }),
    [account?.email, account?.full_name, accountPhone, selectedDate, selectedTime, serviceSlug]
  );

  const { register, handleSubmit, watch, formState, reset, setValue } = useForm<BookingSubmitForm>({
    defaultValues,
    mode: "onChange",
  });

  useEffect(() => {
    reset(defaultValues);
    setPickupPoint(null);
    setPickupConfirmed(false);
    setResolvedPickupAddress("");
  }, [defaultValues, reset]);

  const pickupOption = watch("pickup_option");
  const pickupAddress = watch("pickup_address") ?? "";
  const trimmedPickupAddress = pickupAddress.trim();
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
      setSuccessMessage(`${tText("Đặt lịch thành công. Mã đặt lịch")} ${result.booking.code}. ${tText("Đang chuyển sang bước thanh toán đặt cọc...")}`);
      checkoutStorage.set(result);
      trackingLookupStorage.set(account?.email ?? account?.phone ?? "");
      window.setTimeout(() => navigate("/checkout"), 900);
    },
  });

  useEffect(() => {
    if (pickupOption !== "pickup" || trimmedPickupAddress.length < 3) {
      setDebouncedPickupAddress("");
      return;
    }

    const timer = window.setTimeout(() => setDebouncedPickupAddress(trimmedPickupAddress), 350);
    return () => window.clearTimeout(timer);
  }, [pickupOption, trimmedPickupAddress]);

  const pickupSuggestionsQuery = useQuery({
    queryKey: ["pickup-location-suggestions", debouncedPickupAddress],
    queryFn: () => customerApi.suggestPickupLocations(debouncedPickupAddress),
    enabled:
      pickupOption === "pickup" &&
      debouncedPickupAddress.length >= 3 &&
      !pickupConfirmed &&
      (!pickupPoint || resolvedPickupAddress !== debouncedPickupAddress),
    staleTime: 60_000,
  });

  const pickupLookupMutation = useMutation({
    mutationFn: (address: string) => customerApi.resolvePickupLocation(address),
    onSuccess: (location, address) => {
      setPickupPoint(location);
      setPickupConfirmed(false);
      setResolvedPickupAddress(address.trim());
      setValue("pickup_lat", null, { shouldValidate: true });
      setValue("pickup_lng", null, { shouldValidate: true });
    },
  });

  useEffect(() => {
    if (pickupOption !== "pickup") {
      setPickupPoint(null);
      setPickupConfirmed(false);
      setResolvedPickupAddress("");
      setValue("pickup_lat", null, { shouldValidate: true });
      setValue("pickup_lng", null, { shouldValidate: true });
      return;
    }

    if (resolvedPickupAddress && pickupAddress.trim() !== resolvedPickupAddress) {
      setPickupConfirmed(false);
      setValue("pickup_lat", null, { shouldValidate: true });
      setValue("pickup_lng", null, { shouldValidate: true });
    }
  }, [pickupAddress, pickupOption, resolvedPickupAddress, setValue]);

  const serviceName = useTranslatedText(servicePackage?.name ?? serviceSlug);
  const pickupNeedsConfirmation = pickupOption === "pickup";
  const pickupReady = !pickupNeedsConfirmation || Boolean(pickupConfirmed && pickupPoint);

  const handlePickupMapChange = (point: PickupLocation) => {
    setPickupPoint(point);
    setPickupConfirmed(false);
    setValue("pickup_lat", null, { shouldValidate: true });
    setValue("pickup_lng", null, { shouldValidate: true });
  };

  const selectPickupSuggestion = (point: PickupLocation) => {
    const nextAddress = point.name.trim();
    setPickupPoint(point);
    setPickupConfirmed(false);
    setResolvedPickupAddress(nextAddress);
    setValue("pickup_address", nextAddress, { shouldDirty: true, shouldValidate: true });
    setValue("pickup_lat", null, { shouldValidate: true });
    setValue("pickup_lng", null, { shouldValidate: true });
  };

  const confirmPickupPoint = () => {
    if (!pickupPoint) {
      return;
    }

    setPickupConfirmed(true);
    setResolvedPickupAddress(pickupAddress.trim());
    setValue("pickup_lat", pickupPoint.lat, { shouldValidate: true });
    setValue("pickup_lng", pickupPoint.lng, { shouldValidate: true });
  };

  return (
    <div className="booking-form-layout">
      {successMessage ? <div className="booking-toast">{successMessage}</div> : null}

      <Card>
        <Panel className="booking-summary-card">
          <h3>{tText("Tóm tắt đặt lịch")}</h3>
          <div className="booking-summary-card__fact">
            <span>{tText("Dịch vụ")}</span>
            <strong>{serviceName}</strong>
          </div>
          <div className="booking-summary-card__fact">
            <span>{tText("Ngày bay")}</span>
            <strong>{selectedDate}</strong>
          </div>
          <div className="booking-summary-card__fact">
            <span>{tText("Khung giờ")}</span>
            <strong>{selectedTime}</strong>
          </div>
          <div className="booking-summary-card__fact">
            <span>{tText("Giá trị tour")}</span>
            <strong>{formatCurrency(tourTotal)}</strong>
          </div>
          <div className="booking-summary-card__fact">
            <span>{tText("Xe đón")}</span>
            <strong>{pickupFee ? formatCurrency(pickupFee) : tText("Tự đến")}</strong>
          </div>
          <div className="booking-summary-card__fact">
            <span>{tText("Tổng giá trị")}</span>
            <strong>{formatCurrency(finalTotal)}</strong>
          </div>
          <div className="booking-summary-card__fact">
            <span>{tText("Cần trả trước")}</span>
            <strong>{formatCurrency(depositAmount)}</strong>
          </div>
          {servicePackage?.included_features.length ? (
            <div className="booking-summary-card__features">
              <span>{tText("Dịch vụ đi kèm")}</span>
              <ul>
                {servicePackage.included_features.map((feature) => (
                  <li key={feature.id}>{tText(feature.name)}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <p className="booking-summary-card__note">
            {tText("Tiền trả trước gồm")} {DEPOSIT_PERCENT}% {tText("giá trị tour và phí xe đón nếu khách chọn xe đến đón.")}
          </p>
        </Panel>
      </Card>

      <Card>
        <Panel className="stack">
          <form className="booking-form-grid" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
            <input type="hidden" value={PAYOS_PAYMENT_METHOD} {...register("payment_method")} />
            <input type="hidden" {...register("pickup_lat", { valueAsNumber: true })} />
            <input type="hidden" {...register("pickup_lng", { valueAsNumber: true })} />

            <div className="booking-form-grid__cols">
              <Field label={tText("Họ và tên")}>
                {accountNeedsContactDetails ? (
                  <Input {...register("customer_name", { required: true })} />
                ) : (
                  <Input value={account?.full_name ?? ""} disabled readOnly />
                )}
              </Field>
              <Field label={tText("Số điện thoại")}>
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
              <Field label={tText("Số người lớn")}>
                <Input type="number" min={0} {...register("adults", { valueAsNumber: true })} />
              </Field>
            </div>

            <div className="booking-form-grid__cols">
              <Field label={tText("Số trẻ em")}>
                <Input type="number" min={0} {...register("children", { valueAsNumber: true })} />
              </Field>
              <Field label={tText("Ghi chú")}>
                <Textarea {...register("notes")} />
              </Field>
            </div>

            <div className="stack-sm">
              <strong>{tText("Di chuyển đến điểm bay")}</strong>
              <div className="payment-options payment-options--pickup">
                <label className={`payment-option ${pickupOption !== "pickup" ? "is-active" : ""}`}>
                  <input type="radio" value="self" {...register("pickup_option")} />
                  <strong>{tText("Tự đến điểm hẹn")}</strong>
                  <span>{tText("Khách tự di chuyển đến khu vực Chùa Bửu Đài Sơn.")}</span>
                </label>
                <label className={`payment-option ${pickupOption === "pickup" ? "is-active" : ""}`}>
                  <input type="radio" value="pickup" {...register("pickup_option")} />
                  <strong>{tText("Xe đến đón")}</strong>
                  <span>{tText("Cộng thêm 50.000 VND vào tiền trả trước.")}</span>
                </label>
              </div>

              {pickupOption === "pickup" ? (
                <div className="stack-sm">
                  <Field label={tText("Địa chỉ đón")}>
                    <div className="pickup-address-picker">
                      <Input
                        autoComplete="street-address"
                        placeholder={tText("Nhập khách sạn, homestay, số nhà tại Đà Nẵng")}
                        {...register("pickup_address", {
                          required: pickupOption === "pickup" ? tText("Nhập địa chỉ đón.") : false,
                        })}
                      />
                      {!pickupConfirmed && resolvedPickupAddress !== trimmedPickupAddress && pickupSuggestionsQuery.isFetching ? (
                        <div className="pickup-address-picker__hint">{tText("Đang tìm gợi ý gần Đà Nẵng...")}</div>
                      ) : null}
                      {!pickupConfirmed && resolvedPickupAddress !== trimmedPickupAddress && pickupSuggestionsQuery.data?.length ? (
                        <div className="pickup-address-picker__list">
                          {pickupSuggestionsQuery.data.map((suggestion) => (
                            <button
                              key={`${suggestion.lat}-${suggestion.lng}-${suggestion.name}`}
                              type="button"
                              className="pickup-address-picker__item"
                              onClick={() => selectPickupSuggestion(suggestion)}
                            >
                              <strong>{suggestion.name.split(",")[0]}</strong>
                              <span>{suggestion.name}</span>
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </Field>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={pickupLookupMutation.isPending || !trimmedPickupAddress}
                      onClick={() => pickupLookupMutation.mutate(trimmedPickupAddress)}
                    >
                      {pickupLookupMutation.isPending ? tText("Đang định vị...") : tText("Dùng địa chỉ này")}
                    </Button>
                    {pickupConfirmed ? <span className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">{tText("Đã xác nhận điểm đón")}</span> : null}
                  </div>

                  {pickupLookupMutation.error instanceof Error ? (
                    <p className="form-error">{pickupLookupMutation.error.message}</p>
                  ) : null}

                  {pickupPoint ? (
                    <div className="stack-sm rounded-2xl border border-stone-200 bg-stone-50 p-4">
                      <p className="m-0 text-sm text-stone-600">
                        {tText("Chọn đúng ghim như app gọi xe. Nếu cần, bấm vào bản đồ để chỉnh lại vị trí rồi xác nhận điểm đón.")}
                      </p>
                      <PickupLocationMap point={pickupPoint} onChange={handlePickupMapChange} />
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="text-xs font-medium text-stone-500">
                          {pickupPoint.lat.toFixed(6)}, {pickupPoint.lng.toFixed(6)}
                        </span>
                        <Button type="button" onClick={confirmPickupPoint}>
                          {tText("Xác nhận điểm đón")}
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {formState.errors.pickup_address ? <p className="form-error">{formState.errors.pickup_address.message}</p> : null}
              {pickupNeedsConfirmation && !pickupReady ? (
                <p className="form-error">{tText("Hãy hiển thị và xác nhận điểm đón trên bản đồ.")}</p>
              ) : null}
            </div>

            <div className="stack-sm">
              <strong>{tText("Phương thức thanh toán")}</strong>
              <div className="payment-options">
                <div className="payment-option is-active">
                  <strong>{tText("payOS")}</strong>
                  <span>{tText("Thanh toán đặt cọc qua payOS bằng QR hoặc cổng thanh toán.")}</span>
                </div>
              </div>
            </div>

            <label className="terms-check">
              <input type="checkbox" {...register("agree_terms", { required: true })} />
              <span>{tText("Tôi đồng ý điều khoản bay, điều kiện sức khỏe và chính sách hoàn hủy lịch đặt của doanh nghiệp.")}</span>
            </label>

            {mutation.error instanceof Error ? <p className="form-error">{mutation.error.message}</p> : null}

            <div className="booking-form-actions">
              <p>{tText("Thông tin liên hệ được lấy từ tài khoản. Nếu cần chỉnh sửa, hãy cập nhật trong trang tài khoản.")}</p>
              <Button disabled={mutation.isPending || !formState.isValid || !pickupReady}>
                {mutation.isPending ? tText("Đang gửi đặt lịch...") : tText("Xác nhận đặt lịch")}
              </Button>
            </div>
          </form>
        </Panel>
      </Card>
    </div>
  );
};
