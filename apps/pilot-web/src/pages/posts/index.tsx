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
            <Badge>Bài hướng dẫn</Badge>
            <h1>Tài liệu vận hành</h1>
            <p>Đọc ghi chú đã xuất bản từ quản trị viên trước ngày bay. Khu vực phi công chỉ dùng để xem nội dung.</p>
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
                  <Button variant="secondary">Đọc bài viết</Button>
                </Link>
              </Panel>
            </Card>
          ))}
        </div>
      </div>
    </PilotLayout>
  );
};
