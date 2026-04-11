import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Badge, Card, Panel } from "@paragliding/ui";
import { pilotApi } from "@/shared/config/api";
import { PilotLayout } from "@/widgets/layout/pilot-layout";

export const PostDetailPage = () => {
  const { slug = "" } = useParams();
  const { data } = useQuery({
    queryKey: ["pilot-post", slug],
    queryFn: () => pilotApi.getPost(slug),
    enabled: Boolean(slug)
  });

  if (!data) {
    return (
      <PilotLayout>
        <div className="pilot-stack">Loading post...</div>
      </PilotLayout>
    );
  }

  return (
    <PilotLayout>
      <div className="pilot-stack">
        <img className="pilot-post-detail__hero" src={data.cover_image} alt={data.title} />
        <Card>
          <Panel className="pilot-stack">
            <Badge>{new Date(data.published_at ?? data.created_at ?? "").toLocaleDateString("vi-VN")}</Badge>
            <h1>{data.title}</h1>
            <p className="pilot-meta">{data.excerpt}</p>
            <div className="pilot-post-detail__content" dangerouslySetInnerHTML={{ __html: data.content }} />
          </Panel>
        </Card>
      </div>
    </PilotLayout>
  );
};
