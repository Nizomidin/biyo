import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  Clock,
  Filter,
  LocateFixed,
  RefreshCw,
  X,
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
import { Badge } from "@/components/ui/badge";
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
import { store, Doctor, Visit, VisitService, Patient, ToothStatus, Payment } from "@/lib/store";
import { format, addDays, startOfDay, parseISO, isSameDay } from "date-fns";

/**
 * Formats a UTC ISO datetime string to local time "HH:mm" format.
 * This ensures correct timezone conversion regardless of how the Date was created.
 */
const formatToLocalTime = (isoString: string): string => {
  const date = new Date(isoString);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Creates an ISO string from a date and time that correctly represents local time in UTC.
 * This fixes the timezone issue where local time was being sent as-is without proper UTC conversion.
 */
const createUTCISOString = (date: Date, hours: number, minutes: number): string => {
  const localDate = new Date(date);
  localDate.setHours(hours, minutes, 0, 0);
  return localDate.toISOString();
};
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
import { PageContainer } from "@/components/layout/PageContainer";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
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

const DEFAULT_STATUS_FILTERS: Visit["status"][] = ["scheduled", "completed"];
const STATUS_LABELS: Record<Visit["status"], string> = {
  scheduled: "Запланировано",
  completed: "Завершено",
  cancelled: "Отменено",
};
const MONEY_FORMATTER = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

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
  const isMobile = useIsMobile();
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

  const currentUser = store.getCurrentUser();
  const [doctorRefreshKey, setDoctorRefreshKey] = useState(0);
  const [doctorsRefreshKey, setDoctorsRefreshKey] = useState(0);
  const [visitsRefreshKey, setVisitsRefreshKey] = useState(0);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [activeStatusFilters, setActiveStatusFilters] = useState<Set<Visit["status"]>>(
    () => new Set(DEFAULT_STATUS_FILTERS)
  );
  const [selectedDoctorFilters, setSelectedDoctorFilters] = useState<string[]>([]);
  const scheduleContainerRef = useRef<HTMLDivElement | null>(null);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);

  const toggleStatusFilter = useCallback((status: Visit["status"]) => {
    setActiveStatusFilters((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  }, []);

  const toggleDoctorFilter = useCallback((doctorId: string) => {
    setSelectedDoctorFilters((prev) => {
      if (prev.includes(doctorId)) {
        return prev.filter((id) => id !== doctorId);
      }
      return [...prev, doctorId];
    });
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedDoctorFilters([]);
    setActiveStatusFilters(new Set<Visit["status"]>(DEFAULT_STATUS_FILTERS));
  }, []);

  const handleManualRefresh = useCallback(() => {
    setPatients(store.getPatients());
    setServices(store.getServices());
    setVisits(store.getVisits());
    setDoctorsRefreshKey((prev) => prev + 1);
    setVisitsRefreshKey((prev) => prev + 1);
    toast.success("Данные расписания обновлены");
  }, []);
  
  // Ensure non-admin users have a doctor profile
  useEffect(() => {
    if (!currentUser || currentUser.role === "admin") return;
    
    const ensureDoctorProfile = async () => {
      const doctors = store.getDoctors();
      const userDoctor = doctors.find((d) => d.userId === currentUser.id);
      // If no doctor found by userId, try by email
      if (!userDoctor) {
        const doctorByEmail = doctors.find((d) => d.email === currentUser.email && d.clinicId === currentUser.clinicId);
        if (doctorByEmail) {
          // Link existing doctor to user
          doctorByEmail.userId = currentUser.id;
          await store.saveDoctor(doctorByEmail);
          setDoctorRefreshKey(prev => prev + 1); // Trigger re-render
        } else {
          // Create new doctor for user
          const doctorColors = ["blue", "emerald", "red", "yellow", "purple"];
          const randomColor = doctorColors[Math.floor(Math.random() * doctorColors.length)];

          // Don't provide id - let backend generate it
          await store.saveDoctor({
            name: currentUser.email.split("@")[0],
            specialization: currentUser.proficiency || undefined,
            email: currentUser.email,
            userId: currentUser.id,
            color: randomColor,
            clinicId: currentUser.clinicId,
          } as Doctor);
          setDoctorRefreshKey(prev => prev + 1); // Trigger re-render
        }
      }
    };
    
    ensureDoctorProfile();
  }, [currentUser?.id]); // Only depend on user ID to avoid unnecessary re-runs
  
  // Show all doctors from the clinic - filtering is done via UI filters
  const doctors = useMemo(() => {
    return allDoctors;
  }, [allDoctors]);
  
  // Fetch initial data and refresh periodically
  useEffect(() => {
    const clinicId = store.getCurrentClinicId();
    if (!clinicId) return;

    const fetchData = async () => {
      try {
        const [fetchedDoctors, fetchedPatients, fetchedServices, fetchedVisits] = await Promise.all([
          store.fetchDoctors(clinicId),
          store.fetchPatients(clinicId),
          store.fetchServices(clinicId),
          store.fetchVisits(clinicId),
        ]);
        setAllDoctors(fetchedDoctors);
        setPatients(fetchedPatients);
        setServices(fetchedServices);
        setVisits(fetchedVisits);
        // Trigger memo recalculation
        setDoctorsRefreshKey(prev => prev + 1);
        setVisitsRefreshKey(prev => prev + 1);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    // Initial fetch
    fetchData();
    
    // Refresh every 5 seconds to catch changes from other users
    const interval = setInterval(fetchData, 5000);
    
    // Listen to custom events for same-tab updates
    const handleDataUpdate = (event: CustomEvent) => {
      const updateType = event.detail?.type;
      if (!updateType || updateType === 'doctors') {
        setAllDoctors(store.getDoctors());
        setDoctorsRefreshKey(prev => prev + 1);
      }
      if (!updateType || updateType === 'patients') {
        setPatients(store.getPatients());
      }
      if (!updateType || updateType === 'services') {
        setServices(store.getServices());
      }
      if (!updateType || updateType === 'visits') {
        setVisits(store.getVisits());
        setVisitsRefreshKey(prev => prev + 1);
      }
    };
    
    window.addEventListener('biyo-data-updated', handleDataUpdate as EventListener);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('biyo-data-updated', handleDataUpdate as EventListener);
    };
  }, []);

  const selectedDateStr = format(selectedDate, "d MMMM yyyy", { locale: ru });

  // Get appointments for selected date
  // For non-admin users, only show appointments for their doctor
  const baseAppointments = useMemo(() => {
    const currentVisits = store.getVisits(); // Always read fresh visits from store
    const now = new Date();
    const dayStart = startOfDay(selectedDate);
    const dayEnd = addDays(dayStart, 1);
    
    // Get list of visible doctor IDs
    const visibleDoctorIds = doctors.map((d) => d.id);

    return currentVisits
      .filter((v) => {
        const visitStart = parseISO(v.startTime);
        // Filter by date and only show appointments for visible doctors
        const isSameSelectedDay =
          visitStart >= dayStart &&
          visitStart < dayEnd &&
          visibleDoctorIds.includes(v.doctorId);

        return isSameSelectedDay;
      })
      .map((visit) => {
        const patient = patients.find((p) => p.id === visit.patientId);
        const doctor = doctors.find((d) => d.id === visit.doctorId);
        const start = parseISO(visit.startTime);
        const end = parseISO(visit.endTime);
        const duration = (end.getTime() - start.getTime()) / (1000 * 60); // minutes

        let status = visit.status;
        if (status === "scheduled" && end < now) {
          status = "completed";
        }

        return {
          id: visit.id,
          doctorId: visit.doctorId,
          patientName: patient?.name || "Неизвестный",
          startTime: format(start, "HH:mm"),
          duration,
          color: doctor?.color || "blue",
          visit: { ...visit, status },
        } as AppointmentDisplay;
      });
  }, [selectedDate, doctors, patients, visitsRefreshKey, doctorsRefreshKey]); // Add visits and refresh key to trigger updates

  const appointments = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    const hasDoctorFilters = selectedDoctorFilters.length > 0;
    const hasStatusFilters = activeStatusFilters.size > 0;

    return baseAppointments.filter((appointment) => {
      if (hasDoctorFilters && !selectedDoctorFilters.includes(appointment.doctorId)) {
        return false;
      }

      if (hasStatusFilters && !activeStatusFilters.has(appointment.visit.status)) {
        return false;
      }

      if (search) {
        const doctor = doctors.find((d) => d.id === appointment.doctorId);
        const haystack = [
          appointment.patientName,
          doctor?.name ?? "",
          formatToLocalTime(appointment.visit.startTime),
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(search)) {
          return false;
        }
      }

      return true;
    });
  }, [baseAppointments, activeStatusFilters, selectedDoctorFilters, searchTerm, doctors]);

  const scheduleStats = useMemo(() => {
    const total = baseAppointments.length;
    const scheduled = baseAppointments.filter((appt) => appt.visit.status === "scheduled").length;
    const completed = baseAppointments.filter((appt) => appt.visit.status === "completed").length;
    const cancelled = baseAppointments.filter((appt) => appt.visit.status === "cancelled").length;

    const totalRevenue = baseAppointments.reduce((sum, appt) => sum + (appt.visit.cost || 0), 0);
    const totalPaid = baseAppointments.reduce(
      (sum, appt) =>
        sum +
        (appt.visit.payments?.reduce((acc, payment) => acc + payment.amount, 0) || 0),
      0
    );
    const occupiedMinutes = baseAppointments.reduce((sum, appt) => sum + appt.duration, 0);
    const totalAvailableMinutes = doctors.length * timeSlots.length * 30;
    const occupancy =
      totalAvailableMinutes > 0
        ? Math.min(100, Math.round((occupiedMinutes / totalAvailableMinutes) * 100))
        : 0;

    return {
      total,
      scheduled,
      completed,
      cancelled,
      totalRevenue,
      totalPaid,
      occupancy,
      occupiedMinutes,
      totalAvailableMinutes,
    };
  }, [baseAppointments, doctors.length]);

  const outstandingBalance = useMemo(
    () => Math.max(scheduleStats.totalRevenue - scheduleStats.totalPaid, 0),
    [scheduleStats.totalRevenue, scheduleStats.totalPaid]
  );

  const isStatusFilterDefault = useMemo(() => {
    if (activeStatusFilters.size !== DEFAULT_STATUS_FILTERS.length) {
      return false;
    }
    return DEFAULT_STATUS_FILTERS.every((status) => activeStatusFilters.has(status));
  }, [activeStatusFilters]);

  const filtersApplied =
    searchTerm.trim().length > 0 ||
    selectedDoctorFilters.length > 0 ||
    !isStatusFilterDefault;

  const scrollToCurrentTime = useCallback(() => {
    if (!scheduleContainerRef.current) {
      return;
    }

    if (!isSameDay(new Date(), selectedDate)) {
      scheduleContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const now = new Date();
    const minutesSinceStart = now.getHours() * 60 + now.getMinutes() - 7 * 60;
    if (minutesSinceStart < 0) {
      scheduleContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const top = Math.max((minutesSinceStart / 30) * SLOT_HEIGHT - 160, 0);
    scheduleContainerRef.current.scrollTo({
      top,
      behavior: "smooth",
    });
  }, [selectedDate]);

  useEffect(() => {
    if (!autoScrollEnabled) {
      return;
    }
    scrollToCurrentTime();
  }, [autoScrollEnabled, currentTime, selectedDate, scrollToCurrentTime]);

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

  const handleDeleteAppointment = async () => {
    if (deleteAppointmentId) {
      try {
        await store.deleteVisit(deleteAppointmentId);
        // Refresh visits to show the deletion immediately
        const clinicId = store.getCurrentClinicId();
        if (clinicId) {
          await store.fetchVisits(clinicId);
        }
        setVisits(store.getVisits());
        setVisitsRefreshKey(prev => prev + 1);
        toast.success("Запись удалена");
        setDeleteAppointmentId(null);
      } catch (error) {
        console.error('Failed to delete visit:', error);
        toast.error("Не удалось удалить запись");
      }
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

  const handleDrop = async (e: React.DragEvent, targetDoctorId: string, targetTime: string) => {
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

    await store.saveVisit(updatedVisit);
    // Refresh visits to show the update
    setVisits(store.getVisits());
    setVisitsRefreshKey(prev => prev + 1);
    toast.success("Запись перемещена");
    setDraggedAppointment(null);
  };

  const SLOT_HEIGHT = 32; // Height of each 30-minute slot in pixels
  const TIME_COLUMN_WIDTH = isMobile ? 72 : 100;
  const DOCTOR_COLUMN_MIN_WIDTH = isMobile ? 160 : 200;
  const scheduleMaxHeight = isMobile ? "calc(100vh - 260px)" : "calc(100vh - 320px)";
  const headerOffset = isMobile ? 56 : 58;

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

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 30_000);

    return () => clearInterval(interval);
  }, []);

  const renderCurrentTimeIndicator = () => {
    if (!isSameDay(currentTime, selectedDate)) {
      return null;
    }

    const minutesSinceStart =
      currentTime.getHours() * 60 +
      currentTime.getMinutes() -
      7 * 60;

    if (minutesSinceStart < 0 || minutesSinceStart > 16 * 60) {
      return null;
    }

    const position = (minutesSinceStart / 30) * SLOT_HEIGHT;
    const formattedTime = format(currentTime, "HH:mm");

    return (
      <div
        className="absolute inset-x-0 pointer-events-none z-30"
        style={{ top: `${position + headerOffset}px` }}
      >
        <div className="relative">
          <div className="h-0.5 bg-primary"></div>
          <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary bg-background px-3 py-1 text-xs font-semibold text-primary shadow-sm">
            Сейчас {formattedTime}
          </div>
        </div>
      </div>
    );
  };

  return (
    <PageContainer contentClassName="space-y-4 sm:space-y-6">
      <Card className="bg-card p-4 sm:p-6 space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">Расписание</h1>
              <p className="text-sm text-muted-foreground">
                Управляйте приёмами и загрузкой врачей в реальном времени.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
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
                onSaved={async () => {
                  // Refresh doctors list after save
                  const clinicId = store.getCurrentClinicId();
                  if (clinicId) {
                    try {
                      const updatedDoctors = await store.fetchDoctors(clinicId);
                      setAllDoctors(updatedDoctors);
                    } catch (error) {
                      console.error('Failed to refresh doctors:', error);
                    }
                  }
                }}
              />
              {currentUser?.role === "admin" && (
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => setIsAddDoctorOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Врач
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Добавить врача</p>
                  </TooltipContent>
                </Tooltip>
              )}
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    onClick={handleManualRefresh}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Обновить
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Принудительно обновить данные</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <Button
                    variant={autoScrollEnabled ? "default" : "outline"}
                    size="sm"
                    className="gap-2"
                    onClick={() => setAutoScrollEnabled((prev) => !prev)}
                  >
                    <Clock className="h-4 w-4" />
                    {autoScrollEnabled ? "Автопрокрутка" : "Ручной режим"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Прокручивать расписание к текущему времени автоматически</p>
                </TooltipContent>
              </Tooltip>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  setAutoScrollEnabled(false);
                  scrollToCurrentTime();
                }}
              >
                <LocateFixed className="h-4 w-4" />
                Сейчас
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Записи" value={scheduleStats.total} badge={scheduleStats.total}>
              {scheduleStats.scheduled} запланировано на {selectedDateStr}
            </StatCard>
            <StatCard label="Статусы" value={scheduleStats.completed} badge={scheduleStats.cancelled} badgeLabel="Отменено">
              Завершено записей: {scheduleStats.completed}
            </StatCard>
            <StatCard
              label="Выручка"
              value={`${MONEY_FORMATTER.format(scheduleStats.totalRevenue)} смн`}
              badge={`${MONEY_FORMATTER.format(scheduleStats.totalPaid)} смн`}
              badgeLabel="Оплачено"
            >
              {outstandingBalance > 0
                ? `Остаток к оплате: ${MONEY_FORMATTER.format(outstandingBalance)} смн`
                : "Все оплачено"}
            </StatCard>
            <StatCard label="Загрузка" value={`${scheduleStats.occupancy}%`} badge={`${scheduleStats.occupancy}%`}>
              {scheduleStats.totalAvailableMinutes > 0
                ? `${Math.round(scheduleStats.occupiedMinutes / 60)} из ${Math.round(
                    scheduleStats.totalAvailableMinutes / 60
                  )} часов занято`
                : "Нет доступных слотов"}
            </StatCard>
          </div>

          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-start">
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
                    className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-2"
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
              <Button variant="outline" size="sm" onClick={() => navigateDate("today")}>
                Сегодня
              </Button>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
              <div className="relative w-full sm:w-auto sm:min-w-[220px]">
                <Input
                  placeholder="Поиск по пациенту или врачу..."
                  className="w-full pr-9 sm:w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setSearchTerm("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-between gap-2 sm:w-auto sm:justify-center">
                    <Filter className="h-4 w-4" />
                    {selectedDoctorFilters.length > 0
                      ? `Врачи (${selectedDoctorFilters.length})`
                      : "Все врачи"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end">
                  <DropdownMenuLabel>Фильтр по врачам</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {doctors.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      Нет доступных врачей
                    </div>
                  ) : (
                    doctors.map((doctor) => (
                      <DropdownMenuCheckboxItem
                        key={doctor.id}
                        checked={selectedDoctorFilters.includes(doctor.id)}
                        onCheckedChange={() => toggleDoctorFilter(doctor.id)}
                      >
                        {doctor.name}
                      </DropdownMenuCheckboxItem>
                    ))
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      setSelectedDoctorFilters([]);
                    }}
                  >
                    Показать всех
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-between gap-2 sm:w-auto sm:justify-center">
                    <Filter className="h-4 w-4" />
                    Статус
                    {!isStatusFilterDefault && (
                      <Badge variant="secondary" className="ml-1">
                        {activeStatusFilters.size}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>Статусы записей</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {(Object.keys(STATUS_LABELS) as Visit["status"][]).map((status) => (
                    <DropdownMenuCheckboxItem
                      key={status}
                      checked={activeStatusFilters.has(status)}
                      onCheckedChange={() => toggleStatusFilter(status)}
                    >
                      {STATUS_LABELS[status]}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      setActiveStatusFilters(new Set<Visit["status"]>(DEFAULT_STATUS_FILTERS));
                    }}
                  >
                    Сбросить фильтр
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {filtersApplied && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="w-full justify-center text-muted-foreground hover:text-foreground sm:w-auto"
                >
                  Очистить
                </Button>
              )}
            </div>
          </div>

          {doctors.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="mb-4">
                {currentUser?.role === "admin" 
                  ? "Нет врачей. Добавьте первого врача."
                  : "Врач не найден. Обратитесь к администратору для создания вашего профиля врача."}
              </p>
              {currentUser?.role === "admin" && (
                <Button onClick={() => setIsAddDoctorOpen(true)}>
                  Добавить врача
                </Button>
              )}
            </div>
          ) : (
            <div
              ref={scheduleContainerRef}
              className="relative w-full overflow-x-auto overflow-y-auto rounded-xl border border-border/60"
              style={{ maxHeight: scheduleMaxHeight }}
              onPointerDown={() => setAutoScrollEnabled(false)}
            >
              {renderCurrentTimeIndicator()}
              <div
                className="relative grid min-w-max gap-0"
                style={{
                  gridTemplateColumns: `${TIME_COLUMN_WIDTH}px repeat(${doctors.length}, minmax(${DOCTOR_COLUMN_MIN_WIDTH}px, 1fr))`,
                }}
              >
                {/* Header row: Time label + Doctor headers */}
                <div
                  className="sticky left-0 top-0 z-20 flex h-[56px] items-center border-b border-r bg-card py-2 px-2 text-sm font-medium text-muted-foreground"
                  style={{ width: `${TIME_COLUMN_WIDTH}px` }}
                >
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
                      {currentUser?.role === "admin" && (
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
                    )}
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
                    <div
                      className="sticky left-0 z-10 flex h-[32px] items-center border-t border-r border-border bg-card py-1 px-2 text-[11px] font-medium text-muted-foreground sm:text-xs"
                      style={{ width: `${TIME_COLUMN_WIDTH}px` }}
                    >
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
                const doctorCount = Math.max(doctors.length, 1);
                // Calculate position to match grid columns exactly
                // Grid: TIME_COLUMN_WIDTH (time) + repeat(doctorCount, 1fr)
                const margin = isMobile ? 1 : 2; // Small margin from borders (in pixels)
                const columnWidth = `calc((100% - ${TIME_COLUMN_WIDTH}px) / ${doctorCount} - ${margin * 2}px)`;
                // Position: TIME_COLUMN_WIDTH (time column) + (columnWidth * doctorIndex) + margin
                const leftOffset = `calc(${TIME_COLUMN_WIDTH}px + (100% - ${TIME_COLUMN_WIDTH}px) * ${doctorIndex} / ${doctorCount} + ${margin}px)`;

              const doctor = doctors.find((d) => d.id === appointment.doctorId);
              const appointmentColor = doctor?.color || "blue";

              return (
                <div
                  key={appointment.id}
                  className={`absolute rounded-lg p-2 text-white text-xs font-medium cursor-move hover:opacity-90 transition-opacity group shadow-md ${
                    draggedAppointment?.id === appointment.id ? "opacity-50" : ""
                  }`}
                  style={{
                    top: `${topPosition + headerOffset + margin}px`,
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
              {appointments.length === 0 && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="rounded-lg border border-dashed border-border bg-background/95 px-6 py-4 text-center shadow-sm">
                    <p className="text-sm font-medium">
                      {filtersApplied ? "Нет записей по выбранным фильтрам" : "На эту дату пока нет записей"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {filtersApplied
                        ? "Попробуйте изменить фильтры или выбрать другую дату."
                        : "Нажмите на свободный слот, чтобы создать запись."}
                    </p>
                  </div>
                </div>
              )}
          </div>
          )}
      </Card>

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
          onPatientCreated={async () => {
            // Refresh patients list after creation
            const clinicId = store.getCurrentClinicId();
            if (clinicId) {
              try {
                const updatedPatients = await store.fetchPatients(clinicId);
                setPatients(updatedPatients);
              } catch (error) {
                console.error('Failed to refresh patients:', error);
              }
            }
          }}
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
              onClick={async () => {
                if (deletingDoctorId) {
                  try {
                    await store.deleteDoctor(deletingDoctorId);
                    toast.success("Врач удален");
                    setDeletingDoctorId(null);
                    // Refresh doctors
                    const clinicId = store.getCurrentClinicId();
                    if (clinicId) {
                      await store.fetchDoctors(clinicId);
                    }
                    setDoctors(store.getDoctors());
                  } catch (error) {
                    console.error('Failed to delete doctor:', error);
                    toast.error("Не удалось удалить врача");
                  }
                }
              }}
              className="bg-destructive text-destructive-foreground"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
};

// Add/Edit Doctor Dialog
function AddDoctorDialog({
  open,
  onOpenChange,
  doctor,
  onDelete,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctor?: Doctor | null;
  onDelete?: (doctorId: string) => void;
  onSaved?: () => void;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!name || !name.trim()) {
      toast.error("Введите имя врача");
      return;
    }

    // Validate email format if provided
    if (email && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Введите корректный email адрес");
      return;
    }

    const clinicId = doctor?.clinicId ?? store.getCurrentClinicId();
    if (!clinicId) {
      toast.error("Не удалось определить клинику. Повторите попытку после входа.");
      return;
    }

    // For updates use existing id, for new doctors don't provide id
    const doctorData: Doctor = {
      ...(doctor?.id ? { id: doctor.id } : {}),
      name: name.trim(),
      specialization: specialization?.trim() || undefined,
      email: email?.trim() || undefined,
      phone: phone?.trim() || undefined,
      color,
      clinicId,
    } as Doctor;

    try {
      await store.saveDoctor(doctorData);
      toast.success(doctor ? "Врач обновлен" : "Врач добавлен");

      // Reset form
      if (!doctor) {
        setName("");
        setSpecialization("");
        setEmail("");
        setPhone("");
        setColor("blue");
      }
      // Trigger parent refresh
      if (onSaved) {
        onSaved();
      }
      // Close dialog
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save doctor:', error);
      toast.error("Не удалось сохранить врача. Проверьте подключение к серверу.");
    }
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
  onPatientCreated,
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
  onPatientCreated?: () => void;
}) {
  const [patients, setPatients] = useState(initialPatients);
  const [services, setServices] = useState(initialServices);
  const formatAmountForInput = (value?: number) =>
    value === undefined || value === null ? "" : Number(value.toFixed(2)).toString();
  const parseMoney = (value: string) => {
    if (!value) return 0;
    const normalized = value.replace(",", ".").replace(/\s+/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parseFloat(parsed.toFixed(2)) : 0;
  };
  
  // Refresh patients and services list when dialog opens (only once)
  useEffect(() => {
    if (open) {
      setPatients(store.getPatients());
      setServices(store.getServices());
    }
  }, [open]); // Only depend on open, not on initialServices which changes constantly
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
      ? formatToLocalTime(appointment.startTime)
      : selectedSlot.time
  );
  const [endTime, setEndTime] = useState(
    appointment
      ? formatToLocalTime(appointment.endTime)
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
  const [totalPrice, setTotalPrice] = useState(() => {
    if (appointment) {
      return formatAmountForInput(appointment.cost);
    }
    return "";
  });
  const [cashAmount, setCashAmount] = useState(() => {
    if (appointment) {
      if (appointment.cashAmount !== undefined) {
        return formatAmountForInput(appointment.cashAmount);
      }
      const cashPayment = appointment.payments?.find((payment) => payment.method === "cash");
      if (cashPayment) {
        return formatAmountForInput(cashPayment.amount);
      }
    }
    return "";
  });
  const [ewalletAmount, setEwalletAmount] = useState(() => {
    if (appointment) {
      if (appointment.ewalletAmount !== undefined) {
        return formatAmountForInput(appointment.ewalletAmount);
      }
      const walletPayment = appointment.payments?.find((payment) => payment.method === "ewallet");
      if (walletPayment) {
        return formatAmountForInput(walletPayment.amount);
      }
    }
    return "";
  });
  const totalPaid = useMemo(() => {
    const cash = parseMoney(cashAmount);
    const wallet = parseMoney(ewalletAmount);
    return parseFloat((cash + wallet).toFixed(2));
  }, [cashAmount, ewalletAmount]);
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
    if (!open) {
      setIsLoading(false);
      return;
    }

    if (appointment) {
      setIsLoading(true);
      // Use setTimeout to ensure patients array is loaded
      const timeoutId = setTimeout(() => {
        const patient = patients.find((p) => p.id === appointment.patientId);
        const appointmentStart = formatToLocalTime(appointment.startTime);
        const appointmentEnd = formatToLocalTime(appointment.endTime);
        
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
        const cashPayment = appointment.payments?.find((payment) => payment.method === "cash");
        const walletPayment = appointment.payments?.find((payment) => payment.method === "ewallet");
        setTotalPrice(formatAmountForInput(appointment.cost));
        setCashAmount(() => {
          if (appointment.cashAmount !== undefined) {
            return formatAmountForInput(appointment.cashAmount);
          }
          if (cashPayment) {
            return formatAmountForInput(cashPayment.amount);
          }
          return "";
        });
        setEwalletAmount(() => {
          if (appointment.ewalletAmount !== undefined) {
            return formatAmountForInput(appointment.ewalletAmount);
          }
          if (walletPayment) {
            return formatAmountForInput(walletPayment.amount);
          }
          return "";
        });
        setNotes(appointment.notes || "");
        setIsLoading(false);
      }, 150);
      
      return () => clearTimeout(timeoutId);
    } else {
      // Reset for new appointment
      const slotTime = selectedSlot.time;
      setPatientId("");
      setDoctorId(selectedSlot.doctorId);
      setStartTime(slotTime);
      setEndTime(addMinutes(slotTime, 30));
      setDuration(30); // Default 30 minutes
        setSelectedServices([]);
        setTeeth([]);
        setTotalPrice("");
        setCashAmount("");
        setEwalletAmount("");
        setNotes("");
        setIsLoading(false);
    }
    // Use more specific dependencies to prevent infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointment?.id, open, selectedSlot?.doctorId, selectedSlot?.time]);

  // Auto-fill total price when services are selected (only if total price is empty and not editing)
  useEffect(() => {
    if (
      selectedServices.length > 0 &&
      !appointment &&
      !totalPrice
    ) {
      const defaultTotal = selectedServices.reduce((sum, vs) => {
        const service = services.find((s) => s.id === vs.serviceId);
        return sum + (service?.defaultPrice || 0) * vs.quantity;
      }, 0);
      if (defaultTotal > 0) {
        setTotalPrice(formatAmountForInput(defaultTotal));
      }
    }
  }, [selectedServices, appointment, totalPrice, services]);

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
        await store.savePatient(updatedPatient);
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

    const totalPriceValue = parseMoney(totalPrice);
    if (!totalPrice || totalPriceValue <= 0) {
      toast.error("Укажите корректную общую стоимость визита");
      setIsLoading(false);
      return;
    }
    const clinicId = store.getCurrentClinicId();
    if (!clinicId) {
      toast.error("Не удалось определить клинику. Повторите попытку после входа.");
      setIsLoading(false);
      return;
    }
    const cash = parseMoney(cashAmount);
    const wallet = parseMoney(ewalletAmount);
    const nowIso = new Date().toISOString();

    // For updates use existing id, for new visits don't provide id
    const visit: Visit = {
      ...(appointment?.id ? { id: appointment.id } : {}),
      patientId,
      doctorId,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      services: servicesWithTeeth,
      cost: totalPriceValue,
      notes,
      status: appointment?.status || "scheduled",
      payments: [], // Payments are managed separately via PaymentService
      treatedTeeth: treatedTeethNumbers.length > 0 ? treatedTeethNumbers : undefined,
      createdAt: appointment?.createdAt || nowIso,
      cashAmount: cash,
      ewalletAmount: wallet,
      clinicId,
    } as Visit;

    try {
      const savedVisit = await store.saveVisit(visit);

      // Handle payments after visit is saved
      if (cash > 0 || wallet > 0) {
        const existingCashPayment = appointment?.payments?.find((p) => p.method === "cash");
        const existingWalletPayment = appointment?.payments?.find((p) => p.method === "ewallet");

        // Add cash payment if needed
        if (cash > 0 && !existingCashPayment) {
          await store.addPayment(savedVisit.id, cash, "cash");
        }

        // Add ewallet payment if needed
        if (wallet > 0 && !existingWalletPayment) {
          await store.addPayment(savedVisit.id, wallet, "ewallet");
        }
      }

      // Update patient balance
      const refreshedPatients = store.getPatients();
      const patient = refreshedPatients.find((p) => p.id === patientId);
      if (patient) {
        patient.balance = store.calculatePatientBalance(patientId);
        await store.savePatient(patient);
      }

      toast.success(appointment ? "Запись обновлена" : "Запись создана");
      setIsLoading(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving visit:', error);
      toast.error("Ошибка при сохранении записи");
      setIsLoading(false);
    }
  };

  const handlePatientSelect = (patientId: string) => {
    setPatientId(patientId);
    setPatientSearchOpen(false);
    // Don't automatically open patient card
    // if (patientId) {
    //   onPatientSelect(patientId);
    // }
  };

  const handleCreatePatient = async () => {
    // Validate required fields
    if (!newPatientName || !newPatientName.trim()) {
      toast.error("Введите имя пациента");
      return;
    }
    
    const clinicId = store.getCurrentClinicId();
    if (!clinicId) {
      toast.error("Не удалось определить клинику. Повторите попытку после входа.");
      return;
    }
    
    // Don't provide id - let backend generate it
    const newPatientData = {
      name: newPatientName.trim(),
      phone: newPatientPhone?.trim() || "",
      email: "",
      dateOfBirth: new Date().toISOString(),
      isChild: false,
      teeth: [],
      services: [],
      balance: 0,
      clinicId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Patient;
    try {
      const savedPatient = await store.savePatient(newPatientData);
      toast.success("Пациент создан");
      
      // Refresh patients list from API to include the new patient
      const clinicId = store.getCurrentClinicId();
      if (clinicId) {
        try {
          const updatedPatients = await store.fetchPatients(clinicId);
          setPatients(updatedPatients);
        } catch (error) {
          console.error('Failed to refresh patients:', error);
          // Fallback to cache if API fails
          setPatients(store.getPatients());
        }
      }
      
      // Trigger parent refresh
      if (onPatientCreated) {
        await onPatientCreated();
      }
      
      // Automatically select the newly created patient
      setPatientId(savedPatient.id);
      
      // Close dialogs and reset form
      setIsCreatingPatientDialogOpen(false);
      setPatientSearchOpen(false);
      setNewPatientName("");
      setNewPatientPhone("");
    } catch (error) {
      console.error('Failed to create patient:', error);
      toast.error("Не удалось создать пациента. Проверьте подключение к серверу.");
    }
  };

  const handleCreateService = async () => {
    if (!newServiceName.trim()) {
      toast.error("Введите название услуги");
      return;
    }
    const clinicId = store.getCurrentClinicId();
    if (!clinicId) {
      toast.error("Не удалось определить клинику. Повторите попытку после входа.");
      return;
    }
    // Don't provide id - let backend generate it
    const savedService = await store.saveService({
      name: newServiceName.trim(),
      defaultPrice: 0,
      clinicId,
    } as Service);
    toast.success("Услуга создана");
    // Refresh services list
    setServices(store.getServices());
    // Add the new service to selected services using the server-generated id
    setSelectedServices([...selectedServices, { serviceId: savedService.id, quantity: 1 }]);
    // Reset form and close
    setIsCreatingServiceDialogOpen(false);
    setNewServiceName("");
    setServiceSearchQuery("");
    setServiceSearchOpen(false);
  };

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
                  setNewPatientName("");
                  setNewPatientPhone("");
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
            <Select 
              value={doctorId} 
              onValueChange={setDoctorId} 
              required
              disabled={doctors.length === 1}
            >
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
            {doctors.length === 1 && (
              <p className="text-xs text-muted-foreground">
                Только ваш профиль врача доступен
              </p>
            )}
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

          <div className="space-y-4">
            <div className="space-y-3 border-b pb-4">
              <div className="space-y-2">
                <Label htmlFor="total-price" className="text-sm font-medium">
                  Общая стоимость визита <span className="text-destructive">*</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  Введите общую стоимость всех услуг за этот визит
                </p>
                <Input
                  id="total-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={totalPrice}
                  onChange={(e) => setTotalPrice(e.target.value)}
                  placeholder="Введите общую стоимость"
                  className="text-base"
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <Label className="text-sm font-medium">Оплата</Label>
              <p className="text-xs text-muted-foreground">
                Укажите, сколько уже было оплачено по этому визиту (если оплата уже была произведена)
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="payment-cash" className="text-xs font-medium">
                    Наличные
                  </Label>
                  <Input
                    id="payment-cash"
                    type="number"
                    step="0.01"
                    min="0"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="payment-ewallet" className="text-xs font-medium">
                    Электронный кошелёк
                  </Label>
                  <Input
                    id="payment-ewallet"
                    type="number"
                    step="0.01"
                    min="0"
                    value={ewalletAmount}
                    onChange={(e) => setEwalletAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm">
                <span className="text-muted-foreground">Всего оплачено</span>
                <span className="font-medium">{totalPaid.toFixed(2)} смн</span>
              </div>
              {totalPrice && (
                <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Остаток к оплате</span>
                  <span className={`font-medium ${parseMoney(totalPrice) - totalPaid > 0 ? "text-orange-500" : ""}`}>
                    {(parseMoney(totalPrice) - totalPaid).toFixed(2)} смн
                  </span>
                </div>
              )}
            </div>
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

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName || !newServicePrice) {
      toast.error("Заполните все поля");
      return;
    }

    const clinicId = store.getCurrentClinicId();
    if (!clinicId) {
      toast.error("Не удалось определить клинику. Повторите попытку после входа.");
      return;
    }

    // Don't provide id - let backend generate it
    await store.saveService({
      name: newServiceName,
      defaultPrice: parseFloat(newServicePrice) || 0,
      clinicId,
    } as Service);
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

  const handleSaveEdit = async (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    if (service && editName && editPrice) {
      await store.saveService({
        ...service,
        name: editName,
        defaultPrice: parseFloat(editPrice) || 0,
      });
      setServices(store.getServices());
      setEditingServiceId(null);
      toast.success("Услуга обновлена");
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      await store.deleteService(serviceId);
      const clinicId = store.getCurrentClinicId();
      if (clinicId) {
        await store.fetchServices(clinicId);
      }
      setServices(store.getServices());
      toast.success("Услуга удалена");
    } catch (error) {
      console.error('Failed to delete service:', error);
      toast.error("Не удалось удалить услугу");
    }
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

function StatCard({
  label,
  value,
  badge,
  badgeLabel,
  children,
}: {
  label: string;
  value: string | number;
  badge?: string | number;
  badgeLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
      <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <span>{label}</span>
        {badge !== undefined && (
          <Badge variant="outline" className="font-medium">
            {badgeLabel ? `${badgeLabel}: ${badge}` : badge}
          </Badge>
        )}
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {children && <p className="mt-1 text-xs text-muted-foreground">{children}</p>}
    </div>
  );
}
