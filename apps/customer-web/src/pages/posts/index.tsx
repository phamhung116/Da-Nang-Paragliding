import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Badge, Button, Card, Container, Panel } from "@paragliding/ui";
import { customerApi } from "@/shared/config/api";
import { SiteLayout } from "@/widgets/layout/site-layout";

export const PostsPage = () => {
  const { data: posts = [] } = useQuery({
    queryKey: ["posts"],
    queryFn: () => customerApi.listPosts()
  });

  const featuredPost = posts[0];
  const remainingPosts = posts.slice(1);

  return (
    <SiteLayout>
      <section className="page-banner page-banner--posts">
        <div className="page-banner__image">
          <img
            src="https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1800&q=80"
            alt="Posts banner"
          />
          <div className="page-banner__overlay" />
        </div>
        <Container className="page-banner__content">
          <Badge>Bai viet</Badge>
          <h1>Tin tuc, chia se kinh nghiem va thong bao van hanh.</h1>
          <p>Khach co the doc kinh nghiem truoc bay, tips ve weather va nhung update moi tu doanh nghiep.</p>
        </Container>
      </section>

      <section className="section">
        <Container className="stack">
          {featuredPost ? (
            <Card className="post-feature-card">
              <img className="post-feature-card__image" src={featuredPost.cover_image} alt={featuredPost.title} />
              <Panel className="stack">
                <Badge>{new Date(featuredPost.published_at ?? featuredPost.created_at ?? "").toLocaleDateString("vi-VN")}</Badge>
                <h2 className="detail-title">{featuredPost.title}</h2>
                <p className="detail-copy">{featuredPost.excerpt}</p>
                <Link to={`/posts/${featuredPost.slug}`}>
                  <Button>Doc bai viet noi bat</Button>
                </Link>
              </Panel>
            </Card>
          ) : (
            <Card className="empty-state-card">
              <Panel className="stack-sm">
                <Badge>Bai viet</Badge>
                <strong>Blog dang duoc cap nhat.</strong>
                <p>Khi admin dang bai moi, customer va pilot se thay noi dung tai day.</p>
              </Panel>
            </Card>
          )}

          {remainingPosts.length > 0 ? (
            <div className="post-grid">
              {remainingPosts.map((post) => (
                <Card key={post.slug} className="post-card">
                  <img className="post-card__image" src={post.cover_image} alt={post.title} />
                  <Panel className="post-card__body">
                    <Badge>{new Date(post.published_at ?? post.created_at ?? "").toLocaleDateString("vi-VN")}</Badge>
                    <h3>{post.title}</h3>
                    <p>{post.excerpt}</p>
                    <Link to={`/posts/${post.slug}`}>
                      <Button variant="secondary">Doc bai viet</Button>
                    </Link>
                  </Panel>
                </Card>
              ))}
            </div>
          ) : null}
        </Container>
      </section>
    </SiteLayout>
  );
};
