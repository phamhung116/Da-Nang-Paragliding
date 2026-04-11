import type { PropsWithChildren } from "react";
import { NavLink } from "react-router-dom";
import { Badge, Button, Container } from "@paragliding/ui";
import { useAdminAuth } from "@/shared/providers/auth-provider";
import { routes } from "@/shared/config/routes";

const navItems = [
  { to: routes.bookings, label: "Bookings" },
  { to: routes.accounts, label: "Accounts" },
  { to: routes.posts, label: "Posts" }
];

export const AdminLayout = ({ children }: PropsWithChildren) => {
  const { account, logout } = useAdminAuth();
  const initials = (account?.full_name ?? "Admin")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase())
    .join("");

  return (
    <div className="portal-shell portal-shell--admin">
      <aside className="portal-sidebar">
        <div className="portal-sidebar__brandmark">
          <span className="portal-sidebar__icon">DP</span>
          <div className="portal-sidebar__brand">
            <span>Da Nang Paragliding</span>
            <small>Admin workspace</small>
          </div>
        </div>

        <div className="portal-sidebar__meta">
          <Badge>ADMIN</Badge>
          <p>Review bookings, assign available pilots and manage publishing from one workspace.</p>
        </div>

        <nav className="portal-sidebar__nav">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className="portal-sidebar__link">
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="portal-main">
        <header className="portal-topbar">
          <Container className="portal-topbar__inner">
            <div>
              <strong>Da Nang Paragliding Control Room</strong>
              <p>Bookings are approval records. Flight progress is updated from the pilot workspace.</p>
            </div>
            <div className="admin-topbar-actions">
              <div className="portal-topbar__profile">
                <span className="portal-user-avatar">{initials}</span>
                <div className="portal-user-meta">
                  <strong>{account?.full_name}</strong>
                  <small>{account?.email}</small>
                </div>
              </div>
              <Button variant="ghost" onClick={() => void logout()}>
                Sign out
              </Button>
            </div>
          </Container>
        </header>
        <Container className="portal-content">{children}</Container>
      </div>
    </div>
  );
};
