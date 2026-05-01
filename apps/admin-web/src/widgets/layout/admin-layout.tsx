import type { PropsWithChildren } from "react";
import { NavLink } from "react-router-dom";
import { Badge, Button, Container } from "@paragliding/ui";
import { useAdminAuth } from "@/shared/providers/auth-provider";
import { routes } from "@/shared/config/routes";

const navItems = [
  { to: routes.bookings, label: "Đặt lịch" },
  { to: routes.services, label: "Dịch vụ" },
  { to: routes.accounts, label: "Tài khoản" },
  { to: routes.posts, label: "Bài viết" }
];

export const AdminLayout = ({ children }: PropsWithChildren) => {
  const { account, logout } = useAdminAuth();
  const initials = (account?.full_name ?? "Quản trị")
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
            <span>Dù lượn Đà Nẵng</span>
            <small>Khu vực quản trị</small>
          </div>
        </div>

        <div className="portal-sidebar__meta">
          <Badge>Quản trị</Badge>
          <p>Duyệt lịch đặt, phân công phi công khả dụng và quản lý nội dung xuất bản trong một khu vực.</p>
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
              <strong>Phòng điều phối Dù lượn Đà Nẵng</strong>
              <p>Lịch đặt là hồ sơ cần duyệt. Tiến độ chuyến bay được cập nhật từ khu vực phi công.</p>
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
                Đăng xuất
              </Button>
            </div>
          </Container>
        </header>
        <Container className="portal-content">{children}</Container>
      </div>
    </div>
  );
};
