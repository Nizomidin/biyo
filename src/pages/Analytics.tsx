import { useState, useMemo, useEffect } from "react";
import { Users, Calendar, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { store } from "@/lib/store";
import { format, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { PageContainer } from "@/components/layout/PageContainer";

type PeriodType = "today" | "week" | "month" | "year" | "custom";

const Analytics = () => {
  const [period, setPeriod] = useState<PeriodType>("month");
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("all");
  const [refreshKey, setRefreshKey] = useState(0);

  const [doctors, setDoctors] = useState(store.getDoctors());
  const [patients, setPatients] = useState(store.getPatients());
  const [visits, setVisits] = useState(store.getVisits());
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch initial data and refresh periodically
  useEffect(() => {
    const clinicId = store.getCurrentClinicId();
    if (!clinicId) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [fetchedDoctors, fetchedPatients, fetchedVisits] = await Promise.all([
          store.fetchDoctors(clinicId),
          store.fetchPatients(clinicId),
          store.fetchVisits(clinicId),
        ]);
        setDoctors(fetchedDoctors);
        setPatients(fetchedPatients);
        setVisits(fetchedVisits);
        setIsLoading(false);
        setRefreshKey(prev => prev + 1);
      } catch (error) {
        console.error('Failed to fetch analytics data:', error);
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchData();
    
    // Refresh every 10 seconds to catch changes from other users
    const interval = setInterval(fetchData, 10000);
    
    // Listen to custom events for same-tab updates
    const handleDataUpdate = () => {
      setDoctors(store.getDoctors());
      setPatients(store.getPatients());
      setVisits(store.getVisits());
      setRefreshKey(prev => prev + 1);
    };
    
    window.addEventListener('biyo-data-updated', handleDataUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('biyo-data-updated', handleDataUpdate);
    };
  }, []);

  // Get date range based on period
  const getDateRange = (): [Date, Date] => {
    const now = new Date();
    switch (period) {
      case "today":
        return [startOfDay(now), endOfDay(now)];
      case "week":
        return [startOfWeek(now, { locale: ru }), endOfWeek(now, { locale: ru })];
      case "month":
        return [startOfMonth(now), endOfMonth(now)];
      case "year":
        return [startOfYear(now), endOfYear(now)];
      default:
        return [startOfMonth(now), endOfMonth(now)];
    }
  };

  const [dateFrom, dateTo] = getDateRange();

  // Filter visits by date range and doctor
  const filteredVisits = useMemo(() => {
    return visits.filter((visit) => {
      const visitDate = parseISO(visit.startTime);
      const inRange = isWithinInterval(visitDate, {
        start: dateFrom,
        end: dateTo,
      });
      const doctorMatch = selectedDoctorId === "all" || visit.doctorId === selectedDoctorId;
      return inRange && doctorMatch && visit.status !== "cancelled";
    });
  }, [visits, dateFrom, dateTo, selectedDoctorId, refreshKey]);

  // Calculate summary metrics
  const metrics = useMemo(() => {
    const totalPatients = patients.length;
    const totalAppointments = filteredVisits.length;
    const totalIncome = filteredVisits.reduce((sum, v) => sum + v.cost, 0);
    const totalPaid = filteredVisits.reduce(
      (sum, v) => sum + (v.payments?.reduce((p, pay) => p + pay.amount, 0) || 0),
      0
    );
    const totalUnpaid = totalIncome - totalPaid;

    return {
      totalPatients,
      totalAppointments,
      totalIncome,
      totalPaid,
      totalUnpaid,
    };
  }, [patients, filteredVisits]);

  // Prepare chart data
  const chartData = useMemo(() => {
    const dataMap = new Map<string, { revenue: number; appointments: number }>();

    filteredVisits.forEach((visit) => {
      const dateKey = format(parseISO(visit.startTime), "d MMM", { locale: ru });
      const existing = dataMap.get(dateKey) || { revenue: 0, appointments: 0 };
      dataMap.set(dateKey, {
        revenue: existing.revenue + visit.cost,
        appointments: existing.appointments + 1,
      });
    });

    return Array.from(dataMap.entries())
      .map(([date, values]) => ({
        date,
        revenue: values.revenue,
        appointments: values.appointments,
      }))
      .sort((a, b) => {
        const dateA = parseISO(a.date.split(" ")[1] + " " + a.date.split(" ")[0]);
        const dateB = parseISO(b.date.split(" ")[1] + " " + b.date.split(" ")[0]);
        return dateA.getTime() - dateB.getTime();
      });
  }, [filteredVisits]);

  // Calculate doctor statistics
  const doctorStats = useMemo(() => {
    const statsMap = new Map<
      string,
      { visits: number; revenue: number; unpaid: number }
    >();

    filteredVisits.forEach((visit) => {
      const existing = statsMap.get(visit.doctorId) || {
        visits: 0,
        revenue: 0,
        unpaid: 0,
      };
      const paid = visit.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      statsMap.set(visit.doctorId, {
        visits: existing.visits + 1,
        revenue: existing.revenue + visit.cost,
        unpaid: existing.unpaid + (visit.cost - paid),
      });
    });

    return Array.from(statsMap.entries())
      .map(([doctorId, stats]) => {
        const doctor = doctors.find((d) => d.id === doctorId);
        return {
          name: doctor?.name || "Неизвестный",
          visits: stats.visits,
          revenue: stats.revenue,
          avgCheck: stats.visits > 0 ? stats.revenue / stats.visits : 0,
          unpaid: stats.unpaid,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredVisits, doctors]);

  if (isLoading) {
    return (
      <PageContainer contentClassName="space-y-4 sm:space-y-6">
        <Card className="bg-card p-4 sm:p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="text-muted-foreground">Загрузка аналитики...</p>
            </div>
          </div>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer contentClassName="space-y-4 sm:space-y-6">
      <Card className="bg-card p-4 sm:p-6">
        <h2 className="mb-6 text-xl font-bold">Фильтры</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
              <span className="text-sm text-muted-foreground">Период:</span>
              <Select value={period} onValueChange={(v) => setPeriod(v as PeriodType)}>
                <SelectTrigger className="w-full border-0 bg-secondary sm:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Сегодня</SelectItem>
                  <SelectItem value="week">Эта неделя</SelectItem>
                  <SelectItem value="month">Этот месяц</SelectItem>
                  <SelectItem value="year">Этот год</SelectItem>
                </SelectContent>
              </Select>
            </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
              <span className="text-sm text-muted-foreground">Врач:</span>
              <Select
                value={selectedDoctorId}
                onValueChange={setSelectedDoctorId}
              >
                <SelectTrigger className="w-full border-0 bg-secondary sm:w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все врачи</SelectItem>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card className="bg-card p-4 sm:p-6">
          <div className="mb-2 flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Пациентов</span>
            </div>
            <div className="text-3xl font-bold">{metrics.totalPatients}</div>
        </Card>

        <Card className="bg-card p-4 sm:p-6">
          <div className="mb-2 flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Приемов</span>
            </div>
            <div className="text-3xl font-bold">{metrics.totalAppointments}</div>
        </Card>

        <Card className="bg-card p-4 sm:p-6">
          <div className="mb-2 flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Общий доход</span>
            </div>
            <div className="text-3xl font-bold">
              {metrics.totalIncome.toFixed(2)} смн
            </div>
          </Card>

        <Card className="bg-card p-4 sm:p-6">
          <div className="mb-2 flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Оплачено</span>
            </div>
            <div className="text-3xl font-bold text-emerald-500">
              {metrics.totalPaid.toFixed(2)} смн
            </div>
          </Card>

        <Card className="bg-card p-4 sm:p-6">
          <div className="mb-2 flex items-center gap-3">
              <TrendingDown className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Не оплачено</span>
            </div>
            <div className="text-3xl font-bold text-orange-500">
              {metrics.totalUnpaid.toFixed(2)} смн
            </div>
          </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-card p-4 sm:p-6">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-bold">Доход по дням</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  style={{ fontSize: "12px" }}
                />
                <YAxis stroke="#64748b" style={{ fontSize: "12px" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: "#10b981", r: 4 }}
                  name="Доход (смн)"
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-2 mt-4 text-sm text-emerald-500">
              <span>→ Доход (смн)</span>
            </div>
          </Card>

        <Card className="bg-card p-4 sm:p-6">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-bold">Приемы по дням</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  style={{ fontSize: "12px" }}
                />
                <YAxis stroke="#64748b" style={{ fontSize: "12px" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                  }}
                />
                <Bar
                  dataKey="appointments"
                  fill="#10b981"
                  radius={[8, 8, 0, 0]}
                  name="Приемов"
                />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-2 mt-4 text-sm text-emerald-500">
              <span>■ Приемов</span>
            </div>
          </Card>
      </div>

      <Card className="bg-card p-4 sm:p-6">
        <h3 className="mb-6 text-lg font-bold">Статистика по врачам</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Врач
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Приемов
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Доход
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Средний чек
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Не оплачено
                  </th>
                </tr>
              </thead>
              <tbody>
                {doctorStats.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      Нет данных
                    </td>
                  </tr>
                ) : (
                  doctorStats.map((stat, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-border last:border-0 hover:bg-secondary/50"
                    >
                      <td className="py-3 px-4 text-sm font-medium">{stat.name}</td>
                      <td className="py-3 px-4 text-sm">{stat.visits}</td>
                      <td className="py-3 px-4 text-sm">
                        {stat.revenue.toFixed(2)} смн
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {stat.avgCheck.toFixed(2)} смн
                      </td>
                      <td className="py-3 px-4 text-sm text-orange-500">
                        {stat.unpaid.toFixed(2)} смн
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
    </PageContainer>
  );
};

export default Analytics;
