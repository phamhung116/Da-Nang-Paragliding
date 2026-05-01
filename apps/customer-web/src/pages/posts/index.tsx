import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import type { Post } from "@paragliding/api-client";
import { Badge, Button, Card, Container, Panel } from "@paragliding/ui";
import { postsQueryOptions } from "@/shared/lib/query-options";
import { SiteLayout, Banner } from "@/widgets/layout/site-layout";
import { motion } from "motion/react"
import { ChevronRight } from "lucide-react";
import { formatDate } from "@/shared/lib/format";
import { localizePostExcerpt, localizePostTitle } from "@/shared/lib/localized-content";
import { useTranslatedText } from "@/shared/lib/use-translated-text";
import { useI18n } from "@/shared/providers/i18n-provider";

const PostListCard = ({ post }: { post: Post }) => {
  const { locale, t } = useI18n();
  const sourceTitle = localizePostTitle(post, locale);
  const sourceExcerpt = localizePostExcerpt(post, locale);
  const title = useTranslatedText(sourceTitle);
  const excerpt = useTranslatedText(sourceExcerpt);

  return (
    <Link to={`/posts/${post.slug}`}>
      <Card
        key={post.slug}
        className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-stone-100 flex flex-row md:flex-col group hover:shadow-xl transition-all duration-500 min-h-[140px] md:min-h-0 cursor-pointer"
      >
        <div className="w-32 md:w-full aspect-square md:aspect-auto md:h-48 overflow-hidden flex-shrink-0">
          <img className="post-card__image" src={post.cover_image} alt={title} loading="lazy" decoding="async" />
        </div>
        <div className="p-4 md:p-6 flex-grow flex flex-col justify-center md:justify-start">
          <p className="text-[8px] md:text-[10px] font-bold text-brand uppercase mb-1 md:mb-2">
            {formatDate(post.published_at ?? post.created_at ?? "", undefined, locale)}
          </p>
          <h3 className="text-sm md:text-lg font-bold mb-1 md:mb-3 text-stone-900 leading-tight line-clamp-2">
            {title}
          </h3>
          <p className="text-[10px] md:text-sm text-stone-500 mb-2 md:mb-6 line-clamp-2 md:line-clamp-3">
            {excerpt}
          </p>
          <Button className="mt-auto flex items-center gap-1 text-[10px] font-bold !text-white transition-all hover:gap-2 hover:!text-white md:text-sm">
            {t("read_post")}
          </Button>
        </div>
      </Card>
    </Link>
  );
};

export const PostsPage = () => {
  const { tText } = useI18n();
  const { data: posts = [] } = useQuery({
    ...postsQueryOptions()
  });

  return (
    <SiteLayout>
      <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="pb-20"
      >
        <Banner 
          title="Tin tức & Hoạt động" 
          subtitle="Cập nhật những thông tin mới nhất về hoạt động bay dù lượn tại Đà Nẵng."
          image="https://images.unsplash.com/photo-1596263576925-d90d63691097?auto=format&fit=crop&q=80&w=1920"
        />

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {posts.map((post) => (
                <PostListCard key={post.slug} post={post} />
              ))}
            </div>
          ) : (
            <Card className="empty-state-card">
              <Panel className="stack-sm">
                <Badge>{tText("Bài viết")}</Badge>
                <strong>{tText("Blog đang được cập nhật.")}</strong>
              </Panel>
            </Card>
          )}
        </section>
      </motion.div>
    </SiteLayout>
  );
};
