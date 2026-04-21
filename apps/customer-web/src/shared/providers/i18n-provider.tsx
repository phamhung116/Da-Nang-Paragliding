import { createContext, useContext, useEffect, useMemo, type PropsWithChildren } from "react";

export type Locale = "vi" | "en";

const dictionary = {
  nav_home: "Trang chủ",
  nav_services: "Dịch vụ",
  nav_posts: "Bài viết",
  nav_gallery: "Bộ sưu tập",
  nav_tracking: "Theo dõi",
  nav_about: "Giới thiệu",
  nav_contact: "Liên hệ",
  nav_account: "Tài khoản",
  nav_login: "Đăng nhập",
  nav_logout: "Đăng xuất",
  quick_book: "Đặt ngay",
  call_now: "Gọi ngay",
  hero_kicker: "Trải nghiệm đỉnh cao tại Đà Nẵng",
  hero_title_line_1: "Bay lượn giữa",
  hero_title_line_2: "mây trời Sơn Trà",
  hero_services: "Xem gói dịch vụ",
  hero_about: "Tìm hiểu thêm",
  hero_tracking: "Tra cứu booking"
} as const;

type I18nContextValue = {
  locale: Locale;
  setLocale: (value: Locale) => void;
  t: (key: keyof typeof dictionary) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

const stripVietnamese = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const looksLikeBrokenUtf8 = (value: string) => /(?:Ã.|Â.|Ä.|á»|áº|Æ.|Å.)/.test(value);

const tryDecodeLatin1Utf8 = (value: string) => {
  try {
    const bytes = Uint8Array.from(Array.from(value), (character) => character.charCodeAt(0));
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return value;
  }
};

const exactRepairs = new Map<string, string>([
  ["ly tuong", "Lý tưởng"],
  ["khong ly tuong", "Không lý tưởng"],
  ["dieu kien bay", "Điều kiện bay"],
  ["thoi tiet", "Thời tiết"],
  ["thoi tiet hom nay", "Thời tiết hôm nay"],
  ["du bao thoi tiet", "Dự báo thời tiết"],
  ["suc gio", "Sức gió"],
  ["tam nhin", "Tầm nhìn"],
  ["nhiet do", "Nhiệt độ"],
  ["trang thai", "Trạng thái"],
  ["gioi thieu", "Giới thiệu"],
  ["lien he", "Liên hệ"],
  ["bai viet", "Bài viết"],
  ["dang nhap", "Đăng nhập"],
  ["dang xuat", "Đăng xuất"],
  ["dat ngay", "Đặt ngay"],
  ["dat lich", "Đặt lịch"],
  ["xem chi tiet", "Xem chi tiết"],
  ["doc bai viet", "Đọc bài viết"],
  ["ma booking", "Mã booking"]
]);

export const repairVietnameseText = (value: string) => {
  if (!value) {
    return "";
  }

  let repaired = value;
  if (looksLikeBrokenUtf8(repaired) && Array.from(repaired).every((character) => character.charCodeAt(0) <= 255)) {
    repaired = tryDecodeLatin1Utf8(repaired);
  }

  return exactRepairs.get(stripVietnamese(repaired)) ?? repaired;
};

export const I18nProvider = ({ children }: PropsWithChildren) => {
  useEffect(() => {
    document.documentElement.lang = "vi";
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale: "vi",
      setLocale() {},
      t(key) {
        return dictionary[key];
      }
    }),
    []
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
