import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { languageStorage } from "@/shared/lib/storage";

export type Locale = "vi" | "en";

const dictionaries = {
  vi: {
    nav_home: "Trang chu",
    nav_services: "Dich vu",
    nav_posts: "Bai viet",
    nav_gallery: "Bo suu tap",
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
    hero_about: "Tim hieu them",
    hero_tracking: "Tra cuu booking"
  },
  en: {
    nav_home: "Home",
    nav_services: "Services",
    nav_posts: "Blog",
    nav_gallery: "Gallery",
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
    hero_about: "About us",
    hero_tracking: "Track booking"
  }
} as const;

const phraseTranslations: Record<string, string> = {
  "Trang chu": "Home",
  "Dich vu": "Services",
  "Bai viet": "Blog",
  "Bo suu tap": "Gallery",
  "Theo doi": "Tracking",
  "Gioi thieu": "About",
  "Lien he": "Contact",
  "Tai khoan": "Account",
  "Dang nhap": "Sign in",
  "Dang xuat": "Sign out",
  "Dat ngay": "Book now",
  "Dat lich": "Book",
  "Dat lich ngay": "Book now",
  "Chi tiet": "Details",
  "Xem chi tiet": "View details",
  "Tiep tuc dat lich": "Continue booking",
  "Chon ngay va khung gio": "Choose date and time",
  "Thong tin hanh khach": "Passenger details",
  "Hoan tat form booking": "Complete booking form",
  "Ho va ten": "Full name",
  "So dien thoai": "Phone",
  "So nguoi lon": "Adults",
  "So tre em": "Children",
  "Ghi chu": "Notes",
  "Phuong thuc thanh toan": "Payment method",
  "Tu den diem hen": "Self-arrival",
  "Xe den don": "Pickup service",
  "Dia chi don": "Pickup address",
  "Can tra truoc": "Amount due now",
  "Tong gia tri": "Total value",
  "Gia tri tour": "Tour value",
  "Xac nhan dat lich": "Confirm booking",
  "Thanh toan va xac nhan booking": "Payment and booking confirmation",
  "Mo cong thanh toan": "Open payment gateway",
  "Kiem tra trang thai thanh toan": "Check payment status",
  "Theo doi hanh trinh bay": "Track flight journey",
  "Ban do hanh trinh": "Journey map",
  "Ban do se hien thi khi hanh trinh bat dau.": "The map appears when the journey starts.",
  "Dieu kien bay": "Flight condition",
  "Thoi tiet": "Weather",
  "Ly tuong": "Ideal",
  "Khong ly tuong": "Not ideal",
  "Nhiet do": "Temperature",
  "Suc gio": "Wind",
  "Tam nhin": "Visibility",
  "Diem cat canh": "Launch site",
  "Diem ha canh": "Landing site",
  "Tre em toi thieu": "Minimum child age",
  "Gia dich vu": "Service price",
  "Chuan bi truoc bay": "Before flying",
  "Checklist danh cho khach hang": "Customer checklist",
  "Dich vu di kem": "Included services",
  "Nhung gi da co trong goi": "Included in this package",
  "Dieu kien tham gia": "Participation rules",
  "Bai viet moi": "Latest posts",
  "Xem tat ca bai viet": "View all posts",
  "Xem goi dich vu": "View services",
  "Xem tat ca": "View all"
};

const originalTextNodes = new WeakMap<Node, string>();
const originalAttributes = new WeakMap<Element, Record<string, string>>();

const translateDocument = (locale: Locale) => {
  if (typeof document === "undefined") {
    return;
  }

  const shouldSkip = (node: Node) => {
    const parent = node.parentElement;
    return Boolean(parent?.closest("script,style,textarea,select,code,pre"));
  };

  const translateTextNode = (node: Node) => {
    if (shouldSkip(node)) {
      return;
    }
    const original = originalTextNodes.get(node) ?? node.textContent ?? "";
    if (!originalTextNodes.has(node)) {
      originalTextNodes.set(node, original);
    }
    const trimmed = original.trim();
    if (!trimmed) {
      return;
    }
    const translated = locale === "en" ? phraseTranslations[trimmed] : undefined;
    const nextText = translated ? original.replace(trimmed, translated) : original;
    if (node.textContent !== nextText) {
      node.textContent = nextText;
    }
  };

  const translateAttributes = (element: Element) => {
    const attrs = ["placeholder", "title", "aria-label", "alt"];
    const stored = originalAttributes.get(element) ?? {};
    attrs.forEach((attr) => {
      const value = element.getAttribute(attr);
      if (!value) {
        return;
      }
      if (!stored[attr]) {
        stored[attr] = value;
      }
      const translated = locale === "en" ? phraseTranslations[stored[attr]] : undefined;
      const nextValue = translated ?? stored[attr];
      if (element.getAttribute(attr) !== nextValue) {
        element.setAttribute(attr, nextValue);
      }
    });
    originalAttributes.set(element, stored);
  };

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    translateTextNode(node);
    node = walker.nextNode();
  }
  document.querySelectorAll("[placeholder],[title],[aria-label],img[alt]").forEach(translateAttributes);
};

type I18nContextValue = {
  locale: Locale;
  setLocale: (value: Locale) => void;
  t: (key: keyof (typeof dictionaries)["vi"]) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider = ({ children }: PropsWithChildren) => {
  const [locale, setLocaleState] = useState<Locale>(() => (languageStorage.get() === "en" ? "en" : "vi"));

  useEffect(() => {
    document.documentElement.lang = locale;
    window.setTimeout(() => translateDocument(locale), 0);
    const observer = new MutationObserver(() => translateDocument(locale));
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [locale]);

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
