import { useQuery } from "@tanstack/react-query";
import { Badge, Card, Panel } from "@paragliding/ui";
import { customerApi } from "@/shared/config/api";
import { SiteLayout, Banner } from "@/widgets/layout/site-layout";
import { ServiceCard } from "@/widgets/service-card/service-card";

export const ServicesPage = () => {
  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: () => customerApi.listServices()
  });

  return (
    <SiteLayout>
      <Banner 
        title="Dịch vụ bay dù lượn" 
        subtitle="Khám phá các gói tour đa dạng, phù hợp với mọi nhu cầu và ngân sách của bạn."
        image="https://images.unsplash.com/photo-1596263576925-d90d63691097?auto=format&fit=crop&q=80&w=1920"
      />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-stone-900">Các gói tour có sẵn</h2>
          <p className="text-stone-500 max-w-2xl mx-auto">Chọn trải nghiệm dù lượn hoàn hảo cho chuyến phiêu lưu của bạn.</p>
        </div>

        {services.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-24">
            {services.map((item) => (
              <ServiceCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <Card className="empty-state-card">
            <Panel className="stack-sm">
              <Badge tone="danger">Chưa có gói hoạt động</Badge>
              <strong>Danh sách dịch vụ đang được cập nhật.</strong>
              <p>Khách vẫn có thể liên hệ hotline để đặt lịch thủ công trong khi chờ hệ thống mở lịch.</p>
            </Panel>
          </Card>
        )}
      </section>
    </SiteLayout>
  );
};
