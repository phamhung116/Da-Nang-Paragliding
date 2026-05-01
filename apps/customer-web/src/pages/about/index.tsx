import { Badge, Card, Container, Panel } from "@paragliding/ui";
import { aboutOperationalHighlights } from "@/shared/constants/customer-content";
import { useI18n } from "@/shared/providers/i18n-provider";
import { SiteLayout } from "@/widgets/layout/site-layout";

const guideTeam = [
  "Phi công bay đôi đã được huấn luyện và vận hành bay đôi thương mại.",
  "Điều phối viên theo dõi thời tiết, khung giờ và lưu lượng đặt lịch theo ngày.",
  "Nhân sự media hỗ trợ giao ảnh và video sau chuyến bay."
];

const safetyItems = [
  "Checklist thiết bị trước cất cánh và sau hạ cánh.",
  "Briefing an toàn, cân nặng và điều kiện sức khỏe được xác nhận trước giờ bay.",
  "Thông tin lộ trình, thời tiết và trạng thái chuyến bay được cập nhật để khách theo dõi lại dễ dàng."
];

const values = [
  {
    title: "An toàn ưu tiên",
    description: "Quy trình kiểm tra, chọn giờ bay và phân công phi công được thực hiện trước mỗi lịch đặt."
  },
  {
    title: "Vận hành rõ ràng",
    description: "Khách, quản trị viên và phi công đều theo một luồng thông tin thống nhất trên hệ thống."
  },
  {
    title: "Khoảnh khắc đáng nhớ",
    description: "Hình ảnh và video chuyến bay là một phần của trải nghiệm, không phải phần phụ."
  }
];

export const AboutPage = () => {
  const { tText } = useI18n();

  return (
  <SiteLayout>
    <section className="page-banner">
      <div className="page-banner__image">
        <img
          src="https://images.unsplash.com/photo-1544625344-63189df1e401?auto=format&fit=crop&w=1800&q=80"
          alt={tText("Ảnh giới thiệu")}
        />
        <div className="page-banner__overlay" />
      </div>
      <Container className="page-banner__content">
        <Badge>{tText("Giới thiệu")}</Badge>
        <h1>{tText("Doanh nghiệp dù lượn vận hành theo hướng dịch vụ rõ ràng và an toàn là ưu tiên.")}</h1>
        <p>
          {tText("Phía khách hàng được kết nối trực tiếp với quy trình đặt lịch, theo dõi hành trình và vận hành thực tế của đội ngũ.")}
        </p>
      </Container>
    </section>

    <section className="section">
      <Container className="about-story">
        <div className="about-story__copy">
          <Badge>{tText("Câu chuyện doanh nghiệp")}</Badge>
          <h2 className="detail-title">{tText("Chúng tôi tập trung vào đặt lịch minh bạch, lịch rõ ràng và trải nghiệm an toàn.")}</h2>
          <p className="detail-copy">
            {tText("Toàn bộ luồng được thiết kế để khách hàng có thể xem lịch trống, đặt lịch, thanh toán và theo dõi hành trình mà không cần phải chờ qua nhiều thao tác thủ công.")}
          </p>

          <div className="about-value-grid">
            {values.map((item) => (
              <Card key={item.title} className="about-value-card">
                <Panel className="stack-sm">
                  <strong>{tText(item.title)}</strong>
                  <p>{tText(item.description)}</p>
                </Panel>
              </Card>
            ))}
          </div>
        </div>

        <div className="about-visual">
          <img
            src="https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1000&q=80"
            alt={tText("Đội ngũ vận hành")}
          />
          <img
            src="https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1000&q=80"
            alt={tText("Chuyến bay")}
          />
        </div>
      </Container>
    </section>

    <section className="section section--tight-top">
      <Container className="info-grid">
        {aboutOperationalHighlights.map((item) => (
          <Card key={item} className="info-card">
            <Panel className="stack-sm">
              <strong>{tText("Điểm nổi bật vận hành")}</strong>
              <p>{tText(item)}</p>
            </Panel>
          </Card>
        ))}
      </Container>
    </section>

    <section className="section section--tight-top">
      <Container className="detail-section-grid">
        <Card className="detail-section-card">
          <Panel className="stack-sm">
            <Badge>{tText("Đội ngũ hướng dẫn viên")}</Badge>
            <h3>{tText("Những người trực tiếp vận hành chuyến bay")}</h3>
            <ul className="detail-list">
              {guideTeam.map((item) => (
                <li key={item}>{tText(item)}</li>
              ))}
            </ul>
          </Panel>
        </Card>
        <Card className="detail-section-card">
          <Panel className="stack-sm">
            <Badge tone="success">{tText("Chứng nhận an toàn")}</Badge>
            <h3>{tText("Hệ thống checklist và thông tin đồng bộ")}</h3>
            <ul className="detail-list">
              {safetyItems.map((item) => (
                <li key={item}>{tText(item)}</li>
              ))}
            </ul>
          </Panel>
        </Card>
      </Container>
    </section>
  </SiteLayout>
  );
};
