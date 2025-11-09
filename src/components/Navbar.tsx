import { Link, useLocation, useNavigate } from "react-router-dom";
import { store } from "@/lib/store";
import { LogOut, User } from "lucide-react";
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

  const handleLogout = () => {
    store.logout();
    toast.success("Выход выполнен");
    navigate("/login", { replace: true });
  };

  return (
    <header className="bg-card border-b border-border py-4 px-6">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/ser.png"
              alt="Biyo Dash"
              className="h-10 w-10 rounded-full border border-border object-cover"
            />
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-none">Biyo Dash</span>
              {clinic && (
                <span className="text-xs text-muted-foreground leading-none">
                  {clinic.name}
                </span>
              )}
            </div>
          </Link>
          <Link to="/profile">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <User className="h-5 w-5" />
            </Button>
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
