import { useMemo, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { parseISO, differenceInCalendarDays } from "date-fns";
import {
  Calendar,
  Download,
  LogOut,
  Menu,
  Moon,
  Phone,
  Send,
  Sun,
  TrendingUp,
  Users,
  MessageCircle,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { store } from "@/lib/store";
import { isWeb } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
  const { isDark, toggleTheme } = useTheme();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);

  // Don't render navbar if no user - ProtectedRoute should handle redirect
  if (!currentUser) {
    return null;
  }
  
  const clinic = currentUser ? store.getClinicById(currentUser.clinicId) : null;
  const subscription = store.getSubscription(currentUser.clinicId);
  const trialDaysRemaining = useMemo(() => {
    if (!subscription?.isTrial || !subscription.trialEndDate) {
      return null;
    }
    try {
      const trialEnd = parseISO(subscription.trialEndDate);
      const today = new Date();
      return Math.max(differenceInCalendarDays(trialEnd, today), 0);
    } catch (error) {
      console.warn("Failed to parse trial end date", error);
      return null;
    }
  }, [subscription?.isTrial, subscription?.trialEndDate]);

  // All users should see all tabs - no role restrictions
  const navItems = useMemo(
    () =>
      [
        { path: "/", label: "Расписание", icon: Calendar },
        { path: "/patients", label: "Пациенты", icon: Users },
        { path: "/analytics", label: "Аналитика", icon: TrendingUp },
      ] as const,
    []
  );

  const userInitials = useMemo(() => {
    if (!currentUser?.email) {
      return "U";
    }
    const [localPart] = currentUser.email.split("@");
    if (!localPart) {
      return currentUser.email.slice(0, 2).toUpperCase();
    }
    const parts = localPart.replace(/[^a-zA-Zа-яА-Я0-9]+/g, " ").trim().split(" ");
    if (parts.length === 0) {
      return localPart.slice(0, 2).toUpperCase();
    }
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }, [currentUser?.email]);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    store.logout();
    toast.success("Выход выполнен");
    navigate("/", { replace: true });
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-3 px-4 py-3 md:px-6">
          <Link to="/" className="flex items-center gap-3 md:gap-4">
            <img
              src="/ser.png"
              alt="Serkor logo"
              className="h-10 w-10 rounded-full border border-border object-cover md:h-12 md:w-12"
            />
            <div className="flex flex-col">
              <span className="text-lg font-semibold tracking-tight md:text-xl">
                Serkor
              </span>
              <span className="text-xs text-muted-foreground">
                {clinic?.name || "Ваша клиника"}
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 rounded-full border border-border bg-muted/40 p-1 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {subscription?.isTrial && (
              <div className="hidden items-center gap-2 sm:flex">
                {trialDaysRemaining !== null && (
                  <Badge variant="secondary" className="bg-blue-600 text-white">
                    Осталось {trialDaysRemaining} {trialDaysRemaining === 1 ? "день" : trialDaysRemaining < 5 ? "дня" : "дней"}
                  </Badge>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setContactModalOpen(true)}
                  className="border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100"
                >
                  Связаться с нами
                </Button>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-10 w-10"
              aria-label="Переключить тему"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            {isWeb() && (
              <Button
                variant="default"
                size="sm"
                asChild
                className="hidden md:flex"
              >
                <a href="/BiyoSetup.zip" download>
                  <Download className="mr-2 h-4 w-4" />
                  Скачать
                </a>
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden h-10 w-10 md:flex"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold">
                      {currentUser.email}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {clinic?.name || "Клиника не указана"}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>{userInitials}</AvatarFallback>
                    </Avatar>
                    <span>Профиль</span>
                    <Badge variant="outline" className="ml-auto text-[10px] uppercase">
                      {currentUser.role === "admin" ? "Админ" : "Врач"}
                    </Badge>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    handleLogout();
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Выйти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 md:hidden"
                  aria-label="Открыть меню"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="flex flex-col gap-6 sm:max-w-xs">
                <SheetHeader className="text-left">
                  <SheetTitle>Навигация</SheetTitle>
                  <div className="text-sm text-muted-foreground">
                    {clinic?.name || "Ваша клиника"}
                  </div>
                </SheetHeader>
                <div className="flex flex-col gap-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive(item.path)
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                      onClick={() => setIsMobileNavOpen(false)}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  ))}
                </div>
                <div className="mt-auto flex flex-col gap-3">
                  {subscription?.isTrial && trialDaysRemaining !== null && (
                    <Badge variant="secondary" className="justify-center py-2">
                      Пробный период: {trialDaysRemaining} дней
                    </Badge>
                  )}
                  {isWeb() && (
                    <Button variant="default" asChild>
                      <a href="/BiyoSetup.zip" download>
                        <Download className="mr-2 h-4 w-4" />
                        Скачать приложение
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      toggleTheme();
                      setIsMobileNavOpen(false);
                    }}
                  >
                    {isDark ? (
                      <>
                        <Sun className="mr-2 h-4 w-4" />
                        Светлая тема
                      </>
                    ) : (
                      <>
                        <Moon className="mr-2 h-4 w-4" />
                        Тёмная тема
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleLogout();
                      setIsMobileNavOpen(false);
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Выйти
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <Dialog open={contactModalOpen} onOpenChange={setContactModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Мы ответим на любой вопрос и поможем настроить
            </DialogTitle>
            <DialogDescription>
              Выберите удобный способ связи
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <ContactLink href="tel:927474090" icon={<Phone className="h-5 w-5" />} title="Позвонить" subtitle="927 47 40 90" />
            <ContactLink href="https://t.me/mankimtukim" icon={<Send className="h-5 w-5" />} title="Telegram" subtitle="@mankimtukim" />
            <ContactLink href="https://wa.me/992929898800" icon={<MessageCircle className="h-5 w-5" />} title="WhatsApp" subtitle="+992 929 898 800" />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ContactLink({
  href,
  icon,
  title,
  subtitle,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      className="flex items-center gap-3 rounded-lg border border-border bg-card/80 p-4 transition hover:bg-muted"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white">
        {icon}
      </div>
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-sm text-muted-foreground">{subtitle}</div>
      </div>
    </a>
  );
}
