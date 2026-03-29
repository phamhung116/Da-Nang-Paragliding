import { Navigate, Route, Routes } from "react-router-dom";
import { AboutPage } from "@/pages/about";
import { AccountPage } from "@/pages/account";
import { BookingPage } from "@/pages/booking";
import { CheckoutPage } from "@/pages/checkout";
import { HomePage } from "@/pages/home";
import { LoginPage } from "@/pages/login";
import { PostDetailPage } from "@/pages/post-detail";
import { PostsPage } from "@/pages/posts";
import { ServiceDetailPage } from "@/pages/service-detail";
import { ServicesPage } from "@/pages/services";
import { TrackingPage } from "@/pages/tracking";

export const AppRouter = () => (
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/about" element={<AboutPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<LoginPage />} />
    <Route path="/account" element={<AccountPage />} />
    <Route path="/posts" element={<PostsPage />} />
    <Route path="/posts/:slug" element={<PostDetailPage />} />
    <Route path="/services" element={<ServicesPage />} />
    <Route path="/services/:slug" element={<ServiceDetailPage />} />
    <Route path="/booking" element={<BookingPage />} />
    <Route path="/checkout" element={<CheckoutPage />} />
    <Route path="/tracking" element={<TrackingPage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);
