import type { Booking, Post, ServiceFeature, ServicePackage, Tracking } from "@paragliding/api-client";

import { repairFlightConditionLabel } from "@/shared/lib/flight-condition";
import { repairVietnameseText, type Locale } from "@/shared/providers/i18n-provider";

const pickPrimaryText = (primary: string) => {
  const normalizedPrimary = String(primary ?? "").trim();
  if (normalizedPrimary) {
    return repairVietnameseText(normalizedPrimary);
  }

  return "";
};

const pickLocalizedText = (primary: string, english: string, locale?: Locale) => {
  if (locale === "en") {
    const normalizedEnglish = String(english ?? "").trim();
    if (normalizedEnglish) {
      return normalizedEnglish;
    }
  }

  return pickPrimaryText(primary);
};

export const localizeServiceName = (service: Pick<ServicePackage, "name" | "name_en">, locale?: Locale) =>
  pickLocalizedText(service.name, service.name_en, locale);

export const localizeServiceShortDescription = (
  service: Pick<ServicePackage, "short_description" | "short_description_en">,
  locale?: Locale
) => pickLocalizedText(service.short_description, service.short_description_en, locale);

export const localizeServiceDescription = (
  service: Pick<ServicePackage, "description" | "description_en">,
  locale?: Locale
) => pickLocalizedText(service.description, service.description_en, locale);

export const localizeFeatureName = (feature: Pick<ServiceFeature, "name" | "name_en">, locale?: Locale) =>
  pickLocalizedText(feature.name, feature.name_en, locale);

export const localizeFeatureDescription = (
  feature: Pick<ServiceFeature, "description" | "description_en">,
  locale?: Locale
) => pickLocalizedText(feature.description, feature.description_en, locale);

export const localizePostTitle = (post: Pick<Post, "title" | "title_en">, locale?: Locale) =>
  pickLocalizedText(post.title, post.title_en, locale);

export const localizePostExcerpt = (post: Pick<Post, "excerpt" | "excerpt_en">, locale?: Locale) =>
  pickLocalizedText(post.excerpt, post.excerpt_en, locale);

export const localizePostContent = (post: Pick<Post, "content" | "content_en">, locale?: Locale) =>
  pickLocalizedText(post.content, post.content_en, locale);

export const localizeBookingServiceName = (
  record: Pick<Booking, "service_name" | "service_name_en"> | Pick<Tracking, "service_name" | "service_name_en">,
  locale?: Locale
) => pickLocalizedText(record.service_name, record.service_name_en, locale);

export { repairFlightConditionLabel };
