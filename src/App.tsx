import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import LegalPopup from "./components/LegalPopup";
import Home from "./pages/Home";
import PriceList from "./pages/PriceList";
import QuickPurchase from "./pages/QuickPurchase";
import Contact from "./pages/Contact";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import GitHubTestPage from "./pages/GitHubTestPage";
import NotFound from "./pages/NotFound";
import ScrollToTopButton from "./components/ScrollToTopButton";
import { useScrollToTop } from "./hooks/use-scroll-to-top";
import { aggressivePreloader } from "./utils/aggressive-preloader";

const queryClient = new QueryClient();

// Main App component with scroll to top functionality
const AppContent = () => {
  useScrollToTop(); // This will scroll to top on every route change

  // Preload critical images immediately when app starts
  React.useEffect(() => {
    aggressivePreloader.preloadCriticalImages();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/price-list" element={<PriceList />} />
          <Route path="/quick-purchase" element={<QuickPurchase />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/github-test" element={<GitHubTestPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <LegalPopup />
      <ScrollToTopButton />
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
