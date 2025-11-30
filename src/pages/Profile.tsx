import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { store } from "@/lib/store";
import { toast } from "sonner";
import { LogOut, Database, Users, Calendar, DollarSign, TrendingUp, TrendingDown, Building2, Activity } from "lucide-react";
import { format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, isWithinInterval, eachDayOfInterval, subDays, subWeeks, addMonths, addYears } from "date-fns";
import { ru } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const Profile = () => {
  const navigate = useNavigate();
  const currentUser = store.getCurrentUser();
  const clinic = currentUser ? store.getClinicById(currentUser.clinicId) : null;
  const doctors = currentUser ? store.getDoctors() : [];

  const [email, setEmail] = useState(currentUser?.email || "");
  const [password, setPassword] = useState("");
  const [proficiency, setProficiency] = useState(currentUser?.proficiency || "");
  const [clinicName, setClinicName] = useState(clinic?.name || "");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Get current subscription
  const currentSubscription = store.getSubscription();

  useEffect(() => {
    const user = store.getCurrentUser();
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    
    // Only update state when not in edit mode to avoid resetting user input
    if (!isEditing && user) {
      setEmail(user.email || "");
      setProficiency(user.proficiency || "");
      const currentClinic = store.getClinicById(user.clinicId);
      setClinicName(currentClinic?.name || "");
    }
  }, [navigate, isEditing, currentUser?.clinicId]);

  if (!currentUser) {
    // Don't render anything if no user - will redirect via useEffect
    return <div className="min-h-screen bg-background flex items-center justify-center">Загрузка...</div>;
  }

  const handleSave = async () => {
    if (!email.trim()) {
      toast.error("Email не может быть пустым");
      return;
    }

    if (!clinicName.trim()) {
      toast.error("Название клиники не может быть пустым");
      return;
    }

    setIsLoading(true);
    try {
      // Update clinic name if it changed
      const trimmedClinicName = clinicName.trim();
      let updatedClinic = clinic;
      if (trimmedClinicName) {
        if (!clinic || clinic.name !== trimmedClinicName) {
          const clinicToSave = clinic
            ? { ...clinic, name: trimmedClinicName }
            : {
                id: currentUser.clinicId || `clinic_${Date.now()}`,
                name: trimmedClinicName,
                createdAt: clinic?.createdAt || new Date().toISOString(),
        };
          await store.saveClinic(clinicToSave);
          updatedClinic = clinicToSave;
        }
      }

      // Update user email, password, and proficiency
      const updatedUser = {
        ...currentUser,
        email: email.trim(),
        proficiency: proficiency.trim() || undefined,
        ...(password && password.trim() !== "" && { password: password.trim() }),
        ...(updatedClinic ? { clinicId: updatedClinic.id } : {}),
      };
      await store.saveUser(updatedUser);
      store.setCurrentUser(updatedUser);
      toast.success("Профиль обновлен");
      setIsEditing(false);
      setPassword("");
    } catch (error) {
      toast.error("Ошибка при обновлении профиля");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    store.logout();
    toast.success("Выход выполнен");
    // Use replace to prevent back navigation
    navigate("/login", { replace: true });
  };

  // Check if this is the super admin account
  const isSuperAdmin = currentUser?.email === "forthejuveuj@gmail.com";
  const canMigrateData = isSuperAdmin || currentUser.role === "admin";

  useEffect(() => {
    if (isSuperAdmin) {
      store.fetchClinics().catch((error) => console.error('Failed to fetch clinics for super admin:', error));
      // Fetch users for all clinics (will need clinicId, but super admin might not have one)
      // For now, skip if no clinicId
      const clinicId = store.getCurrentClinicId();
      if (clinicId) {
        store.fetchUsers(clinicId).catch((error) => console.error('Failed to fetch users for super admin:', error));
      }
    }
  }, [isSuperAdmin]);

  // Super admin data - get all data across all clinics
  const allClinics = isSuperAdmin ? store.getClinics() : [];
  const allPatients = isSuperAdmin ? store.getAllPatients() : [];
  const allDoctors = isSuperAdmin ? store.getAllDoctors() : [];
  const allVisits = isSuperAdmin ? store.getAllVisits() : [];
  const allUsers = isSuperAdmin ? store.getAllUsers() : [];

  // Debug: Log what we're getting (only in development)
  useEffect(() => {
    if (isSuperAdmin) {
      console.log("=== Super Admin Debug Info ===");
      console.log("All Users:", allUsers);
      console.log("All Users Count:", allUsers.length);
      console.log("All Clinics:", allClinics);
      console.log("All Patients:", allPatients.length);
      console.log("All Doctors:", allDoctors.length);
      console.log("All Visits:", allVisits.length);
      console.log("Current User:", currentUser);
      
      // Also check localStorage directly
      try {
        const rawUsers = localStorage.getItem("biyo_users");
        const parsedUsers = rawUsers ? JSON.parse(rawUsers) : [];
        console.log("Direct localStorage check - biyo_users:", parsedUsers);
        console.log("Direct localStorage count:", parsedUsers.length);
      } catch (e) {
        console.error("Error reading localStorage:", e);
      }
    }
  }, [isSuperAdmin, allUsers, allClinics, allPatients, allDoctors, allVisits, currentUser]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!isSuperAdmin) return null;

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekStart = startOfWeek(now, { locale: ru });
    const weekEnd = endOfWeek(now, { locale: ru });
    const lastWeekStart = startOfWeek(subWeeks(now, 1), { locale: ru });
    const lastWeekEnd = endOfWeek(subWeeks(now, 1), { locale: ru });

    // Filter visits by date
    const todayVisits = allVisits.filter(v => {
      const visitDate = parseISO(v.startTime);
      return isWithinInterval(visitDate, { start: todayStart, end: todayEnd }) && v.status !== "cancelled";
    });

    const weekVisits = allVisits.filter(v => {
      const visitDate = parseISO(v.startTime);
      return isWithinInterval(visitDate, { start: weekStart, end: weekEnd }) && v.status !== "cancelled";
    });

    const lastWeekVisits = allVisits.filter(v => {
      const visitDate = parseISO(v.startTime);
      return isWithinInterval(visitDate, { start: lastWeekStart, end: lastWeekEnd }) && v.status !== "cancelled";
    });

    // Calculate totals
    const totalRevenue = allVisits
      .filter(v => v.status !== "cancelled")
      .reduce((sum, v) => sum + v.cost, 0);

    const totalPaid = allVisits
      .filter(v => v.status !== "cancelled")
      .reduce((sum, v) => sum + (v.payments?.reduce((p, pay) => p + pay.amount, 0) || 0), 0);

    const totalUnpaid = totalRevenue - totalPaid;

    const todayRevenue = todayVisits.reduce((sum, v) => sum + v.cost, 0);
    const weekRevenue = weekVisits.reduce((sum, v) => sum + v.cost, 0);
    const lastWeekRevenue = lastWeekVisits.reduce((sum, v) => sum + v.cost, 0);

    // Daily statistics for last 7 days
    const last7Days = eachDayOfInterval({
      start: subDays(now, 6),
      end: now,
    });

    const dailyStats = last7Days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      const dayVisits = allVisits.filter(v => {
        const visitDate = parseISO(v.startTime);
        return isWithinInterval(visitDate, { start: dayStart, end: dayEnd }) && v.status !== "cancelled";
      });
      const revenue = dayVisits.reduce((sum, v) => sum + v.cost, 0);
      const appointments = dayVisits.length;
      return {
        date: format(day, "dd.MM", { locale: ru }),
        revenue,
        appointments,
      };
    });

    // Weekly statistics for last 8 weeks
    const weeklyStats = Array.from({ length: 8 }, (_, i) => {
      const week = subWeeks(now, i);
      const weekS = startOfWeek(week, { locale: ru });
      const weekE = endOfWeek(week, { locale: ru });
      const weekVisitsData = allVisits.filter(v => {
        const visitDate = parseISO(v.startTime);
        return isWithinInterval(visitDate, { start: weekS, end: weekE }) && v.status !== "cancelled";
      });
      const revenue = weekVisitsData.reduce((sum, v) => sum + v.cost, 0);
      const appointments = weekVisitsData.length;
      return {
        week: `Неделя ${8 - i}`,
        period: `${format(weekS, "dd.MM")} - ${format(weekE, "dd.MM")}`,
        revenue,
        appointments,
      };
    }).reverse();

    // Clinic statistics
    const clinicStats = allClinics.map(clinic => {
      const clinicPatients = allPatients.filter(p => p.clinicId === clinic.id);
      const clinicDoctors = allDoctors.filter(d => d.clinicId === clinic.id);
      const clinicVisits = allVisits.filter(v => v.clinicId === clinic.id && v.status !== "cancelled");
      const clinicRevenue = clinicVisits.reduce((sum, v) => sum + v.cost, 0);
      const clinicPaid = clinicVisits.reduce((sum, v) => sum + (v.payments?.reduce((p, pay) => p + pay.amount, 0) || 0), 0);
      const clinicUnpaid = clinicRevenue - clinicPaid;
      return {
        clinic,
        patients: clinicPatients.length,
        doctors: clinicDoctors.length,
        appointments: clinicVisits.length,
        revenue: clinicRevenue,
        paid: clinicPaid,
        unpaid: clinicUnpaid,
      };
    });

    return {
      totalClinics: allClinics.length,
      totalPatients: allPatients.length,
      totalDoctors: allDoctors.length,
      totalAppointments: allVisits.filter(v => v.status !== "cancelled").length,
      totalRevenue,
      totalPaid,
      totalUnpaid,
      todayRevenue,
      weekRevenue,
      lastWeekRevenue,
      todayAppointments: todayVisits.length,
      weekAppointments: weekVisits.length,
      dailyStats,
      weeklyStats,
      clinicStats,
    };
  }, [isSuperAdmin, allClinics, allPatients, allDoctors, allVisits]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Профиль</h1>
          <p className="text-muted-foreground">Управление вашим профилем</p>
        </div>

        {isSuperAdmin ? (
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Профиль</TabsTrigger>
              <TabsTrigger value="tariff">Тариф</TabsTrigger>
              <TabsTrigger value="data">Данные</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="space-y-6">

        <Card className="p-6 space-y-6">
          {/* User Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            {isEditing ? (
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
            ) : (
              <p className="text-sm py-2 px-3 bg-secondary rounded-md">{email}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            {isEditing ? (
              <>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Введите новый пароль"
                />
                <p className="text-xs text-muted-foreground">
                  Оставьте пустым, чтобы не изменять пароль
                </p>
              </>
            ) : (
              <p className="text-sm py-2 px-3 bg-secondary rounded-md text-muted-foreground">
                {currentUser.password ? "••••••••" : "Не установлен"}
              </p>
            )}
          </div>

          {/* Clinic Name */}
          <div className="space-y-2">
            <Label htmlFor="clinicName">Клиника</Label>
            {isEditing ? (
              <Input
                id="clinicName"
                type="text"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                placeholder="Название клиники"
              />
            ) : (
              <p className="text-sm py-2 px-3 bg-secondary rounded-md">
                {clinic?.name || "Не указана"}
              </p>
            )}
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label>Роль</Label>
            <p className="text-sm py-2 px-3 bg-secondary rounded-md">
              {currentUser.role === "admin" ? "Администратор" : "Пользователь"}
            </p>
          </div>

          {/* Proficiency */}
          <div className="space-y-2">
            <Label htmlFor="proficiency">Специализация</Label>
            {isEditing ? (
              <Input
                id="proficiency"
                type="text"
                value={proficiency}
                onChange={(e) => setProficiency(e.target.value)}
                placeholder="Ваша специализация"
              />
            ) : (
              <p className="text-sm py-2 px-3 bg-secondary rounded-md">
                {currentUser.proficiency || "Не указана"}
              </p>
            )}
          </div>

          {/* Amount of Doctors */}
          <div className="space-y-2">
            <Label>Количество врачей</Label>
            <p className="text-sm py-2 px-3 bg-secondary rounded-md">
              {doctors.length}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEmail(currentUser.email || "");
                    setProficiency(currentUser.proficiency || "");
                    setPassword("");
                    const currentClinic = store.getClinicById(currentUser.clinicId);
                    setClinicName(currentClinic?.name || "");
                  }}
                  className="flex-1"
                >
                  Отмена
                </Button>
                <Button onClick={handleSave} disabled={isLoading} className="flex-1">
                  {isLoading ? "Сохранение..." : "Сохранить"}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => {
                  // Initialize state when entering edit mode
                  setEmail(currentUser.email || "");
                  setProficiency(currentUser.proficiency || "");
                  setPassword("");
                  const currentClinic = store.getClinicById(currentUser.clinicId);
                  setClinicName(currentClinic?.name || "");
                  setIsEditing(true);
                }}
                className="flex-1"
              >
                Редактировать
              </Button>
            )}
          </div>
        </Card>

          {canMigrateData && (
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium mb-1">Миграция локальных данных</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Перенесите локальные аккаунты, клиники и пациентов в облако, чтобы иметь к ним доступ на любом устройстве.
                  </p>
                </div>
                <Button onClick={() => navigate("/migrate")}>Открыть инструмент</Button>
              </div>
            </Card>
          )}

              {/* Logout Button */}
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium mb-1">Выход из системы</h3>
                    <p className="text-sm text-muted-foreground">
                      Выйдите из своей учетной записи
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={handleLogout}
                    className="gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Выйти
                  </Button>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="tariff" className="space-y-6">
              {/* Trial Status Banner */}
              {currentSubscription?.isTrial && (
                <Card className="p-6 bg-blue-50 border-blue-200">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-blue-900 mb-1">
                        Бесплатный пробный период активен
                      </h3>
                      {currentSubscription.trialEndDate && (() => {
                        const trialEnd = parseISO(currentSubscription.trialEndDate);
                        const today = new Date();
                        const daysRemaining = Math.ceil((trialEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                        return (
                          <p className="text-sm text-blue-700">
                            Пробный период заканчивается через {daysRemaining} {daysRemaining === 1 ? 'день' : daysRemaining < 5 ? 'дня' : 'дней'} ({format(trialEnd, "d MMMM yyyy", { locale: ru })})
                          </p>
                        );
                      })()}
                    </div>
                    <Button 
                      onClick={() => {
                        // You can add contact functionality here, e.g., open email or contact form
                        window.location.href = 'mailto:support@serkor.com?subject=Вопрос о тарифном плане';
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Связаться с нами
                    </Button>
                  </div>
                </Card>
              )}
              
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">Тарифные планы</h2>
                <div className="grid gap-6 md:grid-cols-3">
                  {[
                    {
                      name: "Старт",
                      plan: "start" as const,
                      subtitle: "Для соло-врачей",
                      bullets: [
                        "1 клиника · 1 врач",
                        "Полный функционал: расписание, пациенты, аналитика",
                        "Управление оплатами и долгами",
                      ],
                      monthlyPrice: "199 смн / месяц",
                      yearlyPrice: "1 990 смн / год",
                    },
                    {
                      name: "Рост",
                      plan: "growth" as const,
                      subtitle: "1 клиника · 2–10 врачей",
                      bullets: [
                        "Синхронизация аккаунтов врачей и общее расписание",
                        "Администратор + аналитика по команде",
                        "Бесплатный перенос данных из старой CRM",
                      ],
                      monthlyPrice: "150 смн за врача / месяц",
                      yearlyPrice: "1 500 смн за врача / год",
                    },
                    {
                      name: "Сеть",
                      plan: "network" as const,
                      subtitle: "Для сетей и франшиз",
                      bullets: [
                        "Несколько филиалов",
                        "Единый финансовый контур",
                        "API и кастомные интеграции",
                      ],
                      monthlyPrice: "Связаться с командой",
                      yearlyPrice: "",
                    },
                  ].map((planInfo) => {
                    const isActive = currentSubscription?.plan === planInfo.plan && currentSubscription?.isActive;
                    const isTrial = isActive && currentSubscription?.isTrial;
                    const nextPaymentDate = isActive && currentSubscription?.nextPaymentDate
                      ? format(parseISO(currentSubscription.nextPaymentDate), "d MMMM yyyy", { locale: ru })
                      : null;
                    const trialEndDate = isTrial && currentSubscription?.trialEndDate
                      ? format(parseISO(currentSubscription.trialEndDate), "d MMMM yyyy", { locale: ru })
                      : null;
                    
                    return (
                      <Card
                        key={planInfo.plan}
                        className={`p-6 relative ${
                          isActive
                            ? "border-2 border-emerald-500 bg-emerald-50/50"
                            : "border"
                        }`}
                      >
                        {isActive && (
                          <Badge className={`absolute top-4 right-4 ${isTrial ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                            <Check className="h-3 w-3 mr-1" />
                            {isTrial ? 'Пробный период' : 'Активен'}
                          </Badge>
                        )}
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-xl font-bold">{planInfo.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {planInfo.subtitle}
                            </p>
                          </div>
                          <ul className="space-y-2">
                            {planInfo.bullets.map((bullet, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm">
                                <Check className="h-4 w-4 mt-0.5 text-emerald-600 flex-shrink-0" />
                                <span>{bullet}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="pt-4 border-t space-y-2">
                            {planInfo.plan === "network" ? (
                              <p className="text-sm font-medium text-center">
                                {planInfo.monthlyPrice}
                              </p>
                            ) : (
                              <>
                                <div className="text-center">
                                  <p className="text-lg font-bold">
                                    {planInfo.monthlyPrice}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    или {planInfo.yearlyPrice}
                                  </p>
                                </div>
                                {isActive && (
                                  <div className="pt-2 border-t">
                                    {isTrial ? (
                                      <>
                                        <p className="text-xs font-medium text-blue-600 text-center">
                                          Бесплатный пробный период
                                        </p>
                                        {trialEndDate && (
                                          <p className="text-xs text-muted-foreground text-center mt-1">
                                            Пробный период до: {trialEndDate}
                                          </p>
                                        )}
                                        {nextPaymentDate && (
                                          <p className="text-xs font-medium text-center mt-1">
                                            Платеж после пробного периода: {nextPaymentDate}
                                          </p>
                                        )}
                                      </>
                                    ) : (
                                      <>
                                        <p className="text-xs text-muted-foreground text-center">
                                          Период: {currentSubscription?.period === "yearly" ? "Годовой" : "Месячный"}
                                        </p>
                                        {nextPaymentDate && (
                                          <p className="text-xs font-medium text-center mt-1">
                                            Следующий платеж: {nextPaymentDate}
                                          </p>
                                        )}
                                      </>
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="data" className="space-y-6">
              {stats && (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Всего клиник</p>
                          <p className="text-3xl font-bold mt-2">{stats.totalClinics}</p>
                        </div>
                        <Building2 className="h-8 w-8 text-blue-500" />
                      </div>
                    </Card>
                    <Card className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Всего пациентов</p>
                          <p className="text-3xl font-bold mt-2">{stats.totalPatients}</p>
                        </div>
                        <Users className="h-8 w-8 text-green-500" />
                      </div>
                    </Card>
                    <Card className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Всего врачей</p>
                          <p className="text-3xl font-bold mt-2">{stats.totalDoctors}</p>
                        </div>
                        <Activity className="h-8 w-8 text-purple-500" />
                      </div>
                    </Card>
                    <Card className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Всего записей</p>
                          <p className="text-3xl font-bold mt-2">{stats.totalAppointments}</p>
                        </div>
                        <Calendar className="h-8 w-8 text-orange-500" />
                      </div>
                    </Card>
                  </div>

                  {/* Financial Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-6 border-green-500/20 bg-green-500/5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Общий доход</p>
                          <p className="text-3xl font-bold mt-2 text-green-600">{stats.totalRevenue.toLocaleString('ru-RU')} смн</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-green-500" />
                      </div>
                    </Card>
                    <Card className="p-6 border-blue-500/20 bg-blue-500/5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Оплачено</p>
                          <p className="text-3xl font-bold mt-2 text-blue-600">{stats.totalPaid.toLocaleString('ru-RU')} смн</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-blue-500" />
                      </div>
                    </Card>
                    <Card className="p-6 border-red-500/20 bg-red-500/5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Не оплачено</p>
                          <p className="text-3xl font-bold mt-2 text-red-600">{stats.totalUnpaid.toLocaleString('ru-RU')} смн</p>
                        </div>
                        <TrendingDown className="h-8 w-8 text-red-500" />
                      </div>
                    </Card>
                  </div>

                  {/* Daily Statistics */}
                  <Card className="p-6">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Статистика по дням (последние 7 дней)
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={stats.dailyStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="revenue" fill="#8884d8" name="Доход (смн)" />
                        <Bar yAxisId="right" dataKey="appointments" fill="#82ca9d" name="Записей" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>

                  {/* Weekly Statistics */}
                  <Card className="p-6">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Статистика по неделям (последние 8 недель)
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={stats.weeklyStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#8884d8" name="Доход (смн)" />
                        <Line yAxisId="right" type="monotone" dataKey="appointments" stroke="#82ca9d" name="Записей" />
                      </LineChart>
                    </ResponsiveContainer>
                  </Card>

                  {/* Clinics List */}
                  <Card className="p-6">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Клиники ({stats.clinicStats.length})
                    </h3>
                    <div className="space-y-4">
                      {stats.clinicStats.map((cs) => (
                        <Card key={cs.clinic.id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg mb-2">{cs.clinic.name}</h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Пациентов</p>
                                  <p className="font-semibold">{cs.patients}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Врачей</p>
                                  <p className="font-semibold">{cs.doctors}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Записей</p>
                                  <p className="font-semibold">{cs.appointments}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Доход</p>
                                  <p className="font-semibold text-green-600">{cs.revenue.toLocaleString('ru-RU')} смн</p>
                                </div>
                              </div>
                              <div className="mt-3 flex gap-4 text-sm">
                                <span className="text-blue-600">Оплачено: {cs.paid.toLocaleString('ru-RU')} смн</span>
                                <span className="text-red-600">Не оплачено: {cs.unpaid.toLocaleString('ru-RU')} смн</span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </Card>

                  {/* All Users/Accounts */}
                  <Card className="p-6">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Все пользователи ({allUsers.length})
                    </h3>
                    {allUsers.length === 0 ? (
                      <div className="p-6 text-center">
                        <p className="text-muted-foreground mb-2">
                          Пользователи не найдены в localStorage этого браузера.
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ⚠️ Важно: localStorage хранится отдельно для каждого браузера и устройства.
                          Если другие пользователи создавали аккаунты на других браузерах/устройствах, 
                          они не будут видны здесь.
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Все аккаунты должны быть созданы в <strong>этом же браузере</strong>, 
                          чтобы суперадминистратор мог их видеть.
                        </p>
                      </div>
                    ) : allUsers.length === 1 ? (
                      <div className="p-6">
                        <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                          <p className="text-sm font-medium mb-2">⚠️ Найден только 1 пользователь (это вы)</p>
                          <p className="text-xs text-muted-foreground mb-2">
                            Это означает, что другие аккаунты были созданы в <strong>другом браузере или на другом устройстве</strong>.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <strong>Как это работает:</strong> localStorage хранится отдельно для каждого браузера. 
                            Если вы создали аккаунты на Chrome, Firefox, Safari, или разных устройствах - 
                            они не будут видны друг другу.
                          </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {allUsers.map((user) => {
                            const clinic = allClinics.find(c => c.id === user.clinicId);
                            const userPatients = allPatients.filter(p => p.clinicId === user.clinicId);
                            const userVisits = allVisits.filter(v => v.clinicId === user.clinicId && v.status !== "cancelled");
                            return (
                              <Card key={user.id} className="p-4">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-semibold">{user.email}</h4>
                                    {user.role === "admin" && (
                                      <span className="text-xs bg-blue-500/20 text-blue-600 px-2 py-1 rounded">Admin</span>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">{clinic?.name || "Неизвестная клиника"}</p>
                                  {user.proficiency && (
                                    <p className="text-sm">{user.proficiency}</p>
                                  )}
                                  <div className="flex gap-4 text-sm mt-2">
                                    <span>Пациентов: {userPatients.length}</span>
                                    <span>Записей: {userVisits.length}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    Создан: {format(parseISO(user.createdAt), "dd.MM.yyyy", { locale: ru })}
                                  </p>
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {allUsers.map((user) => {
                          const clinic = allClinics.find(c => c.id === user.clinicId);
                          const userPatients = allPatients.filter(p => p.clinicId === user.clinicId);
                          const userVisits = allVisits.filter(v => v.clinicId === user.clinicId && v.status !== "cancelled");
                          return (
                            <Card key={user.id} className="p-4">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-semibold">{user.email}</h4>
                                  {user.role === "admin" && (
                                    <span className="text-xs bg-blue-500/20 text-blue-600 px-2 py-1 rounded">Admin</span>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">{clinic?.name || "Неизвестная клиника"}</p>
                                {user.proficiency && (
                                  <p className="text-sm">{user.proficiency}</p>
                                )}
                                <div className="flex gap-4 text-sm mt-2">
                                  <span>Пациентов: {userPatients.length}</span>
                                  <span>Записей: {userVisits.length}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Создан: {format(parseISO(user.createdAt), "dd.MM.yyyy", { locale: ru })}
                                </p>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </Card>

                  {/* All Doctors */}
                  <Card className="p-6">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Все врачи ({allDoctors.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {allDoctors.map((doctor) => {
                        const clinic = allClinics.find(c => c.id === doctor.clinicId);
                        const doctorVisits = allVisits.filter(v => v.doctorId === doctor.id && v.status !== "cancelled");
                        const doctorRevenue = doctorVisits.reduce((sum, v) => sum + v.cost, 0);
                        return (
                          <Card key={doctor.id} className="p-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="h-4 w-4 rounded-full" style={{ backgroundColor: doctor.color }} />
                                <h4 className="font-semibold">{doctor.name}</h4>
                              </div>
                              <p className="text-sm text-muted-foreground">{clinic?.name || "Неизвестная клиника"}</p>
                              {doctor.specialization && (
                                <p className="text-sm">{doctor.specialization}</p>
                              )}
                              <div className="flex gap-4 text-sm mt-2">
                                <span>Записей: {doctorVisits.length}</span>
                                <span className="text-green-600">Доход: {doctorRevenue.toLocaleString('ru-RU')} смн</span>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </Card>

                  {/* Today & Week Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="p-6">
                      <h3 className="text-lg font-bold mb-4">Сегодня</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Доход:</span>
                          <span className="font-semibold text-green-600">{stats.todayRevenue.toLocaleString('ru-RU')} смн</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Записей:</span>
                          <span className="font-semibold">{stats.todayAppointments}</span>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-6">
                      <h3 className="text-lg font-bold mb-4">Эта неделя</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Доход:</span>
                          <span className="font-semibold text-green-600">{stats.weekRevenue.toLocaleString('ru-RU')} смн</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Записей:</span>
                          <span className="font-semibold">{stats.weekAppointments}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Прошлая неделя:</span>
                          <span className="font-semibold">{stats.lastWeekRevenue.toLocaleString('ru-RU')} смн</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Изменение:</span>
                          <span className={`font-semibold ${stats.weekRevenue >= stats.lastWeekRevenue ? 'text-green-600' : 'text-red-600'}`}>
                            {stats.weekRevenue >= stats.lastWeekRevenue ? '+' : ''}
                            {(stats.weekRevenue - stats.lastWeekRevenue).toLocaleString('ru-RU')} смн
                          </span>
                        </div>
                      </div>
                    </Card>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">Профиль</TabsTrigger>
              <TabsTrigger value="tariff">Тариф</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="space-y-6">
            <Card className="p-6 space-y-6">
              {/* User Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                {isEditing ? (
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                ) : (
                  <p className="text-sm py-2 px-3 bg-secondary rounded-md">{email}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                {isEditing ? (
                  <>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Введите новый пароль"
                    />
                    <p className="text-xs text-muted-foreground">
                      Оставьте пустым, чтобы не изменять пароль
                    </p>
                  </>
                ) : (
                  <p className="text-sm py-2 px-3 bg-secondary rounded-md text-muted-foreground">
                    {currentUser.password ? "••••••••" : "Не установлен"}
                  </p>
                )}
              </div>

              {/* Clinic Name */}
              <div className="space-y-2">
                <Label htmlFor="clinicName">Клиника</Label>
                {isEditing ? (
                  <Input
                    id="clinicName"
                    type="text"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    placeholder="Название клиники"
                  />
                ) : (
                  <p className="text-sm py-2 px-3 bg-secondary rounded-md">
                    {clinic?.name || "Не указана"}
                  </p>
                )}
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label>Роль</Label>
                <p className="text-sm py-2 px-3 bg-secondary rounded-md">
                  {currentUser.role === "admin" ? "Администратор" : "Пользователь"}
                </p>
              </div>

              {/* Proficiency */}
              <div className="space-y-2">
                <Label htmlFor="proficiency">Специализация</Label>
                {isEditing ? (
                  <Input
                    id="proficiency"
                    type="text"
                    value={proficiency}
                    onChange={(e) => setProficiency(e.target.value)}
                    placeholder="Ваша специализация"
                  />
                ) : (
                  <p className="text-sm py-2 px-3 bg-secondary rounded-md">
                    {currentUser.proficiency || "Не указана"}
                  </p>
                )}
              </div>

              {/* Amount of Doctors */}
              <div className="space-y-2">
                <Label>Количество врачей</Label>
                <p className="text-sm py-2 px-3 bg-secondary rounded-md">
                  {doctors.length}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setEmail(currentUser.email || "");
                        setProficiency(currentUser.proficiency || "");
                        setPassword("");
                        const currentClinic = store.getClinicById(currentUser.clinicId);
                        setClinicName(currentClinic?.name || "");
                      }}
                      className="flex-1"
                    >
                      Отмена
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      {isLoading ? "Сохранение..." : "Сохранить"}
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => {
                      // Initialize state when entering edit mode
                      setEmail(currentUser.email || "");
                      setProficiency(currentUser.proficiency || "");
                      setPassword("");
                      const currentClinic = store.getClinicById(currentUser.clinicId);
                      setClinicName(currentClinic?.name || "");
                      setIsEditing(true);
                    }}
                    className="flex-1"
                  >
                    Редактировать
                  </Button>
                )}
              </div>
            </Card>

            {/* Logout Button */}
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium mb-1">Выход из системы</h3>
                  <p className="text-sm text-muted-foreground">
                    Выйдите из своей учетной записи
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={handleLogout}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Выйти
                </Button>
              </div>
            </Card>
            </TabsContent>
            
            <TabsContent value="tariff" className="space-y-6">
              {/* Trial Status Banner */}
              {currentSubscription?.isTrial && (
                <Card className="p-6 bg-blue-50 border-blue-200">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-blue-900 mb-1">
                        Бесплатный пробный период активен
                      </h3>
                      {currentSubscription.trialEndDate && (() => {
                        const trialEnd = parseISO(currentSubscription.trialEndDate);
                        const today = new Date();
                        const daysRemaining = Math.ceil((trialEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                        return (
                          <p className="text-sm text-blue-700">
                            Пробный период заканчивается через {daysRemaining} {daysRemaining === 1 ? 'день' : daysRemaining < 5 ? 'дня' : 'дней'} ({format(trialEnd, "d MMMM yyyy", { locale: ru })})
                          </p>
                        );
                      })()}
                    </div>
                    <Button 
                      onClick={() => {
                        // You can add contact functionality here, e.g., open email or contact form
                        window.location.href = 'mailto:support@serkor.com?subject=Вопрос о тарифном плане';
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Связаться с нами
                    </Button>
                  </div>
                </Card>
              )}
              
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">Тарифные планы</h2>
                <div className="grid gap-6 md:grid-cols-3">
                  {[
                    {
                      name: "Старт",
                      plan: "start" as const,
                      subtitle: "Для соло-врачей",
                      bullets: [
                        "1 клиника · 1 врач",
                        "Полный функционал: расписание, пациенты, аналитика",
                        "Управление оплатами и долгами",
                      ],
                      monthlyPrice: "199 смн / месяц",
                      yearlyPrice: "1 990 смн / год",
                    },
                    {
                      name: "Рост",
                      plan: "growth" as const,
                      subtitle: "1 клиника · 2–10 врачей",
                      bullets: [
                        "Синхронизация аккаунтов врачей и общее расписание",
                        "Администратор + аналитика по команде",
                        "Бесплатный перенос данных из старой CRM",
                      ],
                      monthlyPrice: "150 смн за врача / месяц",
                      yearlyPrice: "1 500 смн за врача / год",
                    },
                    {
                      name: "Сеть",
                      plan: "network" as const,
                      subtitle: "Для сетей и франшиз",
                      bullets: [
                        "Несколько филиалов",
                        "Единый финансовый контур",
                        "API и кастомные интеграции",
                      ],
                      monthlyPrice: "Связаться с командой",
                      yearlyPrice: "",
                    },
                  ].map((planInfo) => {
                    const isActive = currentSubscription?.plan === planInfo.plan && currentSubscription?.isActive;
                    const isTrial = isActive && currentSubscription?.isTrial;
                    const nextPaymentDate = isActive && currentSubscription?.nextPaymentDate
                      ? format(parseISO(currentSubscription.nextPaymentDate), "d MMMM yyyy", { locale: ru })
                      : null;
                    const trialEndDate = isTrial && currentSubscription?.trialEndDate
                      ? format(parseISO(currentSubscription.trialEndDate), "d MMMM yyyy", { locale: ru })
                      : null;
                    
                    return (
                      <Card
                        key={planInfo.plan}
                        className={`p-6 relative ${
                          isActive
                            ? "border-2 border-emerald-500 bg-emerald-50/50"
                            : "border"
                        }`}
                      >
                        {isActive && (
                          <Badge className={`absolute top-4 right-4 ${isTrial ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                            <Check className="h-3 w-3 mr-1" />
                            {isTrial ? 'Пробный период' : 'Активен'}
                          </Badge>
                        )}
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-xl font-bold">{planInfo.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {planInfo.subtitle}
                            </p>
                          </div>
                          <ul className="space-y-2">
                            {planInfo.bullets.map((bullet, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm">
                                <Check className="h-4 w-4 mt-0.5 text-emerald-600 flex-shrink-0" />
                                <span>{bullet}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="pt-4 border-t space-y-2">
                            {planInfo.plan === "network" ? (
                              <p className="text-sm font-medium text-center">
                                {planInfo.monthlyPrice}
                              </p>
                            ) : (
                              <>
                                <div className="text-center">
                                  <p className="text-lg font-bold">
                                    {planInfo.monthlyPrice}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    или {planInfo.yearlyPrice}
                                  </p>
                                </div>
                                {isActive && (
                                  <div className="pt-2 border-t">
                                    {isTrial ? (
                                      <>
                                        <p className="text-xs font-medium text-blue-600 text-center">
                                          Бесплатный пробный период
                                        </p>
                                        {trialEndDate && (
                                          <p className="text-xs text-muted-foreground text-center mt-1">
                                            Пробный период до: {trialEndDate}
                                          </p>
                                        )}
                                        {nextPaymentDate && (
                                          <p className="text-xs font-medium text-center mt-1">
                                            Платеж после пробного периода: {nextPaymentDate}
                                          </p>
                                        )}
                                      </>
                                    ) : (
                                      <>
                                        <p className="text-xs text-muted-foreground text-center">
                                          Период: {currentSubscription?.period === "yearly" ? "Годовой" : "Месячный"}
                                        </p>
                                        {nextPaymentDate && (
                                          <p className="text-xs font-medium text-center mt-1">
                                            Следующий платеж: {nextPaymentDate}
                                          </p>
                                        )}
                                      </>
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default Profile;

