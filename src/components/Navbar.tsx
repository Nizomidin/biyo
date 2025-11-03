import { Link, useLocation, useNavigate } from "react-router-dom";
import { store } from "@/lib/store";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Calendar, Users, TrendingUp, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = store.getCurrentUser();
  const clinic = currentUser ? store.getClinicById(currentUser.clinicId) : null;

  const navItems = [
    { path: "/", label: "Расписание", icon: Calendar },
    { path: "/patients", label: "Пациенты", icon: Users },
    { path: "/analytics", label: "Аналитика", icon: TrendingUp },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    store.logout();
    toast.success("Выход выполнен");
    navigate("/login");
  };

  return (
    <header className="bg-card border-b border-border py-4 px-6">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-8">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 bg-primary">
              <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                БИ
              </AvatarFallback>
            </Avatar>
            <span className="text-xl font-semibold">Biyo</span>
            {clinic && (
              <span className="text-sm text-muted-foreground">• {clinic.name}</span>
            )}
          </div>

          <nav className="flex items-center gap-2">
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

        <div className="flex items-center gap-4">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск пациентов..."
              className="pl-10 bg-secondary border-0"
            />
          </div>
          {currentUser && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{currentUser.email}</span>
              {currentUser.role === "admin" && (
                <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded">
                  Admin
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
