import React, { useState, useMemo, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { store, Doctor, Visit, VisitService, Patient, ToothStatus } from "@/lib/store";
import { format, addDays, startOfDay, parseISO, isSameDay } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";
import { PatientCard } from "@/pages/Patients";
import { Settings, Search, Plus as PlusIcon } from "lucide-react";
import { ToothChart } from "@/components/ToothChart";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
  "22:30",
  "23:00",
];

interface AppointmentDisplay {
  id: string;
  doctorId: string;
  patientName: string;
  startTime: string;
  duration: number;
  color: string;
  visit: Visit;
}

const Schedule = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAddDoctorOpen, setIsAddDoctorOpen] = useState(false);
  const [isAppointmentOpen, setIsAppointmentOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    doctorId: string;
    time: string;
  } | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Visit | null>(
    null
  );
  const [deleteAppointmentId, setDeleteAppointmentId] = useState<string | null>(
    null
  );
  const [selectedPatientForCard, setSelectedPatientForCard] = useState<string | null>(
    null
  );
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [deletingDoctorId, setDeletingDoctorId] = useState<string | null>(null);
  const [draggedAppointment, setDraggedAppointment] = useState<AppointmentDisplay | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<{ doctorId: string; time: string } | null>(null);

  const doctors = store.getDoctors();
  const [patients, setPatients] = useState(store.getPatients());
  const services = store.getServices();
  
  // Refresh patients list periodically to catch new additions
  useEffect(() => {
    const interval = setInterval(() => {
      setPatients(store.getPatients());
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const selectedDateStr = format(selectedDate, "d MMMM yyyy", { locale: ru });

  // Get appointments for selected date
  const appointments = useMemo(() => {
    const visits = store.getVisits();
    const dayStart = startOfDay(selectedDate);
    const dayEnd = addDays(dayStart, 1);

    return visits
      .filter((v) => {
        const visitDate = parseISO(v.startTime);
        return isSameDay(visitDate, selectedDate);
      })
      .map((visit) => {
        const patient = patients.find((p) => p.id === visit.patientId);
        const doctor = doctors.find((d) => d.id === visit.doctorId);
        const start = parseISO(visit.startTime);
        const end = parseISO(visit.endTime);
        const duration = (end.getTime() - start.getTime()) / (1000 * 60); // minutes

        return {
          id: visit.id,
          doctorId: visit.doctorId,
          patientName: patient?.name || "Неизвестный",
          startTime: format(start, "HH:mm"),
          duration,
          color: doctor?.color || "blue",
          visit,
        } as AppointmentDisplay;
      });
  }, [selectedDate, doctors, patients]);

  const navigateDate = (direction: "prev" | "next" | "today") => {
    if (direction === "today") {
      setSelectedDate(new Date());
    } else if (direction === "prev") {
      setSelectedDate(addDays(selectedDate, -1));
    } else {
      setSelectedDate(addDays(selectedDate, 1));
    }
  };

  const handleSlotClick = (doctorId: string, time: string) => {
    setSelectedSlot({ doctorId, time });
    setEditingAppointment(null);
    setIsAppointmentOpen(true);
  };

  const handleAppointmentClick = (appointment: AppointmentDisplay) => {
    setEditingAppointment(appointment.visit);
    setSelectedSlot({
      doctorId: appointment.doctorId,
      time: appointment.startTime,
    });
    setIsAppointmentOpen(true);
  };

  const handleDeleteAppointment = () => {
    if (deleteAppointmentId) {
      store.deleteVisit(deleteAppointmentId);
      toast.success("Запись удалена");
      setDeleteAppointmentId(null);
    }
  };

  const handleDragStart = (e: React.DragEvent, appointment: AppointmentDisplay) => {
    setDraggedAppointment(appointment);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", appointment.id);
  };

  const handleDragOver = (e: React.DragEvent, doctorId: string, time: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverSlot({ doctorId, time });
  };

  const handleDragLeave = () => {
    setDragOverSlot(null);
  };

  const handleDrop = (e: React.DragEvent, targetDoctorId: string, targetTime: string) => {
    e.preventDefault();
    setDragOverSlot(null);

    if (!draggedAppointment) return;

    // Calculate new start and end times
    const [hours, minutes] = targetTime.split(":").map(Number);
    const newStartDate = new Date(selectedDate);
    newStartDate.setHours(hours, minutes, 0, 0);
    
    const oldStart = parseISO(draggedAppointment.visit.startTime);
    const oldEnd = parseISO(draggedAppointment.visit.endTime);
    const duration = oldEnd.getTime() - oldStart.getTime();
    
    const newEndDate = new Date(newStartDate);
    newEndDate.setTime(newStartDate.getTime() + duration);

    // Check for conflicts
    if (checkConflict(targetDoctorId, newStartDate.toISOString(), newEndDate.toISOString(), draggedAppointment.id)) {
      toast.error("Это время уже занято. Выберите другое время.");
      setDraggedAppointment(null);
      return;
    }

    // Update the appointment
    const updatedVisit: Visit = {
      ...draggedAppointment.visit,
      doctorId: targetDoctorId,
      startTime: newStartDate.toISOString(),
      endTime: newEndDate.toISOString(),
    };

    store.saveVisit(updatedVisit);
    toast.success("Запись перемещена");
    setDraggedAppointment(null);
  };

  const SLOT_HEIGHT = 32; // Height of each 30-minute slot in pixels

  const getAppointmentPosition = (startTime: string) => {
    // Parse ISO datetime string to get just the time
    const date = parseISO(startTime);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    const startMinutes = 7 * 60; // 07:00
    return ((totalMinutes - startMinutes) / 30) * SLOT_HEIGHT;
  };

  const checkConflict = (
    doctorId: string,
    startTime: string,
    endTime: string,
    excludeVisitId?: string
  ): boolean => {
    const start = parseISO(startTime);
    const end = parseISO(endTime);

    const conflicts = store.getVisits().filter((v) => {
      if (v.doctorId !== doctorId || v.status === "cancelled") return false;
      if (excludeVisitId && v.id === excludeVisitId) return false;

      const vStart = parseISO(v.startTime);
      const vEnd = parseISO(v.endTime);

      // Check if time ranges overlap
      return (
        (start >= vStart && start < vEnd) ||
        (end > vStart && end <= vEnd) ||
        (start <= vStart && end >= vEnd)
      );
    });

    return conflicts.length > 0;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1400px] mx-auto">
        <Card className="bg-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Расписание</h1>
            <div className="flex gap-2">
              <AddDoctorDialog
                open={isAddDoctorOpen}
                onOpenChange={(open) => {
                  setIsAddDoctorOpen(open);
                  if (!open) {
                    setEditingDoctor(null);
                  }
                }}
                doctor={editingDoctor}
                onDelete={(doctorId) => setDeletingDoctorId(doctorId)}
              />
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={() => setIsAddDoctorOpen(true)}
                  >
              <Plus className="h-5 w-5" />
            </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Добавить врача</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-lg"
              onClick={() => navigateDate("prev")}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg"
                >
                  <CalendarIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">{selectedDateStr}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(date);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-lg"
              onClick={() => navigateDate("next")}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {doctors.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="mb-4">Нет врачей. Добавьте первого врача.</p>
              <Button onClick={() => setIsAddDoctorOpen(true)}>
                Добавить врача
              </Button>
            </div>
          ) : (
            <div className="relative overflow-x-auto overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
              <div
                className="grid gap-0 relative"
                style={{
                  gridTemplateColumns: `100px repeat(${doctors.length}, minmax(200px, 1fr))`,
                }}
              >
                {/* Header row: Time label + Doctor headers */}
                <div className="text-sm font-medium text-muted-foreground py-2 px-2 border-b border-r sticky left-0 top-0 bg-card z-20 h-[56px] flex items-center">
                Время
              </div>
              {doctors.map((doctor) => (
                <div
                  key={doctor.id}
                    className="flex flex-col items-center justify-center gap-1 py-2 px-2 border-b border-r border-border bg-card sticky top-0 z-10 h-[56px] relative group"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-3 w-3 rounded-full ${
                          doctor.color === "blue"
                            ? "bg-blue-500"
                            : doctor.color === "emerald"
                              ? "bg-emerald-500"
                              : doctor.color === "red"
                                ? "bg-red-500"
                                : doctor.color === "yellow"
                                  ? "bg-yellow-500"
                                  : doctor.color === "purple"
                                    ? "bg-purple-500"
                                    : "bg-gray-500"
                    }`}
                  />
                      <div className="text-sm font-medium text-center">
                        {doctor.name}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingDoctor(doctor);
                              setIsAddDoctorOpen(true);
                            }}
                          >
                            Редактировать
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setDeletingDoctorId(doctor.id);
                            }}
                          >
                            Удалить
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                  </div>
                    {doctor.specialization && (
                      <div className="text-xs text-muted-foreground text-center">
                        {doctor.specialization}
                      </div>
                    )}
                </div>
              ))}

                {/* Time slots and schedule cells */}
                {timeSlots.map((time, timeIndex) => (
                  <React.Fragment key={time}>
                    <div className="text-xs text-muted-foreground py-1 px-2 border-t border-r border-border sticky left-0 bg-card z-10 h-[32px] flex items-center">
                    {time}
                  </div>
                    {doctors.map((doctor) => {
                      const isDragOver = dragOverSlot?.doctorId === doctor.id && dragOverSlot?.time === time;
                      return (
                    <div
                      key={`slot-${time}-${doctor.id}`}
                          className={`relative border-t border-r border-border h-[32px] hover:bg-secondary/50 transition-colors cursor-pointer group ${
                            isDragOver ? "bg-primary/20 border-primary border-2" : ""
                          }`}
                          onClick={() => handleSlotClick(doctor.id, time)}
                          onDragOver={(e) => handleDragOver(e, doctor.id, time)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, doctor.id, time)}
                        >
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <Plus className="h-4 w-4 text-muted-foreground" />
                        </div>
                    </div>
                      );
                    })}
                  </React.Fragment>
              ))}
            </div>

              {/* Render appointments positioned absolutely */}
              {appointments.map((appointment) => {
              const doctorIndex = doctors.findIndex(
                (d) => d.id === appointment.doctorId
              );
              if (doctorIndex === -1) return null;
              
              const topPosition = getAppointmentPosition(appointment.visit.startTime);
                const doctorCount = doctors.length;
                // Calculate position to match grid columns exactly
                // Grid: 100px (time) + repeat(doctorCount, 1fr)
                // Each doctor column is: (100% - 100px) / doctorCount
                const margin = 2; // Small margin from borders (in pixels)
                const columnWidth = `calc((100% - 100px) / ${doctorCount} - ${margin * 2}px)`;
                // Position: 100px (time column) + (columnWidth * doctorIndex) + margin
                const leftOffset = `calc(100px + (100% - 100px) * ${doctorIndex} / ${doctorCount} + ${margin}px)`;

              const doctor = doctors.find((d) => d.id === appointment.doctorId);
              const appointmentColor = doctor?.color || "blue";

              return (
                <div
                  key={appointment.id}
                  className={`absolute rounded-lg p-2 text-white text-xs font-medium cursor-move hover:opacity-90 transition-opacity group shadow-md ${
                    draggedAppointment?.id === appointment.id ? "opacity-50" : ""
                  }`}
                  style={{
                    top: `${topPosition + 58 + margin}px`,
                    left: leftOffset,
                    width: columnWidth,
                    height: `${(appointment.duration / 30) * SLOT_HEIGHT - margin * 2}px`,
                    backgroundColor:
                      appointmentColor === "blue"
                        ? "#3b82f6"
                        : appointmentColor === "emerald"
                          ? "#10b981"
                          : appointmentColor === "red"
                            ? "#ef4444"
                            : appointmentColor === "yellow"
                              ? "#eab308"
                              : appointmentColor === "purple"
                                ? "#a855f7"
                                : "#6b7280",
                  }}
                  draggable
                  onDragStart={(e) => handleDragStart(e, appointment)}
                  onClick={() => handleAppointmentClick(appointment)}
                >
                  <div className="flex items-center justify-between h-full">
                    <span className="truncate">{appointment.patientName}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteAppointmentId(appointment.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0"
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </Card>
      </div>

      {/* Appointment Dialog */}
      {isAppointmentOpen && selectedSlot && (
        <AppointmentDialog
          open={isAppointmentOpen}
          onOpenChange={setIsAppointmentOpen}
          selectedSlot={selectedSlot}
          appointment={editingAppointment}
          patients={patients}
          doctors={doctors}
          services={services}
          selectedDate={selectedDate}
          onPatientSelect={(patientId) => setSelectedPatientForCard(patientId)}
          checkConflict={checkConflict}
        />
      )}

      {/* Patient Card */}
      {selectedPatientForCard && (
        <PatientCard
          patient={patients.find((p) => p.id === selectedPatientForCard)!}
          onClose={() => setSelectedPatientForCard(null)}
          onDelete={() => {}}
          services={services}
        />
      )}

      {/* Delete Appointment Confirmation */}
      <AlertDialog
        open={!!deleteAppointmentId}
        onOpenChange={(open) => !open && setDeleteAppointmentId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Отменить запись?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Запись будет удалена из расписания.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAppointment}
              className="bg-destructive text-destructive-foreground"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Doctor Confirmation */}
      <AlertDialog
        open={!!deletingDoctorId}
        onOpenChange={(open) => !open && setDeletingDoctorId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить врача?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Врач и все связанные записи будут удалены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingDoctorId) {
                  store.deleteDoctor(deletingDoctorId);
                  toast.success("Врач удален");
                  setDeletingDoctorId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Add/Edit Doctor Dialog
function AddDoctorDialog({
  open,
  onOpenChange,
  doctor,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctor?: Doctor | null;
  onDelete?: (doctorId: string) => void;
}) {
  const [name, setName] = useState(doctor?.name || "");
  const [specialization, setSpecialization] = useState(doctor?.specialization || "");
  const [email, setEmail] = useState(doctor?.email || "");
  const [phone, setPhone] = useState(doctor?.phone || "");
  const [color, setColor] = useState(doctor?.color || "blue");

  // Reset form when doctor changes
  useEffect(() => {
    if (doctor) {
      setName(doctor.name || "");
      setSpecialization(doctor.specialization || "");
      setEmail(doctor.email || "");
      setPhone(doctor.phone || "");
      setColor(doctor.color || "blue");
    } else {
      setName("");
      setSpecialization("");
      setEmail("");
      setPhone("");
      setColor("blue");
    }
  }, [doctor, open]);

  const colors = [
    { value: "blue", label: "Синий", class: "bg-blue-500" },
    { value: "emerald", label: "Изумрудный", class: "bg-emerald-500" },
    { value: "red", label: "Красный", class: "bg-red-500" },
    { value: "yellow", label: "Желтый", class: "bg-yellow-500" },
    { value: "purple", label: "Фиолетовый", class: "bg-purple-500" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error("Введите имя врача");
      return;
    }

    const doctorData: Doctor = {
      id: doctor?.id || `doctor_${Date.now()}_${Math.random()}`,
      name,
      specialization: specialization || undefined,
      email: email || undefined,
      phone: phone || undefined,
      color,
    };

    store.saveDoctor(doctorData);
    toast.success(doctor ? "Врач обновлен" : "Врач добавлен");

    // Reset form
    if (!doctor) {
      setName("");
      setSpecialization("");
      setEmail("");
      setPhone("");
      setColor("blue");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{doctor ? "Редактировать врача" : "Добавить врача"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {doctor && (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (onDelete && doctor) {
                    onDelete(doctor.id);
                    onOpenChange(false);
                  }
                }}
              >
                Удалить врача
              </Button>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="doctor-name">
              Имя <span className="text-destructive">*</span>
            </Label>
            <Input
              id="doctor-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="doctor-specialization">Специализация</Label>
            <Input
              id="doctor-specialization"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="doctor-email">Email</Label>
            <Input
              id="doctor-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="doctor-phone">Телефон</Label>
            <Input
              id="doctor-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Цвет</Label>
            <div className="flex gap-2">
              {colors.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-10 h-10 rounded-full ${c.class} border-2 ${
                    color === c.value ? "border-primary ring-2 ring-primary" : "border-transparent"
                  }`}
                  title={c.label}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Отмена
            </Button>
            <Button type="submit">Добавить</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Appointment Dialog
function AppointmentDialog({
  open,
  onOpenChange,
  selectedSlot,
  appointment,
  patients: initialPatients,
  doctors,
  services: initialServices,
  selectedDate,
  onPatientSelect,
  checkConflict,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSlot: { doctorId: string; time: string };
  appointment: Visit | null;
  patients: ReturnType<typeof store.getPatients>;
  doctors: ReturnType<typeof store.getDoctors>;
  services: ReturnType<typeof store.getServices>;
  selectedDate: Date;
  onPatientSelect: (patientId: string) => void;
  checkConflict: (
    doctorId: string,
    startTime: string,
    endTime: string,
    excludeVisitId?: string
  ) => boolean;
}) {
  const [patients, setPatients] = useState(initialPatients);
  const [services, setServices] = useState(initialServices);
  
  // Refresh patients and services list when dialog opens
  useEffect(() => {
    if (open) {
      setPatients(store.getPatients());
      setServices(store.getServices());
    }
  }, [open, initialServices]);
  const [patientId, setPatientId] = useState(appointment?.patientId || "");
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [isCreatingPatientDialogOpen, setIsCreatingPatientDialogOpen] = useState(false);
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientPhone, setNewPatientPhone] = useState("");
  const [serviceSearchOpen, setServiceSearchOpen] = useState(false);
  const [isCreatingServiceDialogOpen, setIsCreatingServiceDialogOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [serviceSearchQuery, setServiceSearchQuery] = useState("");
  const [doctorId, setDoctorId] = useState(
    appointment?.doctorId || selectedSlot.doctorId
  );
  const [startTime, setStartTime] = useState(
    appointment
      ? format(parseISO(appointment.startTime), "HH:mm")
      : selectedSlot.time
  );
  const [endTime, setEndTime] = useState(
    appointment
      ? format(parseISO(appointment.endTime), "HH:mm")
      : addMinutes(selectedSlot.time, 30)
  );
  const [teeth, setTeeth] = useState<ToothStatus[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedServices, setSelectedServices] = useState<VisitService[]>(() => {
    if (!appointment) return [];
    // Handle both legacy (string[]) and new (VisitService[]) formats
    if (Array.isArray(appointment.services) && appointment.services.length > 0) {
      if (typeof appointment.services[0] === 'string') {
        return (appointment.services as string[]).map(id => ({ serviceId: id, quantity: 1 }));
      }
      return appointment.services as VisitService[];
    }
    return [];
  });
  const [cost, setCost] = useState(
    appointment?.cost.toString() || ""
  );
  const [notes, setNotes] = useState(appointment?.notes || "");
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState<number | null>(null); // Store duration in minutes

  // Calculate and store duration when start/end times are initially set
  useEffect(() => {
    if (startTime && endTime) {
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      // Handle case where end time is next day
      if (end < start) {
        end.setDate(end.getDate() + 1);
      }
      const diffMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
      if (duration === null) {
        setDuration(diffMinutes);
      }
    }
  }, []); // Only run once on mount

  // Auto-adjust end time when start time changes
  useEffect(() => {
    if (startTime && duration !== null) {
      const start = new Date(`2000-01-01T${startTime}`);
      const newEnd = new Date(start.getTime() + duration * 60 * 1000);
      const newEndTime = format(newEnd, "HH:mm");
      setEndTime(newEndTime);
    }
  }, [startTime, duration]);

  // Load patient data when patientId changes (only when patientId changes, not when patients array updates)
  useEffect(() => {
    if (patientId) {
      const patient = patients.find((p) => p.id === patientId);
      setSelectedPatient(patient || null);
      if (patient) {
        // Only initialize teeth if teeth state is empty, otherwise keep user's changes
        setTeeth((prevTeeth) => prevTeeth.length === 0 ? (patient.teeth || []) : prevTeeth);
      }
    } else {
      setSelectedPatient(null);
      setTeeth([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  // Load appointment data when editing
  useEffect(() => {
    if (appointment && open) {
      setIsLoading(true);
      setTimeout(() => {
        const patient = patients.find((p) => p.id === appointment.patientId);
        const appointmentStart = format(parseISO(appointment.startTime), "HH:mm");
        const appointmentEnd = format(parseISO(appointment.endTime), "HH:mm");
        
        setPatientId(appointment.patientId);
        setDoctorId(appointment.doctorId);
        setStartTime(appointmentStart);
        setEndTime(appointmentEnd);
        
        // Calculate and store duration
        const start = new Date(`2000-01-01T${appointmentStart}`);
        const end = new Date(`2000-01-01T${appointmentEnd}`);
        if (end < start) {
          end.setDate(end.getDate() + 1);
        }
        const diffMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
        setDuration(diffMinutes);
        
        // Load patient's teeth state
        if (patient) {
          setTeeth(patient.teeth || []);
        }
        // Handle both legacy and new service formats
        if (Array.isArray(appointment.services) && appointment.services.length > 0) {
          if (typeof appointment.services[0] === 'string') {
            setSelectedServices((appointment.services as string[]).map(id => ({ serviceId: id, quantity: 1 })));
          } else {
            setSelectedServices(appointment.services as VisitService[]);
          }
        }
        setCost(appointment.cost.toString());
        setNotes(appointment.notes || "");
        setIsLoading(false);
      }, 100);
    } else if (!appointment && open) {
      // Reset for new appointment
      const slotTime = selectedSlot.time;
      setPatientId("");
      setDoctorId(selectedSlot.doctorId);
      setStartTime(slotTime);
      setEndTime(addMinutes(slotTime, 30));
      setDuration(30); // Default 30 minutes
      setSelectedServices([]);
      setTeeth([]);
      setCost("");
      setNotes("");
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointment, open, selectedSlot]);

  // Auto-fill cost when services are selected (only if cost is empty and not editing)
  useEffect(() => {
    if (selectedServices.length > 0 && !cost && !appointment) {
      const totalCost = selectedServices.reduce((sum, vs) => {
        const service = services.find((s) => s.id === vs.serviceId);
        return sum + (service?.defaultPrice || 0) * vs.quantity;
      }, 0);
      if (totalCost > 0) {
        setCost(totalCost.toString());
      }
    }
  }, [selectedServices, cost, services, appointment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !doctorId || !startTime || !endTime) {
      toast.error("Заполните все обязательные поля");
      return;
    }

    setIsLoading(true);

    // Create datetime strings
    const startDateTime = new Date(selectedDate);
    const [startHour, startMin] = startTime.split(":").map(Number);
    startDateTime.setHours(startHour, startMin, 0, 0);

    const endDateTime = new Date(selectedDate);
    const [endHour, endMin] = endTime.split(":").map(Number);
    endDateTime.setHours(endHour, endMin, 0, 0);

    // Check for conflicts
    const hasConflict = checkConflict(
      doctorId,
      startDateTime.toISOString(),
      endDateTime.toISOString(),
      appointment?.id
    );

    if (hasConflict) {
      toast.error("Это время уже занято. Выберите другое время.");
      setIsLoading(false);
      return;
    }

    // Update patient teeth if changed - always save if patient is selected
    if (patientId) {
      const patientToUpdate = patients.find((p) => p.id === patientId);
      if (patientToUpdate) {
        const updatedPatient = { ...patientToUpdate, teeth: teeth || [] };
        store.savePatient(updatedPatient);
        // Refresh patients list to get updated data
        const updatedPatients = store.getPatients();
        setPatients(updatedPatients);
        // Update local state to reflect changes
        const refreshedPatient = updatedPatients.find((p) => p.id === patientId);
        if (refreshedPatient) {
          setSelectedPatient(refreshedPatient);
        }
      }
    }

    // Get treated teeth numbers (teeth that are not healthy)
    const treatedTeethNumbers = teeth
      .filter((t) => t.status !== "healthy")
      .map((t) => t.toothNumber);

    // If services don't have teeth assigned, assign all treated teeth to them
    const servicesWithTeeth = selectedServices.map((vs) => {
      if (!vs.teeth || vs.teeth.length === 0) {
        // If no teeth assigned to this service, use all treated teeth
        return { ...vs, teeth: treatedTeethNumbers.length > 0 ? treatedTeethNumbers : undefined };
      }
      return vs;
    });

    const visit: Visit = {
      id: appointment?.id || `visit_${Date.now()}_${Math.random()}`,
      patientId,
      doctorId,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      services: servicesWithTeeth,
      cost: parseFloat(cost) || 0,
      notes,
      status: appointment?.status || "scheduled",
      payments: appointment?.payments || [],
      treatedTeeth: treatedTeethNumbers.length > 0 ? treatedTeethNumbers : undefined,
      createdAt: appointment?.createdAt || new Date().toISOString(),
    };

    store.saveVisit(visit);

    // Update patient balance
    const refreshedPatients = store.getPatients();
    const patient = refreshedPatients.find((p) => p.id === patientId);
    if (patient) {
      patient.balance = store.calculatePatientBalance(patientId);
      store.savePatient(patient);
      // Refresh patients list again after balance update
      setPatients(store.getPatients());
    }

    toast.success(appointment ? "Запись обновлена" : "Запись создана");
    setIsLoading(false);
    onOpenChange(false);
  };

  const handlePatientSelect = (patientId: string) => {
    setPatientId(patientId);
    setPatientSearchOpen(false);
    // Don't automatically open patient card
    // if (patientId) {
    //   onPatientSelect(patientId);
    // }
  };

  const handleCreatePatient = () => {
    if (!newPatientName) {
      toast.error("Введите имя пациента");
      return;
    }
    const newPatient: Patient = {
      id: `patient_${Date.now()}_${Math.random()}`,
      name: newPatientName,
      phone: newPatientPhone || "",
      email: "",
      dateOfBirth: new Date().toISOString(),
      isChild: false,
      teeth: [],
      services: [],
      balance: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.savePatient(newPatient);
    toast.success("Пациент создан");
    
    // Refresh patients list to include the new patient
    const updatedPatients = store.getPatients();
    setPatients(updatedPatients);
    
    // Automatically select the newly created patient
    setPatientId(newPatient.id);
    
    // Close dialogs and reset form
    setIsCreatingPatientDialogOpen(false);
    setPatientSearchOpen(false);
    setNewPatientName("");
    setNewPatientPhone("");
  };

  const handleCreateService = () => {
    if (!newServiceName.trim()) {
      toast.error("Введите название услуги");
      return;
    }
    const newService = {
      id: `service_${Date.now()}_${Math.random()}`,
      name: newServiceName.trim(),
      defaultPrice: 0,
    };
    store.saveService(newService);
    toast.success("Услуга создана");
    // Refresh services list
    setServices(store.getServices());
    // Add the new service to selected services immediately
    setSelectedServices([...selectedServices, { serviceId: newService.id, quantity: 1 }]);
    // Reset form and close
    setIsCreatingServiceDialogOpen(false);
    setNewServiceName("");
    setServiceSearchQuery("");
    setServiceSearchOpen(false);
  };

  // Organize services by category
  const servicesByCategory = useMemo(() => {
    const categories: Record<string, typeof services> = {
      therapeutic: [],
      prosthetic: [],
      surgical: [],
      implant: [],
      disposable: [],
      other: [],
    };
    
    services.forEach((service) => {
      if (service.id.startsWith("therapeutic_")) {
        categories.therapeutic.push(service);
      } else if (service.id.startsWith("prosthetic_")) {
        categories.prosthetic.push(service);
      } else if (service.id.startsWith("surgical_")) {
        categories.surgical.push(service);
      } else if (service.id.startsWith("implant_")) {
        categories.implant.push(service);
      } else if (service.id.startsWith("disposable_")) {
        categories.disposable.push(service);
      } else {
        categories.other.push(service);
      }
    });
    
    return categories;
  }, [services]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {appointment ? "Редактировать запись" : "Создать запись"}
          </DialogTitle>
        </DialogHeader>
        {isLoading && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <p className="mt-2 text-sm text-muted-foreground">Загрузка...</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4" style={{ opacity: isLoading ? 0.5 : 1, pointerEvents: isLoading ? 'none' : 'auto' }}>
          <div className="space-y-2">
            <Label>
              Пациент <span className="text-destructive">*</span>
            </Label>
            <Popover 
              open={patientSearchOpen} 
              onOpenChange={(open) => {
                setPatientSearchOpen(open);
                if (!open) {
                  // Reset to default view when popover closes
                  setIsCreatingPatient(false);
                  setNewPatientName("");
                  setNewPatientPhone("");
                  setNewPatientEmail("");
                }
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                  type="button"
                >
                  {patientId
                    ? patients.find((p) => p.id === patientId)?.name || "Выберите пациента"
                    : "Выберите или создайте пациента"}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-[450px] p-0 flex flex-col" 
                align="start" 
                style={{ 
                  maxHeight: '600px', 
                  display: 'flex', 
                  flexDirection: 'column' 
                }}
              >
                <Command className="flex flex-col" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CommandInput placeholder="Поиск пациента..." />
                  <CommandList className="flex-1 overflow-y-auto" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                    <CommandEmpty>
                      Пациент не найден
                    </CommandEmpty>
                    <CommandGroup>
                      {patients.map((patient) => (
                        <CommandItem
                          key={patient.id}
                          value={`${patient.name} ${patient.phone} ${patient.email}`}
                          onSelect={() => handlePatientSelect(patient.id)}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{patient.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {patient.phone} • {patient.email}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                  <div className="border-t p-2 bg-background sticky bottom-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsCreatingPatientDialogOpen(true);
                      }}
                      className="w-full"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Создать нового пациента
                    </Button>
                  </div>
                </Command>
              </PopoverContent>
            </Popover>
            {patientId && (
              <p className="text-xs text-muted-foreground">
                Выбран: {patients.find((p) => p.id === patientId)?.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="appointment-doctor">
              Врач <span className="text-destructive">*</span>
            </Label>
            <Select value={doctorId} onValueChange={setDoctorId} required>
              <SelectTrigger id="appointment-doctor">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id}>
                    {doctor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="appointment-start">
                Время начала <span className="text-destructive">*</span>
              </Label>
              <Input
                id="appointment-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="appointment-end">
                Время окончания <span className="text-destructive">*</span>
              </Label>
              <Input
                id="appointment-end"
                type="time"
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value);
                  // Update duration when end time is manually changed
                  if (startTime && e.target.value) {
                    const start = new Date(`2000-01-01T${startTime}`);
                    const end = new Date(`2000-01-01T${e.target.value}`);
                    if (end < start) {
                      end.setDate(end.getDate() + 1);
                    }
                    const diffMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
                    setDuration(diffMinutes);
                  }
                }}
                required
              />
            </div>
          </div>

          {/* Teeth Map */}
          {selectedPatient && (
            <div className="space-y-2 border-t pt-4">
              <Label>Зубная карта</Label>
              <ToothChart
                teeth={teeth}
                isChild={selectedPatient.isChild}
                onToothChange={setTeeth}
              />
            </div>
          )}

          {/* Services */}
          <div className="space-y-4 border-t pt-4">
            <div className="space-y-2">
              <Label>Услуги</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    placeholder="Поиск услуги..."
                    value={serviceSearchQuery}
                    onChange={(e) => {
                      setServiceSearchQuery(e.target.value);
                      setServiceSearchOpen(true);
                    }}
                    onFocus={() => {
                      setServiceSearchOpen(true);
                    }}
                    className="w-full"
                  />
                  {serviceSearchOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-[300px] overflow-auto">
                      <Command>
                        <CommandList>
                          {(() => {
                            const filtered = serviceSearchQuery 
                              ? services.filter((service) =>
                                  service.name.toLowerCase().includes(serviceSearchQuery.toLowerCase())
                                )
                              : services;
                            return filtered.length === 0 ? (
                              <CommandEmpty>
                                <div className="py-4 text-center">
                                  <p className="text-sm text-muted-foreground">
                                    Услуга не найдена
                                  </p>
                                </div>
                              </CommandEmpty>
                            ) : (
                              <CommandGroup>
                                {filtered.map((service) => {
                                  const isSelected = selectedServices.some((s) => s.serviceId === service.id);
                                  return (
                                    <CommandItem
                                      key={service.id}
                                      value={service.name}
                                      onSelect={() => {
                                        if (!isSelected) {
                                          setSelectedServices([...selectedServices, { serviceId: service.id, quantity: 1 }]);
                                        }
                                        setServiceSearchQuery("");
                                        setServiceSearchOpen(false);
                                      }}
                                    >
                                      <div className="flex flex-col w-full">
                                        <span className="font-medium">{service.name}</span>
                                        {service.defaultPrice > 0 && (
                                          <span className="text-xs text-muted-foreground">
                                            {service.defaultPrice} смн
                                          </span>
                                        )}
                                      </div>
                                    </CommandItem>
                                  );
                                })}
                              </CommandGroup>
                            );
                          })()}
                        </CommandList>
                      </Command>
                    </div>
                  )}
                </div>
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setNewServiceName(serviceSearchQuery || "");
                        setIsCreatingServiceDialogOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Добавить услугу</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Selected Services Summary */}
            {selectedServices.length > 0 && (
              <div className="mt-4 space-y-2">
                <Label>Выбранные услуги:</Label>
                <div className="space-y-2">
                  {selectedServices.map((vs) => {
                    const service = services.find((s) => s.id === vs.serviceId);
                    return (
                      <div
                        key={vs.serviceId}
                        className="flex items-center justify-between gap-2 p-2 bg-secondary rounded-lg text-sm"
                      >
                        <span className="flex-1">{service?.name || "Неизвестная услуга"}</span>
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`qty-${vs.serviceId}`} className="text-xs text-muted-foreground">
                            Количество:
                          </Label>
                          <Input
                            id={`qty-${vs.serviceId}`}
                            type="number"
                            min="1"
                            value={vs.quantity}
                            onChange={(e) => {
                              const qty = parseInt(e.target.value) || 1;
                              setSelectedServices(
                                selectedServices.map((s) =>
                                  s.serviceId === vs.serviceId ? { ...s, quantity: qty } : s
                                )
                              );
                            }}
                            className="w-20 h-8"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedServices(selectedServices.filter((s) => s.serviceId !== vs.serviceId));
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="appointment-cost">
              Стоимость
            </Label>
            <Input
              id="appointment-cost"
              type="number"
              step="0.01"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="appointment-notes">Заметки</Label>
            <Textarea
              id="appointment-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isLoading}>
              {appointment ? "Сохранить" : "Записать"}
            </Button>
          </div>
        </form>

        {/* Create Patient Dialog */}
        <Dialog open={isCreatingPatientDialogOpen} onOpenChange={setIsCreatingPatientDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Создать нового пациента</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-patient-name">
                  Имя <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="new-patient-name"
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  placeholder="ФИО"
                  required
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newPatientName) {
                      handleCreatePatient();
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-patient-phone">Мобильный телефон</Label>
                <Input
                  id="new-patient-phone"
                  value={newPatientPhone}
                  onChange={(e) => setNewPatientPhone(e.target.value)}
                  placeholder="Телефон"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newPatientName) {
                      handleCreatePatient();
                    }
                  }}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreatingPatientDialogOpen(false);
                    setNewPatientName("");
                    setNewPatientPhone("");
                  }}
                >
                  Отмена
                </Button>
                <Button
                  type="button"
                  onClick={handleCreatePatient}
                  disabled={!newPatientName}
                >
                  Создать
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Service Dialog */}
        <Dialog open={isCreatingServiceDialogOpen} onOpenChange={setIsCreatingServiceDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Создать новую услугу</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Название услуги</Label>
                <Input
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  placeholder="Название услуги"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreateService();
                    }
                  }}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreatingServiceDialogOpen(false);
                    setNewServiceName("");
                  }}
                >
                  Отмена
                </Button>
                <Button
                  type="button"
                  onClick={handleCreateService}
                >
                  Создать
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}

// Services Dialog
function ServicesDialog({
  services: initialServices,
}: {
  services: ReturnType<typeof store.getServices>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [services, setServices] = useState(initialServices);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName || !newServicePrice) {
      toast.error("Заполните все поля");
      return;
    }

    const service = {
      id: `service_${Date.now()}_${Math.random()}`,
      name: newServiceName,
      defaultPrice: parseFloat(newServicePrice) || 0,
    };

    store.saveService(service);
    setServices(store.getServices());
    setNewServiceName("");
    setNewServicePrice("");
    toast.success("Услуга добавлена");
  };

  const handleEditService = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    if (service) {
      setEditingServiceId(serviceId);
      setEditName(service.name);
      setEditPrice(service.defaultPrice.toString());
    }
  };

  const handleSaveEdit = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    if (service && editName && editPrice) {
      store.saveService({
        ...service,
        name: editName,
        defaultPrice: parseFloat(editPrice) || 0,
      });
      setServices(store.getServices());
      setEditingServiceId(null);
      toast.success("Услуга обновлена");
    }
  };

  const handleDeleteService = (serviceId: string) => {
    store.deleteService(serviceId);
    setServices(store.getServices());
    toast.success("Услуга удалена");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Услуги
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Управление услугами</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Add Service Form */}
          <form onSubmit={handleAddService} className="space-y-4 border-b pb-4">
            <h3 className="font-medium">Добавить услугу</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service-name">Название</Label>
                <Input
                  id="service-name"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  placeholder="Например: Пломбирование"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service-price">Цена по умолчанию (смн)</Label>
                <Input
                  id="service-price"
                  type="number"
                  step="0.01"
                  value={newServicePrice}
                  onChange={(e) => setNewServicePrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
            <Button type="submit" size="sm">
              Добавить
            </Button>
          </form>

          {/* Services List */}
          <div>
            <h3 className="font-medium mb-4">Список услуг</h3>
            {services.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Нет услуг. Добавьте первую услугу.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Название</TableHead>
                    <TableHead>Цена по умолчанию</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell>
                        {editingServiceId === service.id ? (
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full"
                          />
                        ) : (
                          service.name
                        )}
                      </TableCell>
                      <TableCell>
                        {editingServiceId === service.id ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            className="w-full"
                          />
                        ) : (
                          `${service.defaultPrice.toFixed(2)} смн`
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingServiceId === service.id ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingServiceId(null);
                                setEditName("");
                                setEditPrice("");
                              }}
                            >
                              Отмена
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSaveEdit(service.id)}
                            >
                              Сохранить
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditService(service.id)}
                            >
                              Редактировать
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                if (
                                  confirm(
                                    "Вы уверены, что хотите удалить эту услугу?"
                                  )
                                ) {
                                  handleDeleteService(service.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper function
function addMinutes(time: string, minutes: number): string {
  const [hours, mins] = time.split(":").map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60);
  const newMins = totalMinutes % 60;
  return `${String(newHours).padStart(2, "0")}:${String(newMins).padStart(2, "0")}`;
}

export default Schedule;
