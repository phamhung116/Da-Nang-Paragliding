import { Navigate, Route, Routes } from "react-router-dom";
import { usePilotAuth } from "@/app/providers/auth-provider";
import { FlightsPage } from "@/pages/flights";
import { LoginPage } from "@/pages/login";
import { PostDetailPage } from "@/pages/post-detail";
import { PostsPage } from "@/pages/posts";
import { routes } from "@/shared/config/routes";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, loading } = usePilotAuth();

  if (loading) {
    return null;
  }

  return isAuthenticated ? children : <Navigate to={routes.login} replace />;
};

export const AppRouter = () => (
  <Routes>
    <Route path={routes.login} element={<LoginPage />} />
    <Route
      path={routes.home}
      element={
        <ProtectedRoute>
          <FlightsPage />
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
      path="/posts/:slug"
      element={
        <ProtectedRoute>
          <PostDetailPage />
        </ProtectedRoute>
      }
    />
    <Route path="*" element={<Navigate to={routes.login} replace />} />
  </Routes>
);
