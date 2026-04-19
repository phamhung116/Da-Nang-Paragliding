import { Badge, Card, Container, Panel } from "@paragliding/ui";
import { aboutOperationalHighlights } from "@/shared/constants/customer-content";
import { SiteLayout } from "@/widgets/layout/site-layout";

const guideTeam = [
  "Pilot doi da duoc huan luyen va van hanh bay doi thuong mai.",
  "Dieu phoi vien theo doi weather, slot va luu luong booking theo ngay.",
  "Nhan su media ho tro giao anh va video sau chuyen bay."
];

const safetyItems = [
  "Checklist thiet bi truoc cat canh va sau ha canh.",
  "Briefing an toan, can nang va dieu kien suc khoe duoc xac nhan truoc gio bay.",
  "Thong tin route, weather va trang thai chuyen bay duoc cap nhat de khach theo doi lai de dang."
];

const values = [
  {
    title: "Safety first",
    description: "Quy trinh checklist, chon gio bay va pilot assignment duoc thuc hien truoc moi booking."
  },
  {
    title: "Operational clarity",
    description: "Khach, admin va pilot deu theo mot luong thong tin thong nhat tren he thong."
  },
  {
    title: "Memorable media",
    description: "Hình ảnh và video chuyến bay là một phần của trải nghiệm, không phải phần phụ."
  }
];

export const AboutPage = () => (
  <SiteLayout>
    <section className="page-banner">
      <div className="page-banner__image">
        <img
          src="https://images.unsplash.com/photo-1544625344-63189df1e401?auto=format&fit=crop&w=1800&q=80"
          alt="About banner"
        />
        <div className="page-banner__overlay" />
      </div>
      <Container className="page-banner__content">
        <Badge>Giới thiệu</Badge>
        <h1>Doanh nghiep du luon van hanh theo huong service-first va safety-first.</h1>
        <p>
          Customer side duoc ket noi truc tiep voi booking, tracking va quy trinh van hanh thuc te cua doi
          ngu.
        </p>
      </Container>
    </section>

    <section className="section">
      <Container className="about-story">
        <div className="about-story__copy">
          <Badge>Cau chuyen doanh nghiep</Badge>
          <h2 className="detail-title">Chung toi tap trung vao booking minh bach, lich ro rang va trai nghiem an toan.</h2>
          <p className="detail-copy">
            Toan bo flow duoc thiet ke de user co the xem lich trong, dat lich, thanh toan va theo doi hanh
            trinh ma khong can phai cho qua nhieu thao tac thu cong.
          </p>

          <div className="about-value-grid">
            {values.map((item) => (
              <Card key={item.title} className="about-value-card">
                <Panel className="stack-sm">
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                </Panel>
              </Card>
            ))}
          </div>
        </div>

        <div className="about-visual">
          <img
            src="https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1000&q=80"
            alt="Team"
          />
          <img
            src="https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1000&q=80"
            alt="Flight"
          />
        </div>
      </Container>
    </section>

    <section className="section section--tight-top">
      <Container className="info-grid">
        {aboutOperationalHighlights.map((item) => (
          <Card key={item} className="info-card">
            <Panel className="stack-sm">
              <strong>Operational highlight</strong>
              <p>{item}</p>
            </Panel>
          </Card>
        ))}
      </Container>
    </section>

    <section className="section section--tight-top">
      <Container className="detail-section-grid">
        <Card className="detail-section-card">
          <Panel className="stack-sm">
            <Badge>Doi ngu huong dan vien</Badge>
            <h3>Nhung nguoi truc tiep van hanh chuyen bay</h3>
            <ul className="detail-list">
              {guideTeam.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Panel>
        </Card>
        <Card className="detail-section-card">
          <Panel className="stack-sm">
            <Badge tone="success">Chung nhan an toan</Badge>
            <h3>He thong checklist va thong tin dong bo</h3>
            <ul className="detail-list">
              {safetyItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Panel>
        </Card>
      </Container>
    </section>
  </SiteLayout>
);
