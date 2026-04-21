import { useQueries, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge, Button, Card, Container, Panel } from "@paragliding/ui";
import { customerApi } from "@/shared/config/api";
import { servicePreparationChecklist } from "@/shared/constants/customer-content";
import { formatCurrency } from "@/shared/lib/format";
import { SiteLayout, Banner } from "@/widgets/layout/site-layout";
import { BookingCalendar } from "@/widgets/booking-calendar/booking-calendar";

import {
  Eye,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"

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

  return `${value.time} - ${parseDateKey(value.date).toLocaleDateString("vi-VN")}`;
};

export const ServiceDetailPage = () => {
  const { slug = "" } = useParams();
  const currentDate = useMemo(() => new Date(), []);
  const [calendarState, setCalendarState] = useState({
    year: currentDate.getFullYear(),
    month: currentDate.getMonth() + 1
  });
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);

  const { data: servicePackage } = useQuery({
    queryKey: ["service", slug],
    queryFn: () => customerApi.getService(slug),
    enabled: Boolean(slug)
  });

  const [openSections, setOpenSections] = useState<string[]>(['overview', 'services', 'notes']);

  const toggleSection = (section: string) => {
    setOpenSections(prev => 
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const availabilityMonths = useMemo(() => {
    const currentDate = new Date(calendarState.year, calendarState.month - 1, 1);
    const prevDate = new Date(calendarState.year, calendarState.month - 2, 1);
    const nextDate = new Date(calendarState.year, calendarState.month, 1);

    return [prevDate, currentDate, nextDate].map((date) => ({
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

  if (!servicePackage) {
    return (
      <SiteLayout>
        <section className="section">
          <Container>Đang tải gói dịch vụ...</Container>
        </section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <Banner 
        title={servicePackage.name} 
        subtitle="Trải nghiệm bay lượn tuyệt vời nhất tại Đà Nẵng."
        image={servicePackage.hero_image}
      />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Container className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-start-3 lg:col-span-1 order-first lg:order-last space-y-8">
            <div className="glass-card rounded-[32px] p-6 sticky top-24">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-3xl font-bold text-red-600">{formatCurrency(servicePackage.price)}</h2>
                  <Link
                    to={
                      selectedSlot
                        ? `/booking?service=${servicePackage.slug}&date=${selectedSlot.date}&time=${selectedSlot.time}`
                        : `/booking?service=${servicePackage.slug}`
                    }
                  >
                    <Button className="btn-primary px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-brand/20">
                      Đặt ngay
                    </Button>
                  </Link>
                </div>
                <p className="calendar-selection-note">
                  {selectedSlot
                    ? "Lịch đã chọn sẽ được giữ sẵn khi sang trang điền thông tin."
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
          </div >
          <div className="lg:col-span-2 space-y-6 lg:space-y-12">
            <section className="bg-white lg:bg-transparent rounded-3xl lg:rounded-none overflow-hidden">
              <button 
                onClick={() => toggleSection('overview')}
                className="w-full lg:hidden flex items-center justify-between p-6 bg-stone-50"
              >
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Eye className="text-brand" /> Tổng quan
                </h2>
                <ChevronDown className={`transition-transform ${openSections.includes('overview') ? 'rotate-180' : ''}`} />
              </button>

              <div className={`${openSections.includes('overview') ? 'block' : 'hidden'} lg:block p-6 lg:p-0`}>
                <h2 className="hidden lg:flex text-2xl font-bold mb-6 items-center gap-2">
                  <Eye className="text-brand" /> Tổng quan
                </h2>
                <div className="prose prose-stone max-w-none text-stone-600 leading-relaxed">
                  <p>
                    {servicePackage.description}
                  </p>
                  <p>
                    Bạn sẽ được bay cùng các phi công chuyên nghiệp, có chứng chỉ quốc tế và hàng ngàn giờ bay kinh nghiệm. Sự an toàn của bạn là ưu tiên hàng đầu của chúng tôi.
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-white lg:bg-transparent rounded-3xl lg:rounded-none overflow-hidden">
              <button 
                onClick={() => toggleSection('services')}
                className="w-full lg:hidden flex items-center justify-between p-6 bg-stone-50"
              >
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <CheckCircle2 className="text-emerald-500" /> Dịch vụ đi kèm
                </h2>
                <ChevronDown className={`transition-transform ${openSections.includes('services') ? 'rotate-180' : ''}`} />
              </button>

              <div className={`${openSections.includes('services') ? 'block' : 'hidden'} lg:block p-6 lg:p-0`}>
                <h2 className="hidden lg:flex text-2xl font-bold mb-6 items-center gap-2">
                  <CheckCircle2 className="text-emerald-500" /> Dịch vụ đi kèm
                </h2>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  {[
                    "Phi công chuyên nghiệp bay cùng",
                    "Thiết bị bay nhập khẩu Châu Âu",
                    "Bảo hiểm du lịch trọn gói",
                    "Quay video GoPro 4K & Ảnh",
                    "Nước uống & Khăn lạnh",
                    "Xe đưa đón tại điểm tập kết",
                    "Hướng dẫn kỹ thuật bay",
                    "Chứng nhận hoàn thành chuyến bay",
                    "Trang thiết bị bảo hộ an toàn"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 md:gap-3 p-3 md:p-4 bg-white lg:bg-white rounded-2xl border border-stone-100 shadow-sm">
                      <div className="w-6 h-6 md:w-8 md:h-8 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                        <CheckCircle2 size={14} className="md:w-4 md:h-4" />
                      </div>
                      <span className="text-[10px] md:text-sm font-medium text-stone-700 leading-tight">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
            
            <section className="bg-white lg:bg-transparent rounded-3xl lg:rounded-none overflow-hidden">
              <button 
                onClick={() => toggleSection('notes')}
                className="w-full lg:hidden flex items-center justify-between p-6 bg-stone-50"
              >
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <AlertCircle className="text-amber-500" /> Lưu ý khi tham gia
                </h2>
                <ChevronDown className={`transition-transform ${openSections.includes('notes') ? 'rotate-180' : ''}`} />
              </button>

              <div className={`${openSections.includes('notes') ? 'block' : 'hidden'} lg:block p-6 lg:p-0`}>
                <h2 className="hidden lg:flex text-2xl font-bold mb-6 items-center gap-2">
                  <AlertCircle className="text-amber-500" /> Lưu ý khi tham gia
                </h2>
                <ul className="space-y-3 text-stone-600 text-sm list-disc pl-5">
                  <li>Sức khỏe tốt, không mắc các bệnh về tim mạch, huyết áp.</li>
                  <li>Cân nặng từ 30kg đến 90kg.</li>
                  <li>Trang phục gọn gàng, nên đi giày thể thao.</li>
                  <li>Tuân thủ tuyệt đối hướng dẫn của phi công.</li>
                  <li>Thời gian bay có thể thay đổi tùy thuộc vào điều kiện sức gió.</li>
                </ul>
              </div>
            </section>
          </div>
        </Container>
      </section>
    </SiteLayout>
  );
};
