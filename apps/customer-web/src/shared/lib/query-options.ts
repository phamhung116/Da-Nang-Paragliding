import { customerApi } from "@/shared/config/api";

const CONTENT_STALE_TIME = 10 * 60_000;
const AVAILABILITY_STALE_TIME = 2 * 60_000;

export const customerQueryKeys = {
  services: ["services"] as const,
  posts: ["posts"] as const,
  service: (slug: string) => ["service", slug] as const,
  post: (slug: string) => ["post", slug] as const,
  availability: (serviceSlug: string, year: number, month: number) =>
    ["availability", serviceSlug, year, month] as const
};

export const servicesQueryOptions = () => ({
  queryKey: customerQueryKeys.services,
  queryFn: () => customerApi.listServices(),
  staleTime: CONTENT_STALE_TIME
});

export const postsQueryOptions = () => ({
  queryKey: customerQueryKeys.posts,
  queryFn: () => customerApi.listPosts(),
  staleTime: CONTENT_STALE_TIME
});

export const serviceQueryOptions = (slug: string) => ({
  queryKey: customerQueryKeys.service(slug),
  queryFn: () => customerApi.getService(slug),
  staleTime: CONTENT_STALE_TIME
});

export const postQueryOptions = (slug: string) => ({
  queryKey: customerQueryKeys.post(slug),
  queryFn: () => customerApi.getPost(slug),
  staleTime: CONTENT_STALE_TIME
});

export const availabilityQueryOptions = (serviceSlug: string, year: number, month: number) => ({
  queryKey: customerQueryKeys.availability(serviceSlug, year, month),
  queryFn: () => customerApi.getAvailability(serviceSlug, year, month),
  staleTime: AVAILABILITY_STALE_TIME
});
