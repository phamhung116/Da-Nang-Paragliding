import type { Booking, Post, ServiceFeature, ServicePackage, Tracking } from "@paragliding/api-client";

import { repairFlightConditionLabel } from "@/shared/lib/flight-condition";

type Locale = "vi" | "en";

const pickPrimaryText = (primary: string, secondary: string) => {
  const normalizedPrimary = String(primary ?? "").trim();
  if (normalizedPrimary) {
    return normalizedPrimary;
  }

  return String(secondary ?? "").trim();
};

export const localizeServiceName = (service: Pick<ServicePackage, "name" | "name_en">, _locale?: Locale) =>
  pickPrimaryText(service.name, service.name_en);

export const localizeServiceShortDescription = (
  service: Pick<ServicePackage, "short_description" | "short_description_en">,
  _locale?: Locale
) => pickPrimaryText(service.short_description, service.short_description_en);

export const localizeServiceDescription = (
  service: Pick<ServicePackage, "description" | "description_en">,
  _locale?: Locale
) => pickPrimaryText(service.description, service.description_en);

export const localizeFeatureName = (feature: Pick<ServiceFeature, "name" | "name_en">, _locale?: Locale) =>
  pickPrimaryText(feature.name, feature.name_en);

export const localizeFeatureDescription = (
  feature: Pick<ServiceFeature, "description" | "description_en">,
  _locale?: Locale
) => pickPrimaryText(feature.description, feature.description_en);

export const localizePostTitle = (post: Pick<Post, "title" | "title_en">, _locale?: Locale) =>
  pickPrimaryText(post.title, post.title_en);

export const localizePostExcerpt = (post: Pick<Post, "excerpt" | "excerpt_en">, _locale?: Locale) =>
  pickPrimaryText(post.excerpt, post.excerpt_en);

export const localizePostContent = (post: Pick<Post, "content" | "content_en">, _locale?: Locale) =>
  pickPrimaryText(post.content, post.content_en);

export const localizeBookingServiceName = (
  record: Pick<Booking, "service_name" | "service_name_en"> | Pick<Tracking, "service_name" | "service_name_en">,
  _locale?: Locale
) => pickPrimaryText(record.service_name, record.service_name_en);

export { repairFlightConditionLabel };
