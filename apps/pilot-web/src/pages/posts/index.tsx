import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Badge, Button, Card, Panel } from "@paragliding/ui";
import { pilotApi } from "@/shared/config/api";
import { PilotLayout } from "@/widgets/layout/pilot-layout";

export const PostsPage = () => {
  const { data: posts = [] } = useQuery({
    queryKey: ["pilot-posts"],
    queryFn: () => pilotApi.listPosts()
  });

  return (
    <PilotLayout>
      <div className="pilot-stack">
        <div className="pilot-heading">
          <div>
            <Badge>Briefing posts</Badge>
            <h1>Operational reading</h1>
            <p>Read published notes from admin before flight day. Pilot workspace stays read only.</p>
          </div>
        </div>

        <div className="pilot-post-grid">
          {posts.map((post) => (
            <Card key={post.slug}>
              <img className="pilot-post-card__image" src={post.cover_image} alt={post.title} />
              <Panel className="pilot-post-card__body">
                <Badge>{new Date(post.published_at ?? post.created_at ?? "").toLocaleDateString("vi-VN")}</Badge>
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
                <Link to={`/posts/${post.slug}`}>
                  <Button variant="secondary">Read post</Button>
                </Link>
              </Panel>
            </Card>
          ))}
        </div>
      </div>
    </PilotLayout>
  );
};
