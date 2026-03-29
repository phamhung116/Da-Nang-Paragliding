import { Navigate, Route, Routes } from "react-router-dom";
import { useAdminAuth } from "@/app/providers/auth-provider";
import { AccountsPage } from "@/pages/accounts";
import { BookingRequestsPage } from "@/pages/booking-requests";
import { BookingsPage } from "@/pages/bookings";
import { LoginPage } from "@/pages/login";
import { PostsPage } from "@/pages/posts";
import { ServiceDetailPage } from "@/pages/service-detail";
import { ServicesPage } from "@/pages/services";
import { routes } from "@/shared/config/routes";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, loading } = useAdminAuth();
  if (loading) {
    return null;
  }
  return isAuthenticated ? children : <Navigate to={routes.login} replace />;
};

export const AppRouter = () => (
  <Routes>
    <Route path={routes.login} element={<LoginPage />} />
    <Route
      path="/"
      element={
        <ProtectedRoute>
          <Navigate to={routes.bookingRequests} replace />
        </ProtectedRoute>
      }
    />
    <Route
      path={routes.bookingRequests}
      element={
        <ProtectedRoute>
          <BookingRequestsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path={routes.bookings}
      element={
        <ProtectedRoute>
          <BookingsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path={routes.accounts}
      element={
        <ProtectedRoute>
          <AccountsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path={routes.posts}
      element={
        <ProtectedRoute>
          <PostsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path={routes.services}
      element={
        <ProtectedRoute>
          <ServicesPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/services/:slug"
      element={
        <ProtectedRoute>
          <ServiceDetailPage />
        </ProtectedRoute>
      }
    />
    <Route path="*" element={<Navigate to={routes.login} replace />} />
  </Routes>
);
