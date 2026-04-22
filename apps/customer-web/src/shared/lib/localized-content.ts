import type { Booking, Post, ServiceFeature, ServicePackage, Tracking } from "@paragliding/api-client";
import { repairVietnameseText, type Locale } from "@/shared/providers/i18n-provider";

const pickVietnameseText = (primary: string, secondary: string) => {
  const repairedPrimary = repairVietnameseText(primary).trim();
  const repairedSecondary = repairVietnameseText(secondary).trim();
  return repairedPrimary || repairedSecondary;
};

export const localizeServiceName = (service: Pick<ServicePackage, "name" | "name_en">, _locale: Locale) =>
  pickVietnameseText(service.name, service.name_en);

export const localizeServiceShortDescription = (
  service: Pick<ServicePackage, "short_description" | "short_description_en">,
  _locale: Locale
) => pickVietnameseText(service.short_description, service.short_description_en);

export const localizeServiceDescription = (
  service: Pick<ServicePackage, "description" | "description_en">,
  _locale: Locale
) => pickVietnameseText(service.description, service.description_en);

export const localizeFeatureName = (feature: Pick<ServiceFeature, "name" | "name_en">, _locale: Locale) =>
  pickVietnameseText(feature.name, feature.name_en);

export const localizeFeatureDescription = (
  feature: Pick<ServiceFeature, "description" | "description_en">,
  _locale: Locale
) => pickVietnameseText(feature.description, feature.description_en);

export const localizePostTitle = (post: Pick<Post, "title" | "title_en">, _locale: Locale) =>
  pickVietnameseText(post.title, post.title_en);

export const localizePostExcerpt = (post: Pick<Post, "excerpt" | "excerpt_en">, _locale: Locale) =>
  pickVietnameseText(post.excerpt, post.excerpt_en);

export const localizePostContent = (post: Pick<Post, "content" | "content_en">, _locale: Locale) =>
  pickVietnameseText(post.content, post.content_en);

export const localizeBookingServiceName = (
  record: Pick<Booking, "service_name" | "service_name_en"> | Pick<Tracking, "service_name" | "service_name_en">,
  _locale: Locale
) => pickVietnameseText(record.service_name, record.service_name_en);

export const repairFlightConditionLabel = (value: string) => {
  const repairedValue = repairVietnameseText(value).trim();
  const normalized = repairedValue
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0111/g, "d")
    .replace(/\u0110/g, "D")
    .trim()
    .toLowerCase();

  if (normalized === "ly tuong") {
    return "Lý tưởng";
  }

  if (normalized === "khong ly tuong") {
    return "Không lý tưởng";
  }

  return repairedValue || value;
};
