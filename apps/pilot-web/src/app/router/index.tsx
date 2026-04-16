import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { usePilotAuth } from "@/app/providers/auth-provider";
import { routes } from "@/shared/config/routes";

const PilotAccountPage = lazy(() => import("@/pages/account").then((module) => ({ default: module.PilotAccountPage })));
const FlightsPage = lazy(() => import("@/pages/flights").then((module) => ({ default: module.FlightsPage })));
const LoginPage = lazy(() => import("@/pages/login").then((module) => ({ default: module.LoginPage })));
const PostDetailPage = lazy(() => import("@/pages/post-detail").then((module) => ({ default: module.PostDetailPage })));
const PostsPage = lazy(() => import("@/pages/posts").then((module) => ({ default: module.PostsPage })));

const page = (element: JSX.Element) => <Suspense fallback={null}>{element}</Suspense>;

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, loading } = usePilotAuth();

  if (loading) {
    return null;
  }

  return isAuthenticated ? children : <Navigate to={routes.login} replace />;
};

export const AppRouter = () => (
  <Routes>
    <Route path={routes.login} element={page(<LoginPage />)} />
    <Route
      path={routes.home}
      element={
        <ProtectedRoute>
          {page(<FlightsPage />)}
        </ProtectedRoute>
      }
    />
    <Route
      path={routes.account}
      element={
        <ProtectedRoute>
          {page(<PilotAccountPage />)}
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
