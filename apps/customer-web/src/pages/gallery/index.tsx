import { useEffect, useMemo, useRef, useState } from "react";
import { Card, Container } from "@paragliding/ui";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import { SiteLayout, Banner } from "@/widgets/layout/site-layout";

type MediaKind = "image" | "video";

type MediaItem = {
  kind: MediaKind;
  name: string;
  src: string;
};

const MEDIA_BATCH_SIZE = 12;
const mediaModules = import.meta.glob(
  "../../../media/**/*.{avif,gif,jpeg,jpg,mov,mp4,png,webm,webp}",
  {
    eager: true,
    import: "default"
  }
) as Record<string, string>;

const collator = new Intl.Collator("vi", {
  numeric: true,
  sensitivity: "base"
});

const videoExtensions = new Set([".mov", ".mp4", ".webm"]);

const getFileExtension = (filepath: string) => {
  const filename = filepath.split("/").pop() ?? filepath;
  const dotIndex = filename.lastIndexOf(".");
  return dotIndex >= 0 ? filename.slice(dotIndex).toLowerCase() : "";
};

const getFileName = (filepath: string) => filepath.split("/").pop() ?? filepath;

const getMediaKind = (filepath: string): MediaKind => {
  const extension = getFileExtension(filepath);
  return videoExtensions.has(extension) ? "video" : "image";
};

const getDisplayName = (filepath: string) => {
  const filename = getFileName(filepath);
  const dotIndex = filename.lastIndexOf(".");
  return dotIndex >= 0 ? filename.slice(0, dotIndex) : filename;
};

export const GalleryPage = () => {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [visibleCount, setVisibleCount] = useState(0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const mediaItems = useMemo<MediaItem[]>(() => {
    return Object.entries(mediaModules)
      .map(([filepath, src]) => ({
        kind: getMediaKind(filepath),
        name: getDisplayName(filepath),
        src
      }))
      .sort((a, b) => collator.compare(a.name, b.name));
  }, []);

  const activeItem = activeIndex !== null ? mediaItems[activeIndex] : null;
  const heroMedia = mediaItems.find((item) => item.kind === "image") ?? mediaItems[0];
  const hasPrevious = activeIndex !== null && activeIndex > 0;
  const hasNext = activeIndex !== null && activeIndex < mediaItems.length - 1;

  useEffect(() => {
    setVisibleCount(Math.min(MEDIA_BATCH_SIZE, mediaItems.length));
  }, [mediaItems.length]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || visibleCount >= mediaItems.length) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return;
        }

        setVisibleCount((current) => Math.min(current + MEDIA_BATCH_SIZE, mediaItems.length));
      },
      {
        rootMargin: "600px 0px"
      }
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [mediaItems.length, visibleCount]);

  useEffect(() => {
    if (activeIndex === null) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveIndex(null);
        return;
      }

      if (event.key === "ArrowLeft") {
        setActiveIndex((current) => {
          if (current === null) {
            return current;
          }

          return Math.max(0, current - 1);
        });
      }

      if (event.key === "ArrowRight") {
        setActiveIndex((current) => {
          if (current === null) {
            return current;
          }

          return Math.min(mediaItems.length - 1, current + 1);
        });
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex, mediaItems.length]);

  const openMedia = (index: number) => {
    setActiveIndex(index);
  };

  const closeMedia = () => {
    setActiveIndex(null);
  };

  const showPrevious = () => {
    setActiveIndex((current) => (current === null ? current : Math.max(0, current - 1)));
  };

  const showNext = () => {
    setActiveIndex((current) =>
      current === null ? current : Math.min(mediaItems.length - 1, current + 1)
    );
  };

  const visibleItems = mediaItems.slice(0, visibleCount);

  return (
    <SiteLayout>
      <Banner title="Bộ sưu tập" image={heroMedia?.src ?? "/media/img/anh1.jpg"} />

      <section className="section">
        <Container className="stack">
          <div className="gallery-grid">
            {visibleItems.map((item, index) => (
              <Card
                key={item.src}
                className={`gallery-card overflow-hidden ${item.kind === "image" && index % 5 === 0 ? "gallery-card--wide" : ""}`}
              >
                <button
                  type="button"
                  onClick={() => openMedia(index)}
                  className="group relative block w-full cursor-zoom-in overflow-hidden bg-stone-950"
                  aria-label={`Xem ${item.kind === "video" ? "video" : "ảnh"} ${item.name}`}
                >
                  {item.kind === "image" ? (
                    <img
                      src={item.src}
                      alt={item.name}
                      loading="lazy"
                      className="h-[320px] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <>
                      <video
                        src={item.src}
                        muted
                        playsInline
                        preload="metadata"
                        className="h-[320px] w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                      <div className="absolute inset-0 bg-black/25 transition-colors group-hover:bg-black/35" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white backdrop-blur-md transition-transform group-hover:scale-110">
                          <Play size={26} className="ml-1" fill="currentColor" />
                        </span>
                      </div>
                    </>
                  )}
                </button>
              </Card>
            ))}
          </div>

          {visibleCount < mediaItems.length ? (
            <div ref={loadMoreRef} className="py-6 text-center text-sm font-medium text-stone-500">
              Đang tải thêm nội dung...
            </div>
          ) : null}
        </Container>
      </section>

      {activeItem ? (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm"
          onClick={closeMedia}
        >
          <div
            className="relative flex h-full items-center justify-center p-6 md:p-12"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeMedia}
              className="absolute right-4 top-4 z-[101] flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="Đóng trình xem media"
            >
              <X size={20} />
            </button>

            {hasPrevious ? (
              <button
                type="button"
                onClick={showPrevious}
                className="absolute left-4 top-1/2 z-[101] flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                aria-label="Xem media trước"
              >
                <ChevronLeft size={24} />
              </button>
            ) : null}

            {hasNext ? (
              <button
                type="button"
                onClick={showNext}
                className="absolute right-4 top-1/2 z-[101] flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                aria-label="Xem media tiếp theo"
              >
                <ChevronRight size={24} />
              </button>
            ) : null}

            {activeItem.kind === "image" ? (
              <img
                src={activeItem.src}
                alt={activeItem.name}
                className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl"
              />
            ) : (
              <video
                key={activeItem.src}
                src={activeItem.src}
                controls
                autoPlay
                playsInline
                className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl"
              />
            )}
          </div>
        </div>
      ) : null}
    </SiteLayout>
  );
};
