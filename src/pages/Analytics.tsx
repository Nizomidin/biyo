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

const revenueData = [
  { date: "03 нояб.", value: 0 },
  { date: "04 нояб.", value: 0 },
];

const appointmentsData = [
  { date: "03 нояб.", value: 9 },
  { date: "04 нояб.", value: 2 },
];

const doctorStats = [
  { name: "Врач", appointments: "Приемов", revenue: "Доход", avgCheck: "Средний чек" },
];

const Analytics = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <Card className="bg-card p-6">
          <h2 className="text-xl font-bold mb-6">Фильтры</h2>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Период:</span>
              <Select defaultValue="month">
                <SelectTrigger className="w-[180px] bg-secondary border-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Этот месяц</SelectItem>
                  <SelectItem value="week">Эта неделя</SelectItem>
                  <SelectItem value="year">Этот год</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Врач:</span>
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px] bg-secondary border-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все врачи</SelectItem>
                  <SelectItem value="1">Jahongir</SelectItem>
                  <SelectItem value="2">sa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-5 gap-4">
          <Card className="bg-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Пациентов</span>
            </div>
            <div className="text-3xl font-bold">5</div>
          </Card>

          <Card className="bg-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Приемов</span>
            </div>
            <div className="text-3xl font-bold">11</div>
          </Card>

          <Card className="bg-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Общий доход</span>
            </div>
            <div className="text-3xl font-bold">0 смн</div>
          </Card>

          <Card className="bg-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Оплачено</span>
            </div>
            <div className="text-3xl font-bold text-emerald-500">0 смн</div>
          </Card>

          <Card className="bg-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingDown className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Не оплачено</span>
            </div>
            <div className="text-3xl font-bold text-orange-500">0 смн</div>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Card className="bg-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Доход по дням</h3>
              <Select defaultValue="days">
                <SelectTrigger className="w-[120px] bg-secondary border-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="days">По дням</SelectItem>
                  <SelectItem value="weeks">По неделям</SelectItem>
                  <SelectItem value="months">По месяцам</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
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
                  dataKey="value"
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

          <Card className="bg-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Приемы по дням</h3>
              <Select defaultValue="days">
                <SelectTrigger className="w-[120px] bg-secondary border-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="days">По дням</SelectItem>
                  <SelectItem value="weeks">По неделям</SelectItem>
                  <SelectItem value="months">По месяцам</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={appointmentsData}>
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
                  dataKey="value"
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

        <Card className="bg-card p-6">
          <h3 className="text-lg font-bold mb-6">Статистика по врачам</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
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
                </tr>
              </thead>
              <tbody>
                {doctorStats.map((stat, idx) => (
                  <tr key={idx} className="border-b border-border last:border-0">
                    <td className="py-3 px-4 text-sm">{stat.name}</td>
                    <td className="py-3 px-4 text-sm">{stat.appointments}</td>
                    <td className="py-3 px-4 text-sm">{stat.revenue}</td>
                    <td className="py-3 px-4 text-sm">{stat.avgCheck}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
