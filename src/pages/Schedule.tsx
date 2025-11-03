import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Doctor {
  id: string;
  name: string;
  subtitle?: string;
  color: string;
}

interface Appointment {
  id: string;
  doctorId: string;
  patientName: string;
  startTime: string;
  duration: number;
  color: string;
}

const doctors: Doctor[] = [
  { id: "1", name: "Jahongir", subtitle: "Босс", color: "blue" },
  { id: "2", name: "sa", color: "emerald" },
  { id: "3", name: "AS", color: "emerald" },
  { id: "4", name: "SASASAS", subtitle: "ASASAS", color: "emerald" },
  { id: "5", name: "dasdasd", color: "emerald" },
];

const mockAppointments: Appointment[] = [
  {
    id: "1",
    doctorId: "1",
    patientName: "asasd",
    startTime: "09:30",
    duration: 60,
    color: "blue",
  },
  {
    id: "2",
    doctorId: "2",
    patientName: "asdasd",
    startTime: "09:30",
    duration: 60,
    color: "emerald",
  },
];

const timeSlots = [
  "07:00",
  "07:30",
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
];

const Schedule = () => {
  const [selectedDate] = useState("ноября 4, 2025");

  const getAppointmentPosition = (startTime: string) => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes;
    const startMinutes = 7 * 60;
    return ((totalMinutes - startMinutes) / 30) * 64;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1400px] mx-auto">
        <Card className="bg-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Расписание</h1>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Plus className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" className="rounded-lg">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">{selectedDate}</span>
            </div>
            <Button variant="ghost" size="icon" className="rounded-lg">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <div className="relative">
            <div className="grid grid-cols-[100px_repeat(5,1fr)] gap-0">
              <div className="text-sm font-medium text-muted-foreground py-4">
                Время
              </div>
              {doctors.map((doctor) => (
                <div
                  key={doctor.id}
                  className="flex items-center gap-2 py-4 px-4 border-l border-border"
                >
                  <div
                    className={`h-2 w-2 rounded-full ${
                      doctor.color === "blue" ? "bg-blue-500" : "bg-emerald-500"
                    }`}
                  />
                  <div>
                    <div className="text-sm font-medium">{doctor.name}</div>
                    {doctor.subtitle && (
                      <div className="text-xs text-muted-foreground">
                        {doctor.subtitle}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {timeSlots.map((time, idx) => (
                <>
                  <div
                    key={`time-${time}`}
                    className="text-xs text-muted-foreground py-4 border-t border-border"
                  >
                    {time}
                  </div>
                  {doctors.map((doctor, docIdx) => (
                    <div
                      key={`slot-${time}-${doctor.id}`}
                      className="relative border-l border-t border-border min-h-[64px] hover:bg-secondary/50 transition-colors cursor-pointer group"
                    >
                      {time === "08:00" && docIdx === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                </>
              ))}
            </div>

            {mockAppointments.map((appointment) => {
              const doctorIndex = doctors.findIndex(
                (d) => d.id === appointment.doctorId
              );
              const topPosition = getAppointmentPosition(appointment.startTime);

              return (
                <div
                  key={appointment.id}
                  className={`absolute ${
                    appointment.color === "blue"
                      ? "bg-blue-500"
                      : "bg-emerald-500"
                  } rounded-lg p-3 text-white text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity`}
                  style={{
                    top: `${topPosition + 64}px`,
                    left: `${100 + doctorIndex * (100 / 5)}%`,
                    width: `${100 / 5}%`,
                    height: `${(appointment.duration / 30) * 64}px`,
                    paddingLeft: "1rem",
                    paddingRight: "1rem",
                  }}
                >
                  {appointment.patientName}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Schedule;

function Calendar({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}
