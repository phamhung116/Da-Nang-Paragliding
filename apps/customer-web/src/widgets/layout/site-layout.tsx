import type { PropsWithChildren } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Button, Container } from "@paragliding/ui";
import { useAuth } from "@/shared/providers/auth-provider";
import { useI18n } from "@/shared/providers/i18n-provider";
import { businessInfo } from "@/shared/constants/business";
import { routes } from "@/shared/config/routes";
import { motion } from 'motion/react';

import {
  FaFacebook,
  FaPhone,
  FaLocationDot,
  FaEnvelope,
} from "react-icons/fa6";

import { 
  Wind, 
  UserRound,
  Menu, 
  X, 
} from 'lucide-react';

export const Banner = ({ title, subtitle, image }: { title: string, subtitle?: string, image: string }) => {
  return (
    <section className="relative h-[40vh] md:h-[50vh] flex items-center overflow-hidden mb-12 md:mb-20">
      <div className="absolute inset-0 z-0">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/20" />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-white">
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl md:text-7xl font-black mb-4 tracking-tighter uppercase">
            {title}
          </h1>
          {subtitle && (
            <p className="text-lg md:text-xl text-stone-300 max-w-2xl font-medium leading-relaxed">
              {subtitle}
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
}

type SiteLayoutProps = PropsWithChildren<{
  hideHeader?: boolean;
  hideFooter?: boolean;
}>;

export const SiteLayout = ({ children, hideHeader = false, hideFooter = false }: SiteLayoutProps) => {
  const { account, isAuthenticated, logout } = useAuth();
  const { locale, setLocale, t } = useI18n();
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
    { to: routes.about, label: t("nav_about") },
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

  return (
    <div className="site-shell">
      {!hideHeader ? (
        <>
          <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-stone-200 nav-header">
            <Container className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex h-20 items-center gap-4">
                <button className="md:hidden text-stone-600"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                <Link className="flex items-center gap-2 cursor-pointer" to={routes.home}>
                  <div className="w-10 h-10 bg-brand rounded-lg flex items-center justify-center text-white">
                    <Wind size={24} />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold tracking-tight text-brand">ĐÀ NẴNG</h1>
                    <p className="text-[10px] font-bold tracking-[0.2em] text-stone-500 uppercase -mt-1">Paragliding</p>
                  </div>
                </Link>

                <nav className="hidden md:flex items-center gap-6 ml-auto">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `nav-header-item ${isActive ? "is-active" : ""}`
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </nav>

                <div className="flex shrink-0 items-center gap-2 ml-4 border-l border-stone-200 pl-4">
                  <button
                    type="button"
                    className={`transition-opacity ${locale === 'vi' ? 'opacity-100': 'opacity-40 hover:opacity-100'}`}
                    onClick={() => setLocale("vi")}
                  >
                    <img src="https://flagcdn.com/w40/vn.png" alt="VN" className="w-6 h-4 object-cover rounded-sm shadow-sm" />
                  </button>
                  <button
                    type="button"
                    className={`transition-opacity ${locale === 'en' ? 'opacity-100': 'opacity-40 hover:opacity-100'}`}
                    onClick={() => setLocale("en")}
                  >
                    <img src="https://flagcdn.com/w40/gb.png" alt="UK" className="w-6 h-4 object-cover rounded-sm shadow-sm" />
                  </button>

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
                      <UserRound color="#57534d"></UserRound>
                    </Link>
                  )}
                </div>
              </div>
            </Container>
          </header>

          <div
            className={`mobile-menu-backdrop ${mobileMenuOpen ? "is-open" : ""}`}
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className={`mobile-menu ${mobileMenuOpen ? "is-open" : ""}`}>
            <div className="mobile-menu__header">
              <div className="site-brand">
                <span className="site-brand__icon">DP</span>
                <span className="site-brand__copy">
                  <strong>{businessInfo.shortName}</strong>
                  <small>Đà Nẵng Paragliding</small>
                </span>
              </div>
              <button
                type="button"
                aria-label="Close navigation menu"
                className="site-burger is-close"
                onClick={() => setMobileMenuOpen(false)}
              >
                Đóng
              </button>
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
              <div className="locale-switcher">
                <button
                  type="button"
                  className={locale === "vi" ? "is-active" : ""}
                  onClick={() => setLocale("vi")}
                >
                  VI
                </button>
                <button
                  type="button"
                  className={locale === "en" ? "is-active" : ""}
                  onClick={() => setLocale("en")}
                >
                  EN
                </button>
              </div>

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
        <footer className="bg-stone-900 text-white p-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold">Da Nang Paragliding</span>
                </div>
                <p className="text-stone-400 text-sm leading-relaxed">
                  Trải nghiệm cảm giác tự do bay lượn trên bầu trời Đà Nẵng, ngắm nhìn vẻ đẹp của bán đảo Sơn Trà từ trên cao.
                </p>
              </div>
              <div>
                <h3 className="font-bold mb-6">Liên kết</h3>
                <ul className="space-y-3 text-stone-400 text-sm">
                  {navItems.map((item) => (
                    <NavLink key={item.to} to={item.to} style={{display: "block"}}>
                      {item.label}
                    </NavLink>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-bold mb-6">Liên hệ</h3>
                <ul className="space-y-3 text-stone-400 text-sm">
                  <li className="flex items-center gap-2"><FaLocationDot size={16} /> Bán đảo Sơn Trà, Đà Nẵng</li>
                  <li className="flex items-center gap-2"><FaPhone size={16} /> +84 123 456 789</li>
                  <li className="flex items-center gap-2"><FaEnvelope size={16} /> info@danangparagliding.vn</li>
              </ul>
              </div>
              <div>
                <h3 className="font-bold mb-6">Theo dõi</h3>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center hover:bg-brand transition-colors cursor-pointer"><a href="https://www.facebook.com/profile.php?id=100064087207931"><FaFacebook /></a></div>
                  <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center hover:bg-brand transition-colors cursor-pointer"><a href="https://zalo.me/0935101188" className="flex items-center justify-center w-full h-full"><img src="https://conex-agency.com/images/icon_zalo9.png" alt="" style={{width: "50%"}}/></a></div>
                </div>
              </div>
            </div>
            <div className="border-t border-stone-800 mt-16 pt-8 text-center text-stone-500 text-xs">
              © 2024 Da Nang Paragliding. All rights reserved.
            </div>
          </div>
        </footer>
      ) : null}
    </div>
  );
};
