<<<<<<< HEAD
import { createContext, useContext, useMemo, useState, type PropsWithChildren } from "react";
import { languageStorage } from "@/shared/lib/storage";

export type Locale = "vi" | "en";

const dictionaries = {
  vi: {
    nav_home: "Trang chủ",
    nav_services: "Dịch vụ",
    nav_posts: "Tin tức",
    nav_tracking: "Theo dõi",
    nav_about: "Giới thiệu",
    nav_contact: "Liên hệ",
    nav_account: "Tài khoản",
    nav_login: "Đăng nhập",
    nav_logout: "Đăng xuất",
    quick_book: "Đặt ngay",
    call_now: "Goi ngay",
    hero_kicker: "Trải nghiệm đỉnh cao tại Đà Nẵng",
    hero_title_line_1: "BAY LƯỢN GIỮA",
    hero_title_line_2: "MÂY TRỜI",
    hero_services: "Đặt lịch ngay",
    hero_about: "Tìm hiểu thêm"
  },
  en: {
    nav_home: "Home",
    nav_services: "Services",
    nav_posts: "Blog",
    nav_tracking: "Tracking",
    nav_about: "About",
    nav_contact: "Contact",
    nav_account: "Account",
    nav_login: "Sign in",
    nav_logout: "Sign out",
    quick_book: "Book now",
    call_now: "Call now",
    hero_kicker: "Premier paragliding in Da Nang",
    hero_title_line_1: "Fly above",
    hero_title_line_2: "the Son Tra skyline",
    hero_services: "Book now",
    hero_about: "About us"
  }
} as const;

type I18nContextValue = {
  locale: Locale;
  setLocale: (value: Locale) => void;
  t: (key: keyof (typeof dictionaries)["vi"]) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider = ({ children }: PropsWithChildren) => {
  const [locale, setLocaleState] = useState<Locale>(() =>
    languageStorage.get() === "en" ? "en" : "vi"
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale(nextLocale) {
        languageStorage.set(nextLocale);
        setLocaleState(nextLocale);
      },
      t(key) {
        return dictionaries[locale][key];
      }
    }),
    [locale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider");
  }
  return context;
};
