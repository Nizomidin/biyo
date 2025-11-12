import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { store } from "@/lib/store";
import { Moon, Sun, User, Phone, Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Calendar, Users, TrendingUp } from "lucide-react";
import { parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = store.getCurrentUser();
  
  // Don't render navbar if no user - ProtectedRoute should handle redirect
  if (!currentUser) {
    return null;
  }
  
  const clinic = currentUser ? store.getClinicById(currentUser.clinicId) : null;
  const subscription = store.getSubscription();
  const [contactModalOpen, setContactModalOpen] = useState(false);
  
  // Calculate trial days remaining
  const trialDaysRemaining = subscription?.isTrial && subscription?.trialEndDate
    ? (() => {
        try {
          const trialEnd = parseISO(subscription.trialEndDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          trialEnd.setHours(0, 0, 0, 0);
          const days = Math.ceil((trialEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return days > 0 ? days : 0;
        } catch (e) {
          console.error('Error calculating trial days:', e);
          return null;
        }
      })()
    : null;

  // Debug: Log subscription info (remove in production)
  useEffect(() => {
    if (subscription) {
      console.log('Subscription:', subscription);
      console.log('Trial days remaining:', trialDaysRemaining);
    }
  }, [subscription, trialDaysRemaining]);

  // All users should see all tabs - no role restrictions
  const navItems = [
    { path: "/", label: "Расписание", icon: Calendar },
    { path: "/patients", label: "Пациенты", icon: Users },
    { path: "/analytics", label: "Аналитика", icon: TrendingUp },
  ].filter(Boolean); // Ensure no undefined items

  const isActive = (path: string) => location.pathname === path;

  const toggleTheme = () => {
    const isDark = document.body.classList.toggle("theme-dark");
    if (isDark) {
      localStorage.setItem("biyo-theme", "dark");
      document.body.style.backgroundColor = "#111827";
    } else {
      localStorage.setItem("biyo-theme", "light");
      document.body.style.backgroundColor = "#ffffff";
    }
  };

  const handleLogout = () => {
    store.logout();
    toast.success("Выход выполнен");
    navigate("/", { replace: true });
  };

  return (
    <>
      <header className="bg-card border-b border-border py-4 px-6 relative">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-8">
          <div className="flex items-center gap-8 flex-1">
            <Link to="/" className="flex items-center gap-4">
              <span className="text-2xl font-semibold tracking-wide text-primary">
                Serkor
              </span>
              <img
                src="/ser.png"
                alt="Serkor logo"
                className="h-14 w-14 rounded-full border border-border object-cover"
              />
              <div className="flex flex-col">
                <span className="text-base font-semibold leading-none">
                  {clinic?.name || "Ваша клиника"}
                </span>
                <span className="text-xs text-muted-foreground leading-none">
                  Клиника
                </span>
              </div>
            </Link>
          </div>

          <nav className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
                data-tour={item.path === "/analytics" ? "analytics-tab" : undefined}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3 ml-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-11 w-11"
            >
              <Sun className="h-6 w-6 hidden theme-dark:block" />
              <Moon className="h-6 w-6 theme-dark:hidden" />
            </Button>
            <Link to="/profile" id="profile-button-container">
              <Button variant="ghost" size="icon" className="h-11 w-11">
                <User className="h-6 w-6" />
              </Button>
            </Link>
            {subscription?.isTrial && (
              <div className="flex items-center gap-2">
                {trialDaysRemaining !== null && trialDaysRemaining > 0 && (
                  <Badge className="bg-blue-600 text-white px-3 py-1.5 text-sm font-medium whitespace-nowrap">
                    {trialDaysRemaining} {trialDaysRemaining === 1 ? 'день' : trialDaysRemaining < 5 ? 'дня' : 'дней'} осталось
                  </Badge>
                )}
                <Button 
                  onClick={() => setContactModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-6 px-2 whitespace-nowrap"
                  size="sm"
                >
                  Связаться с нами
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Contact Modal */}
      <Dialog open={contactModalOpen} onOpenChange={setContactModalOpen}>
        <DialogContent className="bg-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-slate-900">
              Мы ответим на любой вопрос и поможем настроить
            </DialogTitle>
            <DialogDescription className="text-base text-slate-600">
              Выберите удобный способ связи
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <a
              href="tel:927474090"
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 transition hover:bg-slate-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-slate-900">Позвонить</div>
                <div className="text-sm text-slate-600">927474090</div>
              </div>
            </a>
            <a
              href="https://t.me/mankimtukim"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 transition hover:bg-slate-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-slate-900">Телеграм</div>
                <div className="text-sm text-slate-600">@mankimtukim</div>
              </div>
            </a>
            <a
              href="https://wa.me/992929898800"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 transition hover:bg-slate-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-slate-900">WhatsApp</div>
                <div className="text-sm text-slate-600">+992929898800</div>
              </div>
            </a>
            <a
              href="https://instagram.com/over7inker"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 transition hover:bg-slate-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white">
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-slate-900">Instagram</div>
                <div className="text-sm text-slate-600">@over7inker</div>
              </div>
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
