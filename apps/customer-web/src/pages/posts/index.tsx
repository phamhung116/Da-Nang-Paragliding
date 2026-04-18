import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Badge, Button, Card, Container, Panel } from "@paragliding/ui";
import { customerApi } from "@/shared/config/api";
import { SiteLayout, Banner } from "@/widgets/layout/site-layout";
import { motion } from "motion/react"
import { ChevronRight } from "lucide-react";

export const PostsPage = () => {
  const { data: posts = [] } = useQuery({
    queryKey: ["posts"],
    queryFn: () => customerApi.listPosts()
  });
  const remainingPosts = posts.slice(0);

  return (
    <SiteLayout>
      <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="pb-20"
      >
        <Banner 
          title="Tin Tức & Hoạt Động" 
          subtitle="Cập nhật những thông tin mới nhất về hoạt động nhảy dù lượn tại Đà Nẵng."
          image="https://images.unsplash.com/photo-1544625344-63189df1e401?auto=format&fit=crop&q=80&w=1920"
        />

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {remainingPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {remainingPosts.map((post) => (
                <Card key={post.slug} className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-stone-100 flex flex-row md:flex-col group hover:shadow-xl transition-all duration-500 min-h-[140px] md:min-h-0 cursor-pointer">
                  <div className="w-32 md:w-full aspect-square md:aspect-auto md:h-48 overflow-hidden flex-shrink-0">
                    <img className="post-card__image" src={post.cover_image} alt={post.title} />
                  </div>
                  <div className="p-4 md:p-6 flex-grow flex flex-col justify-center md:justify-start">
                    <p className="text-[8px] md:text-[10px] font-bold text-brand uppercase mb-1 md:mb-2">
                      {new Date(post.published_at ?? post.created_at ?? "").toLocaleDateString("vi-VN")}
                    </p>
                    <h3 className="text-sm md:text-lg font-bold mb-1 md:mb-3 text-stone-900 leading-tight line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-[10px] md:text-sm text-stone-500 mb-2 md:mb-6 line-clamp-2 md:line-clamp-3">
                      {post.excerpt}
                    </p>
                    <Link to={`/posts/${post.slug}`}>
                      <Button className="mt-auto text-[10px] md:text-sm font-bold text-brand flex items-center gap-1 hover:gap-2 transition-all">
                        Doc bai viet
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="empty-state-card">
              <Panel className="stack-sm">
                <Badge>Bai viet</Badge>
                <strong>Blog dang duoc cap nhat.</strong>
              </Panel>
            </Card>
          )}
        </section>
      </motion.div>
    </SiteLayout>
  );
};
