import type { Booking, Post, ServiceFeature, ServicePackage, Tracking } from "@paragliding/api-client";

import { repairFlightConditionLabel } from "@/shared/lib/flight-condition";
import type { Locale } from "@/shared/providers/i18n-provider";

const pickPrimaryText = (primary: string) => {
  const normalizedPrimary = String(primary ?? "").trim();
  if (normalizedPrimary) {
    return normalizedPrimary;
  }

  return "";
};

const pickVietnameseSourceText = (primary: string, _locale?: Locale) => pickPrimaryText(primary);

export const localizeServiceName = (service: Pick<ServicePackage, "name">, locale?: Locale) =>
  pickVietnameseSourceText(service.name, locale);

export const localizeServiceShortDescription = (
  service: Pick<ServicePackage, "short_description">,
  locale?: Locale
) => pickVietnameseSourceText(service.short_description, locale);

export const localizeServiceDescription = (
  service: Pick<ServicePackage, "description">,
  locale?: Locale
) => pickVietnameseSourceText(service.description, locale);

export const localizeFeatureName = (feature: Pick<ServiceFeature, "name">, locale?: Locale) =>
  pickVietnameseSourceText(feature.name, locale);

export const localizeFeatureDescription = (
  feature: Pick<ServiceFeature, "description">,
  locale?: Locale
) => pickVietnameseSourceText(feature.description, locale);

export const localizePostTitle = (post: Pick<Post, "title">, locale?: Locale) =>
  pickVietnameseSourceText(post.title, locale);

export const localizePostExcerpt = (post: Pick<Post, "excerpt">, locale?: Locale) =>
  pickVietnameseSourceText(post.excerpt, locale);

export const localizePostContent = (post: Pick<Post, "content">, locale?: Locale) =>
  pickVietnameseSourceText(post.content, locale);

export const localizeBookingServiceName = (
  record: Pick<Booking, "service_name"> | Pick<Tracking, "service_name">,
  locale?: Locale
) => pickVietnameseSourceText(record.service_name, locale);

export { repairFlightConditionLabel };
