import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge, Card, Container, Panel } from "@paragliding/ui";
import { customerApi } from "@/shared/config/api";
import { SiteLayout } from "@/widgets/layout/site-layout";

const staticGalleryImages = [
  {
    src: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80",
    title: "Tracking banner"
  },
  {
    src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    title: "Sunrise flight"
  },
  {
    src: "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1200&q=80",
    title: "Son Tra forest"
  },
  {
    src: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    title: "Golden hour"
  }
];

export const GalleryPage = () => {
  const { data: services = [] } = useQuery({
    queryKey: ["gallery-services"],
    queryFn: () => customerApi.listServices()
  });
  const { data: posts = [] } = useQuery({
    queryKey: ["gallery-posts"],
    queryFn: () => customerApi.listPosts()
  });

  const images = useMemo(() => {
    const allImages = [
      ...staticGalleryImages,
      ...services.flatMap((service) => [
        { src: service.hero_image, title: service.name },
        ...service.gallery_images.map((image, index) => ({
          src: image,
          title: `${service.name} ${index + 1}`
        }))
      ]),
      ...posts.map((post) => ({ src: post.cover_image, title: post.title }))
    ];
    const seen = new Set<string>();
    return allImages.filter((image) => {
      if (!image.src || seen.has(image.src)) {
        return false;
      }
      seen.add(image.src);
      return true;
    });
  }, [posts, services]);

  return (
    <SiteLayout>
      <section className="page-banner page-banner--gallery">
        <div className="page-banner__image">
          <img src={images[0]?.src ?? staticGalleryImages[0].src} alt="Da Nang Paragliding gallery" />
          <div className="page-banner__overlay" />
        </div>
        <Container className="page-banner__content">
          <Badge>Bo suu tap</Badge>
          <h1>Nhung khoanh khac bay, bien va Son Tra.</h1>
          <p>Tat ca hinh anh dang duoc su dung trong website duoc gom lai mot noi de khach xem nhanh.</p>
        </Container>
      </section>

      <section className="section">
        <Container className="stack">
          <div className="gallery-grid">
            {images.map((image, index) => (
              <Card key={image.src} className={`gallery-card ${index % 5 === 0 ? "gallery-card--wide" : ""}`}>
                <img src={image.src} alt={image.title} />
                <Panel className="gallery-card__caption">
                  <Badge>{image.title}</Badge>
                </Panel>
              </Card>
            ))}
          </div>
        </Container>
      </section>
    </SiteLayout>
  );
};
