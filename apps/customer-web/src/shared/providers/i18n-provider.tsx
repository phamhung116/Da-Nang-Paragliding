import { createContext, useContext, useMemo, useState, type PropsWithChildren } from "react";
import { languageStorage } from "@/shared/lib/storage";

export type Locale = "vi" | "en";

const dictionaries = {
  vi: {
    nav_home: "Trang chu",
    nav_services: "Dich vu",
    nav_posts: "Bai viet",
    nav_tracking: "Theo doi",
    nav_about: "Gioi thieu",
    nav_contact: "Lien he",
    nav_account: "Tai khoan",
    nav_login: "Dang nhap",
    nav_logout: "Dang xuat",
    quick_book: "Dat ngay",
    call_now: "Goi ngay",
    hero_kicker: "Trai nghiem dinh cao tai Da Nang",
    hero_title_line_1: "Bay luon giua",
    hero_title_line_2: "may troi Son Tra",
    hero_services: "Xem goi dich vu",
    hero_tracking: "Tra cuu booking"
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
    hero_services: "View packages",
    hero_tracking: "Track booking"
  }
} as const;

type I18nContextValue = {
  locale: Locale;
  setLocale: (value: Locale) => void;
  t: (key: keyof (typeof dictionaries)["vi"]) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider = ({ children }: PropsWithChildren) => {
  const [locale, setLocaleState] = useState<Locale>(() => (languageStorage.get() === "en" ? "en" : "vi"));

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
