import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { Badge, Button, Card, Container, Panel } from "@paragliding/ui";
import { customerApi } from "@/shared/config/api";
import { SiteLayout } from "@/widgets/layout/site-layout";

export const PostDetailPage = () => {
  const { slug = "" } = useParams();
  const { data } = useQuery({
    queryKey: ["post", slug],
    queryFn: () => customerApi.getPost(slug),
    enabled: Boolean(slug)
  });

  if (!data) {
    return (
      <SiteLayout>
        <section className="section">
          <Container>Dang tai bai viet...</Container>
        </section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="page-banner page-banner--posts">
        <div className="page-banner__image">
          <img src={data.cover_image} alt={data.title} />
          <div className="page-banner__overlay" />
        </div>
        <Container className="page-banner__content">
          <Badge>{new Date(data.published_at ?? data.created_at ?? "").toLocaleDateString("vi-VN")}</Badge>
          <h1>{data.title}</h1>
          <p>{data.excerpt}</p>
        </Container>
      </section>

      <section className="section">
        <Container className="stack">
          <Card>
            <Panel className="stack">
              <div className="post-detail__content" dangerouslySetInnerHTML={{ __html: data.content }} />
            </Panel>
          </Card>

          <Card className="info-card">
            <Panel className="stack-sm">
              <strong>Tiep tuc trai nghiem</strong>
              <p>
                Sau khi tham khao bai viet, ban co the quay lai danh sach goi bay de chon lich phu hop voi
                weather va nhu cau cua minh.
              </p>
              <Link to="/services">
                <Button variant="secondary">Xem goi dich vu</Button>
              </Link>
            </Panel>
          </Card>
        </Container>
      </section>
    </SiteLayout>
  );
};
