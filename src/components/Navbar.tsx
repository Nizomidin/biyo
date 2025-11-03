import { Link, useLocation } from "react-router-dom";
import { Calendar, Users, TrendingUp, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

export function Navbar() {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Расписание", icon: Calendar },
    { path: "/patients", label: "Пациенты", icon: Users },
    { path: "/analytics", label: "Аналитика", icon: TrendingUp },
  ];

  const isActive = (path: string) => location.pathname === path;

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

        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск пациентов..."
            className="pl-10 bg-secondary border-0"
          />
        </div>
      </div>
    </header>
  );
}
