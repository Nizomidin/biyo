import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { OnboardingTour } from "./components/OnboardingTour";
import Schedule from "./pages/Schedule";
import Patients from "./pages/Patients";
import Analytics from "./pages/Analytics";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import MigrateData from "./pages/MigrateData";
import Landing from "./pages/Landing";
import { store, User } from "./lib/store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const queryClient = new QueryClient();

// Note: updatePatientBalances() will be called after login
// It's now handled in the ProtectedRoute components when user is authenticated

// Helper function to detect mobile/tablet
const isMobileOrTablet = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check user agent
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
  
  // Check screen width (tablets are usually < 1024px)
  const isSmallScreen = window.innerWidth < 1024;
  
  // Check touch capability
  const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  return isMobileUA || (isSmallScreen && hasTouchScreen);
};

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!store.getCurrentUser());
  const [isReady, setIsReady] = useState(false);
  const [showMobileWarning, setShowMobileWarning] = useState(false);

  useEffect(() => {
    const evaluateAuth = async () => {
      try {
        const user = store.getCurrentUser();
        const hasUser = !!user;
        setIsAuthenticated(hasUser);
        setIsReady(true);

        if (hasUser) {
          await store.updatePatientBalances().catch((err) => console.error("Balance update failed:", err));
          
          // Check if mobile/tablet warning should be shown
          const warningShown = sessionStorage.getItem('mobile-warning-shown');
          if (!warningShown && isMobileOrTablet()) {
            setShowMobileWarning(true);
            sessionStorage.setItem('mobile-warning-shown', 'true');
          }
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        setIsAuthenticated(false);
        setIsReady(true);
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "biyo_current_user" || event.key === null) {
        void evaluateAuth();
      }
    };

    const handleAuthChanged = (_event: Event) => {
      void evaluateAuth();
    };

    void evaluateAuth();
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("biyo-auth-changed", handleAuthChanged);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("biyo-auth-changed", handleAuthChanged);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const runSync = () => {
      store.syncFromAPI().catch((err) => console.error("Sync failed:", err));
    };

    const interval = setInterval(runSync, 10000);
    // Perform an eager sync when authentication state flips to true
    runSync();

    return () => {
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  // Show loading state briefly while checking
  if (!isReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Загрузка...</p>
          <p className="text-sm text-muted-foreground mt-2">Пожалуйста, подождите</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      {children}
      <OnboardingTour />
      <Dialog open={showMobileWarning} onOpenChange={setShowMobileWarning}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">
              Платформа не оптимизирована для мобильных устройств
            </DialogTitle>
            <DialogDescription className="text-center pt-4 text-base">
              Пожалуйста, используйте ноутбук или компьютер для лучшего опыта работы с платформой.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-4">
            <Button onClick={() => setShowMobileWarning(false)} className="w-full sm:w-auto">
              Понятно
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

const App = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => store.getCurrentUser());

  useEffect(() => {
    const handleAuthChanged = () => {
      setCurrentUser(store.getCurrentUser());
    };

    window.addEventListener("biyo-auth-changed", handleAuthChanged);
    return () => {
      window.removeEventListener("biyo-auth-changed", handleAuthChanged);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route
              path="/login"
              element={
                currentUser ? <Navigate to="/" replace /> : <Login />
              }
            />
            <Route
              path="/signup"
              element={
                currentUser ? <Navigate to="/" replace /> : <SignUp />
              }
            />
            <Route
              path="/"
              element={
                currentUser ? (
                  <ProtectedRoute>
                    <div className="min-h-screen bg-background">
                      <Navbar />
                      <Schedule />
                    </div>
                  </ProtectedRoute>
                ) : (
                  <Landing />
                )
              }
            />
            <Route
              path="/patients"
              element={
                <ProtectedRoute>
                  <div className="min-h-screen bg-background">
                    <Navbar />
                    <Patients />
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <div className="min-h-screen bg-background">
                    <Navbar />
                    <Analytics />
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <div className="min-h-screen bg-background">
                    <Navbar />
                    <Profile />
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/migrate"
              element={
                <ProtectedRoute>
                  <div className="min-h-screen bg-background">
                    <Navbar />
                    <MigrateData />
                  </div>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
