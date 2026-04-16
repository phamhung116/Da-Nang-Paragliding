import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAdminAuth } from "@/app/providers/auth-provider";
import { routes } from "@/shared/config/routes";

const AccountDetailPage = lazy(() => import("@/pages/accounts/detail").then((module) => ({ default: module.AccountDetailPage })));
const AccountsPage = lazy(() => import("@/pages/accounts").then((module) => ({ default: module.AccountsPage })));
const BookingDetailPage = lazy(() => import("@/pages/bookings/detail").then((module) => ({ default: module.BookingDetailPage })));
const BookingsPage = lazy(() => import("@/pages/bookings").then((module) => ({ default: module.BookingsPage })));
const LoginPage = lazy(() => import("@/pages/login").then((module) => ({ default: module.LoginPage })));
const PostDetailPage = lazy(() => import("@/pages/posts/detail").then((module) => ({ default: module.PostDetailPage })));
const PostsPage = lazy(() => import("@/pages/posts").then((module) => ({ default: module.PostsPage })));

const page = (element: JSX.Element) => <Suspense fallback={null}>{element}</Suspense>;

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, loading } = useAdminAuth();
  if (loading) {
    return null;
  }
  return isAuthenticated ? children : <Navigate to={routes.login} replace />;
};

export const AppRouter = () => (
  <Routes>
    <Route path={routes.login} element={page(<LoginPage />)} />
    <Route
      path="/"
      element={
        <ProtectedRoute>
          <Navigate to={routes.bookings} replace />
        </ProtectedRoute>
      }
    />
    <Route
      path={routes.bookings}
      element={
        <ProtectedRoute>
          {page(<BookingsPage />)}
        </ProtectedRoute>
      }
    />
    <Route
      path={routes.bookingDetail}
      element={
        <ProtectedRoute>
          {page(<BookingDetailPage />)}
        </ProtectedRoute>
      }
    />
    <Route
      path={routes.accounts}
      element={
        <ProtectedRoute>
          {page(<AccountsPage />)}
        </ProtectedRoute>
      }
    />
    <Route
      path={routes.accountDetail}
      element={
        <ProtectedRoute>
          {page(<AccountDetailPage />)}
        </ProtectedRoute>
      }
    />
    <Route
      path={routes.posts}
      element={
        <ProtectedRoute>
          {page(<PostsPage />)}
        </ProtectedRoute>
      }
    />
    <Route
      path="/posts/:slug"
      element={
        <ProtectedRoute>
          {page(<PostDetailPage />)}
        </ProtectedRoute>
      }
    />
    <Route path="*" element={<Navigate to={routes.login} replace />} />
  </Routes>
);
