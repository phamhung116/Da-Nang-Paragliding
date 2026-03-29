import type { PropsWithChildren } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Button, Container } from "@paragliding/ui";
import { useAuth } from "@/app/providers/auth-provider";
import { useI18n } from "@/app/providers/i18n-provider";
import { businessInfo } from "@/shared/constants/business";
import { routes } from "@/shared/config/routes";

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
    { to: routes.tracking, label: t("nav_tracking") },
    { to: routes.about, label: t("nav_about") }
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
      return "SN";
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
          <header className="site-header">
            <Container className="site-header__inner">
              <div className="site-header__main">
                <button
                  type="button"
                  aria-label="Open navigation menu"
                  className="site-burger"
                  onClick={() => setMobileMenuOpen(true)}
                >
                  Menu
                </button>

                <Link className="site-brand" to={routes.home}>
                  <span className="site-brand__icon">SN</span>
                  <span className="site-brand__copy">
                    <strong>{businessInfo.shortName}</strong>
                    <small>Da Nang Paragliding</small>
                  </span>
                </Link>

                <nav className="site-nav site-nav--desktop">
                  {navItems.map((item) => (
                    <NavLink key={item.to} to={item.to} className="site-nav__link">
                      {item.label}
                    </NavLink>
                  ))}
                </nav>
              </div>

              <div className="site-tools">
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
                    <Button variant="secondary">{t("nav_login")}</Button>
                  </Link>
                )}

                <div className="site-cta">
                  <Link to={routes.services}>
                    <Button>{t("quick_book")}</Button>
                  </Link>
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
                <span className="site-brand__icon">SN</span>
                <span className="site-brand__copy">
                  <strong>{businessInfo.shortName}</strong>
                  <small>Da Nang Paragliding</small>
                </span>
              </div>
              <button
                type="button"
                aria-label="Close navigation menu"
                className="site-burger is-close"
                onClick={() => setMobileMenuOpen(false)}
              >
                Close
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
        <footer className="site-footer">
          <Container className="site-footer__grid">
            <div className="stack-sm">
              <strong className="site-footer__title">{businessInfo.name}</strong>
              <p>{businessInfo.intro}</p>
              <p>Support hours: {businessInfo.supportHours}</p>
            </div>
            <div className="stack-sm">
              <strong className="site-footer__title">Lien he</strong>
              <p>{businessInfo.phone}</p>
              <p>{businessInfo.email}</p>
              <p>{businessInfo.address}</p>
            </div>
          </Container>
        </footer>
      ) : null}
    </div>
  );
};
