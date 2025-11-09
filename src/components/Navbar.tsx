import { Link, useLocation, useNavigate } from "react-router-dom";
import { store } from "@/lib/store";
import { Moon, Sun, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Calendar, Users, TrendingUp } from "lucide-react";

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = store.getCurrentUser();
  
  // Don't render navbar if no user - ProtectedRoute should handle redirect
  if (!currentUser) {
    return null;
  }
  
  const clinic = currentUser ? store.getClinicById(currentUser.clinicId) : null;

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
    navigate("/login", { replace: true });
  };

  return (
    <header className="bg-card border-b border-border py-4 px-6">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-8">
        <div className="flex items-center gap-8 flex-1">
          <Link to="/" className="flex items-center gap-4 mr-auto">
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
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-11 w-11"
            >
              <Sun className="h-6 w-6 hidden theme-dark:block" />
              <Moon className="h-6 w-6 theme-dark:hidden" />
            </Button>
            <Link to="/profile">
              <Button variant="ghost" size="icon" className="h-11 w-11">
                <User className="h-6 w-6" />
              </Button>
            </Link>
          </div>
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
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

      </div>
    </header>
  );
}
