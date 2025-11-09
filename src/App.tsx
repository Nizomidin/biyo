import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import Schedule from "./pages/Schedule";
import Patients from "./pages/Patients";
import Analytics from "./pages/Analytics";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import MigrateData from "./pages/MigrateData";
import Landing from "./pages/Landing";
import { store } from "./lib/store";

const queryClient = new QueryClient();

// Note: updatePatientBalances() will be called after login
// It's now handled in the ProtectedRoute components when user is authenticated

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const user = store.getCurrentUser();
        const hasUser = !!user;
        setIsAuthenticated(hasUser);
        
        // Update patient balances when user is authenticated
        if (hasUser) {
          store.updatePatientBalances().catch(err => console.error('Balance update failed:', err));
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setIsAuthenticated(false);
      }
    };
    
    // Check immediately
    checkAuth();
    
    // Check auth state more frequently to catch logout events quickly
    const interval = setInterval(checkAuth, 50);
    
    // Sync from API every 5 seconds if API sync is enabled
    // Delay first sync to avoid initialization issues
    const syncInterval = setInterval(() => {
      try {
        const user = store.getCurrentUser();
        if (user) {
          store.syncFromAPI().catch(err => console.error('Sync failed:', err));
        }
      } catch (error) {
        console.error('Error in sync interval:', error);
      }
    }, 5000);
    
    // Initial sync after a delay to avoid initialization race conditions
    setTimeout(() => {
      try {
        const user = store.getCurrentUser();
        if (user) {
          store.syncFromAPI().catch(err => console.error('Initial sync failed:', err));
        }
      } catch (error) {
        console.error('Error in initial sync:', error);
      }
    }, 1000);
    
    return () => {
      clearInterval(interval);
      clearInterval(syncInterval);
    };
  }, []);

  // Show loading state briefly while checking
  if (isAuthenticated === null) {
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
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App = () => {
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
                store.getCurrentUser() ? <Navigate to="/" replace /> : <Login />
              }
            />
            <Route
              path="/signup"
              element={
                store.getCurrentUser() ? <Navigate to="/" replace /> : <SignUp />
              }
            />
            <Route
              path="/"
              element={
                store.getCurrentUser() ? (
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
