import { useQueries, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge, Button, Card, Container, Panel } from "@paragliding/ui";
import { AlertCircle, CheckCircle2, ChevronDown, Eye } from "lucide-react";
import { customerApi } from "@/shared/config/api";
import { servicePreparationChecklist } from "@/shared/constants/customer-content";
import {
  localizeFeatureName,
  localizeServiceDescription,
  localizeServiceName,
  localizeServiceShortDescription,
} from "@/shared/lib/localized-content";
import { formatCurrency, formatDate } from "@/shared/lib/format";
import { useI18n } from "@/shared/providers/i18n-provider";
import { BookingCalendar } from "@/widgets/booking-calendar/booking-calendar";
import { Banner, SiteLayout } from "@/widgets/layout/site-layout";

const serviceFlowNotes = [
  "Khách sẽ được brief an toàn trước giờ bay và xác nhận sức khỏe tại điểm tập kết.",
  "Ảnh và video sẽ được đội ngũ media hỗ trợ bàn giao sau chuyến bay theo gói dịch vụ.",
  "Lịch bay thực tế có thể được điều chỉnh nhẹ nếu thời tiết thay đổi sát giờ cất cánh."
];

const parseDateKey = (value: string) => {
  const [rawYear, rawMonth, rawDay] = value.split("-").map(Number);
  return new Date(rawYear, rawMonth - 1, rawDay);
};

const formatSelectedSlotLabel = (value: { date: string; time: string } | null) => {
  if (!value) {
    return "Chưa chọn khung giờ";
  }

  return `${value.time} - ${formatDate(parseDateKey(value.date))}`;
};

export const ServiceDetailPage = () => {
  const { slug = "" } = useParams();
  const { locale } = useI18n();
  const currentDate = useMemo(() => new Date(), []);
  const [calendarState, setCalendarState] = useState({
    year: currentDate.getFullYear(),
    month: currentDate.getMonth() + 1
  });
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);
  const [openSections, setOpenSections] = useState<string[]>(["overview", "services", "notes"]);

  const { data: servicePackage } = useQuery({
    queryKey: ["service", slug],
    queryFn: () => customerApi.getService(slug),
    enabled: Boolean(slug)
  });

  const availabilityMonths = useMemo(() => {
    const anchorDate = new Date(calendarState.year, calendarState.month - 1, 1);
    const prevDate = new Date(calendarState.year, calendarState.month - 2, 1);
    const nextDate = new Date(calendarState.year, calendarState.month, 1);

    return [prevDate, anchorDate, nextDate].map((date) => ({
      year: date.getFullYear(),
      month: date.getMonth() + 1
    }));
  }, [calendarState.month, calendarState.year]);

  const availabilityQueries = useQueries({
    queries: availabilityMonths.map(({ year, month }) => ({
      queryKey: ["availability", slug, year, month],
      queryFn: () => customerApi.getAvailability(slug, year, month),
      enabled: Boolean(slug)
    }))
  });

  const availability = useMemo(() => {
    const merged = availabilityQueries.flatMap((query) => query.data ?? []);
    const uniqueDays = new Map(merged.map((day) => [day.date, day]));
    return Array.from(uniqueDays.values()).sort((left, right) => left.date.localeCompare(right.date));
  }, [availabilityQueries]);

  const toggleSection = (section: string) => {
    setOpenSections((current) =>
      current.includes(section) ? current.filter((item) => item !== section) : [...current, section]
    );
  };

  if (!servicePackage) {
    return (
      <SiteLayout>
        <section className="section">
          <Container>Đang tải gói dịch vụ...</Container>
        </section>
      </SiteLayout>
    );
  }

  const serviceName = localizeServiceName(servicePackage, locale);
  const serviceShortDescription = localizeServiceShortDescription(servicePackage, locale);
  const serviceDescription = localizeServiceDescription(servicePackage, locale);
  const includedFeatureCountLabel = `${servicePackage.included_features.length} mục`;

  return (
    <SiteLayout>
      <Banner
        title={serviceName}
        subtitle={serviceShortDescription}
        image={servicePackage.hero_image}
      />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Container className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          <div className="order-first space-y-8 lg:order-last lg:col-span-1 lg:col-start-3">
            <div className="glass-card sticky top-24 rounded-[32px] p-6">
              <div className="mb-6">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h2 className="text-3xl font-bold text-red-600">{formatCurrency(servicePackage.price)}</h2>
                  <Link
                    to={
                      selectedSlot
                        ? `/booking?service=${servicePackage.slug}&date=${selectedSlot.date}&time=${selectedSlot.time}`
                        : `/booking?service=${servicePackage.slug}`
                    }
                  >
                    <Button className="btn-primary rounded-xl px-6 py-2 text-sm font-bold shadow-lg shadow-brand/20">
                      Đặt ngay
                    </Button>
                  </Link>
                </div>
                <p className="calendar-selection-note">
                  {selectedSlot
                    ? `Lịch đã chọn: ${formatSelectedSlotLabel(selectedSlot)}. Thông tin này sẽ được giữ sẵn khi sang trang điền thông tin.`
                    : "Có thể đặt ngay và chọn lịch ở bước tiếp theo."}
                </p>
              </div>

              {availability.length > 0 ? (
                <BookingCalendar
                  year={calendarState.year}
                  month={calendarState.month}
                  days={availability}
                  selectedSlot={selectedSlot}
                  onMonthChange={(year, month) => setCalendarState({ year, month })}
                  onSelectSlot={setSelectedSlot}
                />
              ) : (
                <Card className="empty-state-card">
                  <Panel className="stack-sm">
                    <Badge tone="danger">Chưa mở lịch</Badge>
                    <strong>Tháng này chưa có slot khả dụng cho gói bay này.</strong>
                    <p>Bạn có thể đổi sang tháng khác hoặc liên hệ doanh nghiệp để được hỗ trợ.</p>
                  </Panel>
                </Card>
              )}
            </div>
          </div>

          <div className="space-y-6 lg:col-span-2 lg:space-y-12">
            <section className="overflow-hidden rounded-3xl bg-white lg:rounded-none lg:bg-transparent">
              <button
                type="button"
                onClick={() => toggleSection("overview")}
                className="flex w-full items-center justify-between bg-stone-50 p-6 lg:hidden"
              >
                <h2 className="flex items-center gap-2 text-xl font-bold">
                  <Eye className="text-brand" /> Tổng quan
                </h2>
                <ChevronDown className={`transition-transform ${openSections.includes("overview") ? "rotate-180" : ""}`} />
              </button>

              <div className={`${openSections.includes("overview") ? "block" : "hidden"} p-6 lg:block lg:p-0`}>
                <h2 className="mb-6 hidden items-center gap-2 text-2xl font-bold lg:flex">
                  <Eye className="text-brand" /> Tổng quan
                </h2>
                <p className="detail-copy">{serviceDescription}</p>
                <div className="detail-highlight-grid">
                  <article>
                    <span>Giá gói</span>
                    <strong>{formatCurrency(servicePackage.price)}</strong>
                  </article>
                  <article>
                    <span>Dịch vụ đi kèm</span>
                    <strong>{includedFeatureCountLabel}</strong>
                  </article>
                  <article>
                    <span>Đặt lịch</span>
                    <strong>{formatSelectedSlotLabel(selectedSlot)}</strong>
                  </article>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-3xl bg-white lg:rounded-none lg:bg-transparent">
              <button
                type="button"
                onClick={() => toggleSection("services")}
                className="flex w-full items-center justify-between bg-stone-50 p-6 lg:hidden"
              >
                <h2 className="flex items-center gap-2 text-xl font-bold">
                  <CheckCircle2 className="text-emerald-500" /> Dịch vụ đi kèm
                </h2>
                <ChevronDown className={`transition-transform ${openSections.includes("services") ? "rotate-180" : ""}`} />
              </button>

              <div className={`${openSections.includes("services") ? "block" : "hidden"} p-6 lg:block lg:p-0`}>
                <h2 className="mb-6 hidden items-center gap-2 text-2xl font-bold lg:flex">
                  <CheckCircle2 className="text-emerald-500" /> Dịch vụ đi kèm
                </h2>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
                  {servicePackage.included_features.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-2xl border border-stone-100 bg-white p-4 shadow-sm"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                        <CheckCircle2 size={16} />
                      </div>
                      <span className="text-sm font-medium text-stone-700">{localizeFeatureName(item, locale)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-3xl bg-white lg:rounded-none lg:bg-transparent">
              <button
                type="button"
                onClick={() => toggleSection("notes")}
                className="flex w-full items-center justify-between bg-stone-50 p-6 lg:hidden"
              >
                <h2 className="flex items-center gap-2 text-xl font-bold">
                  <AlertCircle className="text-amber-500" /> Lưu ý khi tham gia
                </h2>
                <ChevronDown className={`transition-transform ${openSections.includes("notes") ? "rotate-180" : ""}`} />
              </button>

              <div className={`${openSections.includes("notes") ? "block" : "hidden"} p-6 lg:block lg:p-0`}>
                <h2 className="mb-6 hidden items-center gap-2 text-2xl font-bold lg:flex">
                  <AlertCircle className="text-amber-500" /> Lưu ý khi tham gia
                </h2>

                <div className="info-grid">
                  {serviceFlowNotes.map((item) => (
                    <Card key={item} className="info-card">
                      <Panel className="stack-sm">
                        <strong>Vận hành trong ngày bay</strong>
                        <p>{item}</p>
                      </Panel>
                    </Card>
                  ))}
                </div>

                <Card className="detail-section-card">
                  <Panel className="stack-sm">
                    <Badge>Chuẩn bị trước bay</Badge>
                    <h3>Checklist dành cho khách hàng</h3>
                    <ul className="detail-list">
                      {servicePreparationChecklist.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </Panel>
                </Card>
              </div>
            </section>
          </div>
        </Container>
      </section>
    </SiteLayout>
  );
};
