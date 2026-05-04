import type { PropsWithChildren } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Button, Container } from "@paragliding/ui";
import { Mail, MapPin, Menu, Phone, UserRound, X } from "lucide-react";
import { routes } from "@/shared/config/routes";
import { businessInfo } from "@/shared/constants/business";
import { useAuth } from "@/shared/providers/auth-provider";
import { useI18n, type Locale } from "@/shared/providers/i18n-provider";

export const Banner = ({ title, subtitle, image }: { title: string; subtitle?: string; image: string }) => {
  const { tText } = useI18n();
  const displayTitle = tText(title);
  const displaySubtitle = subtitle ? tText(subtitle) : undefined;

  return (
    <section className="relative mt-20 mb-12 flex h-[40vh] items-center overflow-hidden md:mb-20 md:h-[50vh]">
      <div className="absolute inset-0 z-0">
        <img src={image} alt={displayTitle} className="h-full w-full object-cover" decoding="async" referrerPolicy="no-referrer" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/20" />
      </div>
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 text-white sm:px-6 lg:px-8">
        <div>
          <h1 className="mb-4 text-4xl font-black uppercase tracking-tighter md:text-7xl">{displayTitle}</h1>
          {displaySubtitle ? (
            <p className="max-w-2xl text-lg font-medium leading-relaxed text-stone-300 md:text-xl">{displaySubtitle}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
};

type SiteLayoutProps = PropsWithChildren<{
  hideHeader?: boolean;
  hideFooter?: boolean;
}>;

export const SiteLayout = ({ children, hideHeader = false, hideFooter = false }: SiteLayoutProps) => {
  const { account, isAuthenticated, logout } = useAuth();
  const { isTranslating, locale, setLocale, t, tText } = useI18n();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  const navItems = [
    { to: routes.home, label: t("nav_home") },
    { to: routes.services, label: t("nav_services") },
    { to: routes.posts, label: t("nav_posts") },
    { to: routes.gallery, label: t("nav_gallery") },
    { to: routes.tracking, label: t("nav_tracking") },
    { to: routes.contact, label: t("nav_contact") }
  ];

  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const avatarLabel = useMemo(() => {
    const fullName = account?.full_name?.trim();
    if (!fullName) {
      return "DP";
    }

    return fullName
      .split(/\s+/)
      .slice(0, 2)
      .map((item) => item[0]?.toUpperCase() ?? "")
      .join("");
  }, [account?.full_name]);

  const renderLocaleSwitcher = () => {
    const options: Array<{ label: string; value: Locale }> = [
      { label: "VI", value: "vi" },
      { label: "EN", value: "en" }
    ];

    return (
      <div className="locale-switcher" role="group" aria-label={t("choose_language")} aria-busy={isTranslating}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={option.value === locale ? "is-active" : ""}
            aria-pressed={option.value === locale}
            title={option.value === "vi" ? t("language_vi") : t("language_en")}
            onClick={() => setLocale(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="site-shell">
      {!hideHeader ? (
        <>
          <header className="nav-header fixed top-0 z-50 w-full border-b border-stone-200 bg-white/80 backdrop-blur-md">
            <Container className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex h-20 items-center gap-4">
                <button className="text-stone-600 md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                  {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                <Link className="flex cursor-pointer items-center gap-2" to={routes.home}>
                  <div className="h-10 w-10 overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-stone-200">
                    <img
                      src="/media/img/logo.jpg"
                      alt={tText("Logo Dù lượn Đà Nẵng")}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold tracking-tight text-brand">{tText("ĐÀ NẴNG")}</h1>
                    <p className="-mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">{tText("Dù lượn")}</p>
                  </div>
                </Link>

                <nav className="ml-auto hidden items-center gap-6 md:flex">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) => `nav-header-item ${isActive ? "is-active" : ""}`}
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </nav>

                <div className="hidden shrink-0 md:block">{renderLocaleSwitcher()}</div>

                <div className="ml-4 hidden shrink-0 items-center border-l border-stone-200 pl-4 md:flex">
                  {isAuthenticated ? (
                    <div className="site-profile" ref={profileMenuRef}>
                      <button
                        type="button"
                        className={`site-avatar-button ${profileMenuOpen ? "is-open" : ""}`}
                        aria-haspopup="menu"
                        aria-expanded={profileMenuOpen}
                        onClick={() => setProfileMenuOpen((value) => !value)}
                      >
                        <span className="site-avatar">{avatarLabel}</span>
                        <span className="site-avatar-caret" aria-hidden="true" />
                      </button>

                      <div className={`site-profile-menu ${profileMenuOpen ? "is-open" : ""}`} role="menu">
                        <div className="site-profile-menu__header">
                          <strong>{account?.full_name}</strong>
                          <small>{account?.email}</small>
                        </div>
                        <Link to={routes.account} className="site-profile-menu__item" role="menuitem">
                          {t("nav_account")}
                        </Link>
                        <button
                          type="button"
                          className="site-profile-menu__item"
                          role="menuitem"
                          onClick={() => void logout()}
                        >
                          {t("nav_logout")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <Link to={routes.login}>
                      <UserRound color="#57534d" />
                    </Link>
                  )}
                </div>
              </div>
            </Container>
          </header>

          <div className={`mobile-menu-backdrop ${mobileMenuOpen ? "is-open" : ""}`} onClick={() => setMobileMenuOpen(false)} />

          <aside className={`mobile-menu ${mobileMenuOpen ? "is-open" : ""}`}>
            <div className="mobile-menu__header">
              <div className="site-brand">
                <span className="site-brand__icon overflow-hidden bg-white p-0">
                  <img
                    src="/media/img/logo.jpg"
                    alt={tText("Logo Dù lượn Đà Nẵng")}
                    className="h-full w-full object-cover"
                  />
                </span>
                <span className="site-brand__copy">
                  <strong>{tText(businessInfo.shortName)}</strong>
                  <small>{tText("Dù lượn Đà Nẵng")}</small>
                </span>
              </div>
            </div>

            <nav className="mobile-menu__nav">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="mobile-menu__link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="mobile-menu__footer">
              {renderLocaleSwitcher()}

              {isAuthenticated ? (
                <>
                  <Link to={routes.account} className="site-account-chip site-account-chip--mobile">
                    {account?.full_name ?? t("nav_account")}
                  </Link>
                  <button type="button" className="site-inline-action" onClick={() => void logout()}>
                    {t("nav_logout")}
                  </button>
                </>
              ) : (
                <Link to={routes.login}>
                  <Button variant="secondary">{t("nav_login")}</Button>
                </Link>
              )}

              <Link to={routes.services} onClick={() => setMobileMenuOpen(false)}>
                <Button>{t("quick_book")}</Button>
              </Link>
            </div>
          </aside>
        </>
      ) : null}

      <main>{children}</main>

      {!hideFooter ? (
        <footer className="mt-10 bg-stone-900 p-8 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold">{tText("Dù lượn Đà Nẵng")}</span>
                </div>
                <p className="text-sm leading-relaxed text-stone-400">
                  {tText("Trải nghiệm cảm giác tự do bay lượn trên bầu trời Đà Nẵng, ngắm nhìn vẻ đẹp của bán đảo Sơn Trà từ trên cao.")}
                </p>
              </div>

              <div>
                <h3 className="mb-6 font-bold">{tText("Liên kết")}</h3>
                <ul className="space-y-3 text-sm text-stone-400">
                  {navItems.map((item) => (
                    <NavLink key={item.to} to={item.to} style={{ display: "block" }}>
                      {item.label}
                    </NavLink>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="mb-6 font-bold">{tText("Liên hệ")}</h3>
                <ul className="space-y-3 text-sm text-stone-400">
                  <li className="flex items-center gap-2">
                    <MapPin size={16} /> {tText("Bán đảo Sơn Trà, Đà Nẵng")}
                  </li>
                  <li className="flex items-center gap-2">
                    <Phone size={16} /> +84 123 456 789
                  </li>
                  <li className="flex items-center gap-2">
                    <Mail size={16} /> info@danangparagliding.vn
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="mb-6 font-bold">{tText("Theo dõi")}</h3>
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-stone-800 transition-colors hover:bg-brand">
                    <a href="https://www.facebook.com/profile.php?id=100064087207931" aria-label="Facebook">
                      <span className="font-bold" aria-hidden="true">f</span>
                    </a>
                  </div>
                  <div className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-stone-800 transition-colors hover:bg-brand">
                    <a href={businessInfo.zaloUrl} className="flex h-full w-full items-center justify-center">
                      <img
                        src="https://conex-agency.com/images/icon_zalo9.png"
                        alt="Zalo"
                        loading="lazy"
                        decoding="async"
                        style={{ width: "50%" }}
                      />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-16 border-t border-stone-800 pt-8 text-center text-xs text-stone-500">
              Copyright © 2024 Da Nang Paragliding.
            </div>
          </div>
        </footer>
      ) : null}

      <a
        className="zalo-sticky-button"
        href={businessInfo.zaloUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={`Chat Zalo ${businessInfo.zaloPhone}`}
      >
        <span>Zalo</span>
      </a>
    </div>
  );
};
