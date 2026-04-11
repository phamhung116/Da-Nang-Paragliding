import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

const AboutPage = lazy(() => import("@/pages/about").then((module) => ({ default: module.AboutPage })));
const AccountPage = lazy(() => import("@/pages/account").then((module) => ({ default: module.AccountPage })));
const AccountBookingDetailPage = lazy(() =>
  import("@/pages/account/booking-detail").then((module) => ({ default: module.AccountBookingDetailPage }))
);
const BookingPage = lazy(() => import("@/pages/booking").then((module) => ({ default: module.BookingPage })));
const CheckoutPage = lazy(() => import("@/pages/checkout").then((module) => ({ default: module.CheckoutPage })));
const ContactPage = lazy(() => import("@/pages/contact").then((module) => ({ default: module.ContactPage })));
const HomePage = lazy(() => import("@/pages/home").then((module) => ({ default: module.HomePage })));
const LoginPage = lazy(() => import("@/pages/login").then((module) => ({ default: module.LoginPage })));
const PostDetailPage = lazy(() => import("@/pages/post-detail").then((module) => ({ default: module.PostDetailPage })));
const PostsPage = lazy(() => import("@/pages/posts").then((module) => ({ default: module.PostsPage })));
const ServiceDetailPage = lazy(() => import("@/pages/service-detail").then((module) => ({ default: module.ServiceDetailPage })));
const ServicesPage = lazy(() => import("@/pages/services").then((module) => ({ default: module.ServicesPage })));
const TrackingPage = lazy(() => import("@/pages/tracking").then((module) => ({ default: module.TrackingPage })));
const VerifyEmailPage = lazy(() => import("@/pages/verify-email").then((module) => ({ default: module.VerifyEmailPage })));

const page = (element: JSX.Element) => <Suspense fallback={null}>{element}</Suspense>;

export const AppRouter = () => (
  <Routes>
    <Route path="/" element={page(<HomePage />)} />
    <Route path="/about" element={page(<AboutPage />)} />
    <Route path="/contact" element={page(<ContactPage />)} />
    <Route path="/login" element={page(<LoginPage />)} />
    <Route path="/verify-email" element={page(<VerifyEmailPage />)} />
    <Route path="/account" element={page(<AccountPage />)} />
    <Route path="/account/bookings/:code" element={page(<AccountBookingDetailPage />)} />
    <Route path="/posts" element={page(<PostsPage />)} />
    <Route path="/posts/:slug" element={page(<PostDetailPage />)} />
    <Route path="/services" element={page(<ServicesPage />)} />
    <Route path="/services/:slug" element={page(<ServiceDetailPage />)} />
    <Route path="/booking" element={page(<BookingPage />)} />
    <Route path="/checkout" element={page(<CheckoutPage />)} />
    <Route path="/tracking" element={page(<TrackingPage />)} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);
