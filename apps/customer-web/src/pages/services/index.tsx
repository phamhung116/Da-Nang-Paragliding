import { useQuery } from "@tanstack/react-query";
import { Badge, Card, Container, Panel } from "@paragliding/ui";
import { customerApi } from "@/shared/config/api";
import { businessInfo } from "@/shared/constants/business";
import { servicePageNotes } from "@/shared/constants/customer-content";
import { SiteLayout } from "@/widgets/layout/site-layout";
import { ServiceCard } from "@/widgets/service-card/service-card";

export const ServicesPage = () => {
  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: () => customerApi.listServices()
  });

  return (
    <SiteLayout>
      <section className="page-banner">
        <div className="page-banner__image">
          <img
            src="https://images.unsplash.com/photo-1596263576925-d90d63691097?auto=format&fit=crop&w=1800&q=80"
            alt="Services banner"
          />
          <div className="page-banner__overlay" />
        </div>
        <Container className="page-banner__content">
          <Badge>Dich vu</Badge>
          <h1>Chon goi bay phu hop voi muc trai nghiem ban muon.</h1>
          <p>
            Trang nay giup customer xem nhanh gia, thoi luong, muc do phu hop va click vao lich dat cua tung
            goi.
          </p>
        </Container>
      </section>

      <section className="section">
        <Container className="stack">
          <div className="services-intro">
            <div>
              <Badge tone="success">Active packages</Badge>
              <h2>Moi card duoc chuan hoa de khach so sanh de hon va khong bi vo bo cuc.</h2>
            </div>
            <p>
              Cac goi inactive chi dung noi bo va se khong hien thi tai customer side. Neu can tu van nhanh,
              hay lien he {businessInfo.phone}.
            </p>
          </div>

          <div className="info-grid">
            {servicePageNotes.map((item) => (
              <Card key={item} className="info-card">
                <Panel className="stack-sm">
                  <strong>Thong tin cho khach hang</strong>
                  <p>{item}</p>
                </Panel>
              </Card>
            ))}
          </div>

          {services.length > 0 ? (
            <div className="package-grid">
              {services.map((item) => (
                <ServiceCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <Card className="empty-state-card">
              <Panel className="stack-sm">
                <Badge tone="danger">Chua co goi active</Badge>
                <strong>Danh sach dich vu dang duoc cap nhat.</strong>
                <p>Khach van co the lien he hotline de dat lich thu cong trong khi doi he thong mo lich.</p>
              </Panel>
            </Card>
          )}
        </Container>
      </section>
    </SiteLayout>
  );
};
