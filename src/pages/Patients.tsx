import { useState, useMemo, useEffect } from "react";
import { Search, Plus, Phone, Mail, Trash2, Upload, File, Eye, Edit2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ToothChart } from "@/components/ToothChart";
import { store, Patient, ToothStatus, VisitService, Payment, Visit, PatientFile } from "@/lib/store";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";
import { PageContainer } from "@/components/layout/PageContainer";

const formatAmountForInput = (value?: number) =>
  value === undefined || value === null
    ? ""
    : Number(value.toFixed(2)).toString();

const parseAmountInput = (
  value: string,
  treatEmptyAsZero = true
): number | null => {
  if (!value || !value.trim()) {
    return treatEmptyAsZero ? 0 : null;
  }
  const normalized = value.replace(",", ".").replace(/\s+/g, "");
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return parseFloat(parsed.toFixed(2));
};

function normalizeTeeth(teeth: ToothStatus[] = []): ToothStatus[] {
  return [...teeth]
    .map(({ toothNumber, status }) => ({ toothNumber, status }))
    .sort((a, b) => a.toothNumber - b.toothNumber);
}

type FilterType = "debt" | "untreated" | "children" | "adults";

const Patients = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Set<FilterType>>(new Set());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch initial data and refresh periodically to sync with other users
  useEffect(() => {
    const clinicId = store.getCurrentClinicId();
    if (!clinicId) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [fetchedPatients, fetchedServices, fetchedVisits] = await Promise.all([
          store.fetchPatients(clinicId),
          store.fetchServices(clinicId),
          store.fetchVisits(clinicId),
        ]);
        setPatients(fetchedPatients);
        setServices(fetchedServices);
        setVisits(fetchedVisits);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchData();
    
    // Refresh every 5 seconds to catch changes from other users
    const interval = setInterval(fetchData, 5000);
    
    // Listen to custom events for same-tab updates
    const handleDataUpdate = () => {
      setPatients(store.getPatients());
      setServices(store.getServices());
      setVisits(store.getVisits());
    };
    
    window.addEventListener('biyo-data-updated', handleDataUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('biyo-data-updated', handleDataUpdate);
    };
  }, []);

  // Filter patients
  const filteredPatients = useMemo(() => {
    let filtered = patients;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.phone.toLowerCase().includes(query) ||
          p.email.toLowerCase().includes(query)
      );
    }

    // Apply all active filters (multiple filters can be active)
    if (activeFilters.has("debt")) {
      filtered = filtered.filter((p) => p.balance > 0);
    }
    if (activeFilters.has("untreated")) {
      filtered = filtered.filter((p) =>
        Array.isArray(p.teeth) && p.teeth.some((t) => t.status === "problem")
      );
    }
    if (activeFilters.has("children")) {
      filtered = filtered.filter((p) => p.isChild === true);
    }
    if (activeFilters.has("adults")) {
      filtered = filtered.filter((p) => p.isChild === false);
    }

    return filtered;
  }, [patients, searchQuery, activeFilters]);

  const handleFilterClick = (filter: FilterType) => {
    const newFilters = new Set(activeFilters);
    if (newFilters.has(filter)) {
      newFilters.delete(filter);
    } else {
      newFilters.add(filter);
    }
    setActiveFilters(newFilters);
  };

  const handlePatientClick = (patient: Patient) => {
    setSelectedPatient(patient);
  };

  const handleDeletePatient = async () => {
    if (patientToDelete) {
      try {
        await store.deletePatient(patientToDelete.id);
        toast.success("Пациент удален");
        setPatientToDelete(null);
        setIsDeleteDialogOpen(false);
        if (selectedPatient?.id === patientToDelete.id) {
          setSelectedPatient(null);
        }
        // Refresh data
        const clinicId = store.getCurrentClinicId();
        if (clinicId) {
          const [fetchedPatients] = await Promise.all([
            store.fetchPatients(clinicId),
          ]);
          setPatients(fetchedPatients);
        }
      } catch (error) {
        console.error('Failed to delete patient:', error);
        toast.error("Не удалось удалить пациента");
      }
    }
  };

  return (
    <PageContainer contentClassName="space-y-4 sm:space-y-6">
      <Card className="bg-card p-4 sm:p-6">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h1 className="text-2xl font-bold">Пациенты</h1>
            <AddPatientDialog
              open={isAddDialogOpen}
              onOpenChange={setIsAddDialogOpen}
              services={services}
              onSaved={async () => {
                // Refresh patients list after save
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
          </div>

          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            <div className="relative w-full md:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по имени, телефону или email..."
                className="w-full border-0 bg-secondary pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            <Button
              variant={activeFilters.has("debt") ? "default" : "secondary"}
              size="sm"
              className="w-full text-sm sm:w-auto"
              onClick={() => handleFilterClick("debt")}
            >
              Есть долг
            </Button>
            <Button
              variant={activeFilters.has("untreated") ? "default" : "secondary"}
              size="sm"
              className="w-full text-sm sm:w-auto"
              onClick={() => handleFilterClick("untreated")}
            >
              Нелеченные зубы
            </Button>
            <Button
              variant={activeFilters.has("children") ? "default" : "secondary"}
              size="sm"
              className="w-full text-sm sm:w-auto"
              onClick={() => handleFilterClick("children")}
            >
              Дети
            </Button>
            <Button
              variant={activeFilters.has("adults") ? "default" : "secondary"}
              size="sm"
              className="w-full text-sm sm:w-auto"
              onClick={() => handleFilterClick("adults")}
            >
              Взрослые
            </Button>
          </div>

          <div className="space-y-3">
            {filteredPatients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery || activeFilters.size > 0
                  ? "Пациенты не найдены"
                  : "Нет пациентов. Добавьте первого пациента."}
              </div>
            ) : (
              filteredPatients.map((patient) => {
                // Calculate total charged (sum of all visit costs)
                const patientVisits = visits.filter((v) => v.patientId === patient.id);
                const totalCharged = patientVisits.reduce((sum, v) => sum + v.cost, 0);
                const outstandingBalance = patient.balance;

                return (
                  <div
                    key={patient.id}
                    className="flex cursor-pointer flex-col gap-3 rounded-lg bg-secondary/50 p-4 transition-colors hover:bg-secondary sm:flex-row sm:items-center sm:justify-between"
                    onClick={() => handlePatientClick(patient)}
                  >
                    <div className="w-full sm:flex-1">
                      <div className="mb-1 font-medium">{patient.name}</div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {patient.phone}
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {patient.email}
                        </div>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="font-medium text-primary">
                        {totalCharged.toFixed(2)} смн
                      </div>
                      <div
                        className={`text-sm ${
                          outstandingBalance > 0 ? "text-orange-500" : "text-muted-foreground"
                        }`}
                      >
                        {outstandingBalance > 0 ? `Долг: ${outstandingBalance.toFixed(2)} смн` : "Оплачено"}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
      </Card>

      {/* Patient Card Drawer */}
      {selectedPatient && (
        <PatientCard
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
          onDelete={() => {
            setPatientToDelete(selectedPatient);
            setIsDeleteDialogOpen(true);
          }}
          services={services}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить пациента?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Будут удалены все данные пациента,
              включая историю визитов и файлы.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePatient}
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

// Add Patient Dialog
function AddPatientDialog({
  open,
  onOpenChange,
  services: initialServices,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  services: ReturnType<typeof store.getServices>;
  onSaved?: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [isChild, setIsChild] = useState(false);
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [teeth, setTeeth] = useState<ToothStatus[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [price, setPrice] = useState("");
  const [visitNotes, setVisitNotes] = useState("");
  const [serviceSearchOpen, setServiceSearchOpen] = useState(false);
  const [isCreatingServiceDialogOpen, setIsCreatingServiceDialogOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [serviceSearchQuery, setServiceSearchQuery] = useState("");
  const [services, setServices] = useState(initialServices);

  // Refresh services when dialog opens or when a new service is created
  useEffect(() => {
    if (open) {
      setServices(store.getServices());
    }
  }, [open]);

  const handleCreateService = async () => {
    if (!newServiceName.trim()) {
      toast.error("Введите название услуги");
      return;
    }
    const newService = {
      id: `service_${Date.now()}_${Math.random()}`,
      name: newServiceName.trim(),
      defaultPrice: 0,
    };
    await store.saveService(newService);
    toast.success("Услуга создана");
    // Refresh services list
    setServices(store.getServices());
    // Close dialog
    setIsCreatingServiceDialogOpen(false);
    setNewServiceName("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!name || !name.trim()) {
      toast.error("Введите ФИО пациента");
      return;
    }
    if (!phone || !phone.trim()) {
      toast.error("Введите номер телефона пациента");
      return;
    }

    // Validate email format if provided
    if (email && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Введите корректный email адрес");
      return;
    }

    const clinicId = store.getCurrentClinicId();
    if (!clinicId) {
      toast.error("Не удалось определить клинику. Повторите попытку после входа.");
      return;
    }

    const patient: Patient = {
      id: `patient_${Date.now()}_${Math.random()}`,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || "",
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : new Date().toISOString(),
      isChild,
      address: address.trim() || undefined,
      notes: notes.trim() || undefined,
      teeth,
      services: [], // Services and price will be added later when patient comes
      balance: 0, // Price will be added later when patient comes
      clinicId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await store.savePatient(patient);
      toast.success("Пациент добавлен");

      // Trigger parent refresh
      if (onSaved) {
        onSaved();
      }

      // Reset form
      setName("");
      setPhone("");
      setEmail("");
      setDateOfBirth("");
      setIsChild(false);
      setAddress("");
      setNotes("");
      setTeeth([]);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save patient:', error);
      toast.error("Не удалось сохранить пациента. Проверьте подключение к серверу.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
          <Plus className="h-4 w-4" />
          Добавить пациента
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Добавить пациента</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                ФИО <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">
                Телефон <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">
                Дата рождения
              </Label>
              <Input
                id="dob"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="isChild"
              checked={isChild}
              onCheckedChange={setIsChild}
            />
            <Label htmlFor="isChild">Этот пациент ребёнок</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Адрес</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Заметки</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-4 border-t pt-4">
            <Label>Зубная карта</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Зубная карта может быть заполнена позже при визите пациента
            </p>
            <ToothChart
              teeth={teeth}
              isChild={isChild}
              onToothChange={setTeeth}
            />
          </div>

          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Услуги и стоимость</strong> будут добавлены позже, когда пациент придет на прием. 
              Вы сможете создать запись в расписании и указать все необходимые услуги.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Отмена
            </Button>
            <Button type="submit">Создать пациента</Button>
          </div>
        </form>
      </DialogContent>

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
    </Dialog>
  );
}

// Patient Card Component (will be in next part)
export function PatientCard({
  patient: initialPatient,
  onClose,
  onDelete,
  services,
}: {
  patient: Patient;
  onClose: () => void;
  onDelete: () => void;
  services: ReturnType<typeof store.getServices>;
}) {
  const [patient, setPatient] = useState(initialPatient);
  const [isEditing, setIsEditing] = useState(true); // Start in edit mode
  const [isEditingTeeth, setIsEditingTeeth] = useState(false);
  const [teeth, setTeeth] = useState<ToothStatus[]>(
    normalizeTeeth(initialPatient.teeth || [])
  );
  const [paymentCashAmount, setPaymentCashAmount] = useState("");
  const [paymentEwalletAmount, setPaymentEwalletAmount] = useState("");
  const [selectedVisitForPayment, setSelectedVisitForPayment] = useState<
    string | null
  >(null);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editingPaymentAmount, setEditingPaymentAmount] = useState("");
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<"cash" | "ewallet">("cash");
  const [visits, setVisits] = useState(() => 
    store.getVisits()
      .filter((v) => v.patientId === patient.id)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const [visitCostInputs, setVisitCostInputs] = useState<Record<string, string>>(
    {}
  );
  const [files, setFiles] = useState<PatientFile[]>(() =>
    store.getFiles().filter((f) => f.patientId === patient.id)
  );
  const [editingFileNameId, setEditingFileNameId] = useState<string | null>(null);
  const [editingFileName, setEditingFileName] = useState("");
  const [viewingFile, setViewingFile] = useState<PatientFile | null>(null);

  // Refresh visits and patient data periodically to catch updates from other users
  useEffect(() => {
    const refreshData = () => {
      // Refresh visits
      const updatedVisits = store.getVisits()
        .filter((v) => v.patientId === patient.id)
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      setVisits(updatedVisits);
      
      // Refresh files
      const updatedFiles = store.getFiles().filter((f) => f.patientId === patient.id);
      setFiles(updatedFiles);
      
      // Refresh patient data (to get updated balance)
      const updatedPatient = store.getPatients().find((p) => p.id === patient.id);
      if (updatedPatient) {
        const recalculatedBalance = store.calculatePatientBalance(patient.id);
        if (!isEditing && !isEditingTeeth) {
          setPatient({
            ...updatedPatient,
            balance: recalculatedBalance,
          });
        } else {
          // Preserve fields the user is editing while keeping balance accurate
          setPatient((prev) => ({
            ...prev,
            balance: recalculatedBalance,
          }));
        }
      }
      
      setRefreshKey(prev => prev + 1);
    };
    
    // Refresh every 2 seconds to catch changes from other users
    const interval = setInterval(refreshData, 2000);
    
    // Also listen to storage events and custom events
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('biyo_')) {
        refreshData();
      }
    };
    
    const handleDataUpdate = () => {
      refreshData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('biyo-data-updated', handleDataUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('biyo-data-updated', handleDataUpdate);
    };
  }, [patient.id, isEditing, isEditingTeeth]);

  useEffect(() => {
    setVisitCostInputs((prev) => {
      const next: Record<string, string> = {};
      visits.forEach((visit) => {
        next[visit.id] =
          prev[visit.id] !== undefined
            ? prev[visit.id]
            : formatAmountForInput(visit.cost);
      });
      return next;
    });
  }, [visits]);

  const getTimestamp = (value?: string) =>
    value ? new Date(value).getTime() : 0;

  const hasTeethChanges = useMemo(() => {
    const saved = normalizeTeeth(patient.teeth || []);
    const current = normalizeTeeth(teeth || []);
    if (saved.length !== current.length) {
      return true;
    }
    return saved.some(
      (item, index) =>
        item.toothNumber !== current[index].toothNumber ||
        item.status !== current[index].status
    );
  }, [patient.teeth, teeth]);

  // Keep local patient in sync with incoming props but avoid overwriting newer local edits
  useEffect(() => {
    if (!initialPatient) return;

    setPatient((prev) => {
      if (!prev || prev.id !== initialPatient.id) {
        setTeeth(normalizeTeeth(initialPatient.teeth || []));
        return initialPatient;
      }

      const incomingUpdatedAt = getTimestamp(initialPatient.updatedAt);
      const currentUpdatedAt = getTimestamp(prev.updatedAt);

      if (incomingUpdatedAt > currentUpdatedAt) {
        setTeeth(normalizeTeeth(initialPatient.teeth || []));
        return initialPatient;
      }

      return prev;
    });
  }, [initialPatient]);

  // When we exit edit modes, sync editable teeth state with the latest saved data
  useEffect(() => {
    if (!isEditing && !isEditingTeeth) {
      setTeeth(normalizeTeeth(patient.teeth || []));
    }
  }, [isEditing, isEditingTeeth, patient.teeth]);

  const handleSavePatient = async () => {
    const normalizedTeeth = normalizeTeeth(teeth);
    const payload: Patient = { ...patient, teeth: normalizedTeeth };

    try {
      await store.savePatient(payload);

      const refreshed = store
        .getPatients()
        .find((p) => p.id === patient.id);

      if (refreshed) {
        setPatient(refreshed);
        setTeeth(normalizeTeeth(refreshed.teeth || []));
      } else {
        setPatient(payload);
        setTeeth(normalizedTeeth);
      }

    setIsEditing(false);
    setIsEditingTeeth(false);
    toast.success("Данные пациента обновлены");
    } catch (error) {
      console.error("Failed to save patient", error);
      toast.error("Не удалось сохранить данные пациента");
    }
  };

  const handleCancelEdit = () => {
    setPatient(initialPatient);
    setTeeth(normalizeTeeth(initialPatient.teeth || []));
    setIsEditing(false);
    setIsEditingTeeth(false);
  };

  const handleSaveTeeth = async () => {
    if (!hasTeethChanges) {
      setIsEditingTeeth(false);
      toast.info("Изменений в зубной карте нет");
      return;
    }

    const normalizedTeeth = normalizeTeeth(teeth);
    const payload: Patient = { ...patient, teeth: normalizedTeeth };

    try {
      await store.savePatient(payload);

      const refreshed = store
        .getPatients()
        .find((p) => p.id === patient.id);

      if (refreshed) {
        setPatient(refreshed);
        setTeeth(normalizeTeeth(refreshed.teeth || []));
      } else {
        setPatient(payload);
        setTeeth(normalizedTeeth);
      }

    setIsEditingTeeth(false);
    toast.success("Зубная карта обновлена");
    } catch (error) {
      console.error("Failed to save teeth changes", error);
      toast.error("Не удалось сохранить зубную карту");
    }
  };

  const handleAddPayment = async (visitId: string) => {
    const cashAmount = parseAmountInput(paymentCashAmount);
    const ewalletAmount = parseAmountInput(paymentEwalletAmount);

    if (cashAmount === null || ewalletAmount === null) {
      toast.error("Введите корректную сумму");
      return;
    }

    if ((cashAmount ?? 0) <= 0 && (ewalletAmount ?? 0) <= 0) {
      toast.error("Укажите сумму для оплаты");
      return;
    }

    try {
      if (cashAmount && cashAmount > 0) {
        await store.addPayment(visitId, cashAmount, "cash");
      }
      if (ewalletAmount && ewalletAmount > 0) {
        await store.addPayment(visitId, ewalletAmount, "ewallet");
      }
    toast.success("Платеж добавлен");
    } catch (error) {
      console.error("Failed to add payment", error);
      toast.error("Не удалось добавить платеж");
      return;
    }

    const updatedVisits = store
      .getVisits()
      .filter((v) => v.patientId === patient.id)
      .sort(
        (a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );
    setVisits(updatedVisits);

    const updatedPatient = store.getPatients().find((p) => p.id === patient.id);
    if (updatedPatient) {
      updatedPatient.balance = store.calculatePatientBalance(patient.id);
      await store.savePatient(updatedPatient);
      setPatient(updatedPatient);
    }
    
    setPaymentCashAmount("");
    setPaymentEwalletAmount("");
    setSelectedVisitForPayment(null);
    setRefreshKey((prev) => prev + 1);
  };

  const handleSaveVisitCost = async (visitId: string) => {
    const inputValue = visitCostInputs[visitId] ?? "";
    const parsedCost = parseAmountInput(inputValue, false);

    if (parsedCost === null || parsedCost < 0) {
      toast.error("Введите корректную стоимость");
      return;
    }

    const visit = visits.find((v) => v.id === visitId);
    if (!visit) {
      toast.error("Визит не найден");
      return;
    }

    const updatedVisit = { ...visit, cost: parsedCost };

    try {
      await store.saveVisit(updatedVisit);
      const updatedVisits = store
        .getVisits()
        .filter((v) => v.patientId === patient.id)
        .sort(
          (a, b) =>
            new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        );
      setVisits(updatedVisits);

      const updatedPatient = store.getPatients().find((p) => p.id === patient.id);
      if (updatedPatient) {
        updatedPatient.balance = store.calculatePatientBalance(patient.id);
        await store.savePatient(updatedPatient);
        setPatient(updatedPatient);
      }

      setVisitCostInputs((prev) => ({
        ...prev,
        [visitId]: formatAmountForInput(parsedCost),
      }));
      setRefreshKey((prev) => prev + 1);
      toast.success("Стоимость визита обновлена");
    } catch (error) {
      console.error("Failed to save visit cost", error);
      toast.error("Не удалось сохранить стоимость визита");
    }
  };

  const handleStartEditPayment = (payment: Payment) => {
    setEditingPaymentId(payment.id);
    setEditingPaymentAmount(formatAmountForInput(payment.amount));
    setEditingPaymentMethod(payment.method || "cash");
  };

  const handleCancelEditPayment = () => {
    setEditingPaymentId(null);
    setEditingPaymentAmount("");
    setEditingPaymentMethod("cash");
  };

  const handleSaveEditPayment = async (visitId: string, paymentId: string) => {
    const parsedAmount = parseAmountInput(editingPaymentAmount, false);
    if (parsedAmount === null || parsedAmount <= 0) {
      toast.error("Введите корректную сумму");
      return;
    }

    const visit = visits.find((v) => v.id === visitId);
    if (!visit) {
      toast.error("Визит не найден");
      return;
    }

    const updatedPayments = visit.payments?.map((p) =>
      p.id === paymentId
        ? { ...p, amount: parsedAmount, method: editingPaymentMethod }
        : p
    ) || [];

    // Recalculate cashAmount and ewalletAmount
    const cashTotal = updatedPayments
      .filter((p) => p.method === "cash")
      .reduce((sum, p) => sum + p.amount, 0);
    const walletTotal = updatedPayments
      .filter((p) => p.method === "ewallet")
      .reduce((sum, p) => sum + p.amount, 0);

    const updatedVisit: Visit = {
      ...visit,
      payments: updatedPayments,
      cashAmount: parseFloat(cashTotal.toFixed(2)),
      ewalletAmount: parseFloat(walletTotal.toFixed(2)),
    };

    try {
      await store.saveVisit(updatedVisit);
      const updatedVisits = store
        .getVisits()
        .filter((v) => v.patientId === patient.id)
        .sort(
          (a, b) =>
            new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        );
      setVisits(updatedVisits);

      const updatedPatient = store.getPatients().find((p) => p.id === patient.id);
      if (updatedPatient) {
        updatedPatient.balance = store.calculatePatientBalance(patient.id);
        await store.savePatient(updatedPatient);
        setPatient(updatedPatient);
      }

      setEditingPaymentId(null);
      setEditingPaymentAmount("");
      setEditingPaymentMethod("cash");
      setRefreshKey((prev) => prev + 1);
      toast.success("Платеж обновлен");
    } catch (error) {
      console.error("Failed to update payment", error);
      toast.error("Не удалось обновить платеж");
    }
  };

  const handleDeletePayment = async (visitId: string, paymentId: string) => {
    const visit = visits.find((v) => v.id === visitId);
    if (!visit) {
      toast.error("Визит не найден");
      return;
    }

    const updatedPayments = visit.payments?.filter((p) => p.id !== paymentId) || [];

    // Recalculate cashAmount and ewalletAmount
    const cashTotal = updatedPayments
      .filter((p) => p.method === "cash")
      .reduce((sum, p) => sum + p.amount, 0);
    const walletTotal = updatedPayments
      .filter((p) => p.method === "ewallet")
      .reduce((sum, p) => sum + p.amount, 0);

    const updatedVisit: Visit = {
      ...visit,
      payments: updatedPayments,
      cashAmount: parseFloat(cashTotal.toFixed(2)),
      ewalletAmount: parseFloat(walletTotal.toFixed(2)),
    };

    try {
      await store.saveVisit(updatedVisit);
      const updatedVisits = store
        .getVisits()
        .filter((v) => v.patientId === patient.id)
        .sort(
          (a, b) =>
            new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        );
      setVisits(updatedVisits);

      const updatedPatient = store.getPatients().find((p) => p.id === patient.id);
      if (updatedPatient) {
        updatedPatient.balance = store.calculatePatientBalance(patient.id);
        await store.savePatient(updatedPatient);
        setPatient(updatedPatient);
      }

      setRefreshKey((prev) => prev + 1);
      toast.success("Платеж удален");
    } catch (error) {
      console.error("Failed to delete payment", error);
      toast.error("Не удалось удалить платеж");
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Failed to convert file to base64"));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const base64 = await convertFileToBase64(file);
        
        const patientFile: PatientFile = {
          id: `file_${Date.now()}_${Math.random()}`,
          patientId: patient.id,
          name: file.name,
          file: base64,
          clinicId: store.getCurrentClinicId() || "",
          uploadedAt: new Date().toISOString(),
        };

        await store.saveFile(patientFile);
      }

      const updatedFiles = store.getFiles().filter((f) => f.patientId === patient.id);
      setFiles(updatedFiles);
      toast.success(`Загружено файлов: ${selectedFiles.length}`);
      e.target.value = ""; // Reset input
    } catch (error) {
      console.error("Failed to upload file", error);
      toast.error("Не удалось загрузить файл");
    }
  };

  const handleStartRenameFile = (file: PatientFile) => {
    setEditingFileNameId(file.id);
    setEditingFileName(file.name);
  };

  const handleCancelRenameFile = () => {
    setEditingFileNameId(null);
    setEditingFileName("");
  };

  const handleSaveRenameFile = async (fileId: string) => {
    if (!editingFileName.trim()) {
      toast.error("Введите название файла");
      return;
    }

    const file = files.find((f) => f.id === fileId);
    if (!file) {
      toast.error("Файл не найден");
      return;
    }

    try {
      const clinicId = store.getCurrentClinicId();
      if (!clinicId) {
        toast.error("Не удалось определить клинику");
        return;
      }

      const file = files.find((f) => f.id === fileId);
      if (!file) {
        toast.error("Файл не найден");
        return;
      }

      // Update the file name
      const updatedFile: PatientFile = {
        ...file,
        name: editingFileName.trim(),
      };
      
      // Save updated file through API
      await store.saveFile(updatedFile);
      
      // Refresh files from store
      const patientFiles = store.getFiles(patient.id, clinicId);
      setFiles(patientFiles);
      
      setEditingFileNameId(null);
      setEditingFileName("");
      toast.success("Название файла обновлено");
    } catch (error) {
      console.error("Failed to rename file", error);
      toast.error("Не удалось переименовать файл");
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      const clinicId = store.getCurrentClinicId();
      if (clinicId) {
        await store.deleteFile(fileId, clinicId);
        const updatedFiles = store.getFiles(patient.id, clinicId);
        setFiles(updatedFiles);
        toast.success("Файл удален");
      }
    } catch (error) {
      console.error("Failed to delete file", error);
      toast.error("Не удалось удалить файл");
    }
  };

  const handleViewFile = (file: PatientFile) => {
    setViewingFile(file);
  };

  const getFileUrl = (file: PatientFile): string => {
    if (typeof file.file === "string") {
      return file.file; // Base64 data URL
    }
    return URL.createObjectURL(file.file);
  };

  const getFileType = (file: PatientFile): string => {
    const name = file.name.toLowerCase();
    if (name.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/)) return "image";
    if (name.match(/\.(pdf)$/)) return "pdf";
    if (name.match(/\.(doc|docx)$/)) return "document";
    return "file";
  };

  // Calculate summary data from current visits (will update when visits refresh)
  // Use useMemo to recalculate when visits or refreshKey changes
  const { totalSpent, totalPaid, lastVisit, nextVisit, currentBalance } = useMemo(() => {
    const spent = visits.reduce((sum, v) => sum + v.cost, 0);
    const paid = visits.reduce(
      (sum, v) => sum + (v.payments?.reduce((p, pay) => p + pay.amount, 0) || 0),
      0
    );
    const last = visits[0];
    const next = visits.find((v) => v.status === "scheduled");
    // Ensure patient balance is up to date
    const balance = store.calculatePatientBalance(patient.id);
    return { totalSpent: spent, totalPaid: paid, lastVisit: last, nextVisit: next, currentBalance: balance };
  }, [visits, patient.id, refreshKey]);

  return (
    <Dialog open={!!patient} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[85vw] w-[85vw] max-h-[85vh] p-0 flex flex-col">
        <DialogHeader className="border-b p-6 pb-4 bg-background sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <DialogTitle>
              {isEditing ? (
                <Input
                  value={patient.name}
                  onChange={(e) => setPatient({ ...patient, name: e.target.value })}
                  className="text-lg font-semibold h-8"
                  placeholder="ФИО"
                />
              ) : (
                patient.name
              )}
            </DialogTitle>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={handleSavePatient}>
                    Сохранить
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                    Отмена
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  Редактировать
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* Personal Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Телефон</Label>
              {isEditing ? (
                <Input
                  value={patient.phone}
                  onChange={(e) => setPatient({ ...patient, phone: e.target.value })}
                />
              ) : (
                <p>{patient.phone}</p>
              )}
            </div>
            <div>
              <Label className="text-muted-foreground">Email</Label>
              {isEditing ? (
                <Input
                  type="email"
                  value={patient.email}
                  onChange={(e) => setPatient({ ...patient, email: e.target.value })}
                />
              ) : (
                <p>{patient.email}</p>
              )}
            </div>
            <div>
              <Label className="text-muted-foreground">Дата рождения</Label>
              {isEditing ? (
                <Input
                  type="date"
                  value={format(new Date(patient.dateOfBirth), "yyyy-MM-dd")}
                  onChange={(e) => {
                    if (e.target.value) {
                      setPatient({ ...patient, dateOfBirth: new Date(e.target.value).toISOString() });
                    }
                  }}
                />
              ) : (
                <p>
                  {format(new Date(patient.dateOfBirth), "dd.MM.yyyy", {
                    locale: ru,
                  })}
                </p>
              )}
            </div>
            <div>
              <Label className="text-muted-foreground">Тип</Label>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Switch
                    checked={patient.isChild}
                    onCheckedChange={(checked) => setPatient({ ...patient, isChild: checked })}
                  />
                  <span className="text-sm">{patient.isChild ? "Ребёнок" : "Взрослый"}</span>
                </div>
              ) : (
                <p>{patient.isChild ? "Ребёнок" : "Взрослый"}</p>
              )}
            </div>
            <div className="col-span-2">
              <Label className="text-muted-foreground">Адрес</Label>
              {isEditing ? (
                <Input
                  value={patient.address || ""}
                  onChange={(e) => setPatient({ ...patient, address: e.target.value })}
                  placeholder="Адрес"
                />
              ) : (
                <p>{patient.address || "Не указан"}</p>
              )}
            </div>
            <div className="col-span-2">
              <Label className="text-muted-foreground">Заметки</Label>
              {isEditing ? (
                <Textarea
                  value={patient.notes || ""}
                  onChange={(e) => setPatient({ ...patient, notes: e.target.value })}
                  placeholder="Заметки"
                  rows={3}
                />
              ) : (
                <p>{patient.notes || "Нет заметок"}</p>
              )}
            </div>
          </div>

          {/* Tooth Chart */}
          <div className="border-t pt-6">
            <Label className="mb-4 block">Зубная карта</Label>
            <ToothChart
              teeth={isEditing || isEditingTeeth ? teeth : patient.teeth}
              isChild={patient.isChild}
              onToothChange={setTeeth}
              readonly={!isEditing && !isEditingTeeth}
            />
            {!isEditing && (
              <div className="mt-4 flex justify-end gap-2">
                {isEditingTeeth ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setTeeth(normalizeTeeth(patient.teeth || []));
                        setIsEditingTeeth(false);
                      }}
                    >
                      Отмена
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveTeeth}
                      disabled={!hasTeethChanges}
                    >
                      Сохранить изменения
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTeeth(normalizeTeeth(patient.teeth || []));
                      setIsEditingTeeth(true);
                    }}
                  >
                    Редактировать зубную карту
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Visit History */}
          <div className="border-t pt-6">
            <Label className="text-lg mb-4 block">История визитов</Label>
            {visits.length === 0 ? (
              <p className="text-muted-foreground">Нет записей о визитах</p>
            ) : (
              <div className="space-y-4">
                {visits.map((visit) => {
                  const doctor = store
                    .getDoctors()
                    .find((d) => d.id === visit.doctorId);
                  
                  const paymentList = visit.payments || [];
                  const cashPaidForVisit = paymentList
                    .filter((p) => p.method === "cash")
                    .reduce((sum, p) => sum + p.amount, 0);
                  const ewalletPaidForVisit = paymentList
                    .filter((p) => p.method === "ewallet")
                    .reduce((sum, p) => sum + p.amount, 0);
                  const unspecifiedPaidForVisit = paymentList
                    .filter((p) => !p.method)
                    .reduce((sum, p) => sum + p.amount, 0);
                  const totalPaidForVisit =
                    cashPaidForVisit + ewalletPaidForVisit + unspecifiedPaidForVisit;
                  const remainingBalance = visit.cost - totalPaidForVisit;
                  const costInputValue =
                    visitCostInputs[visit.id] ?? formatAmountForInput(visit.cost);
                  const parsedCostInput = parseAmountInput(costInputValue, false);
                  const costHasChanged =
                    parsedCostInput !== null &&
                    parseFloat(visit.cost.toFixed(2)) !== parsedCostInput;
                  const activeCashInput =
                    selectedVisitForPayment === visit.id ? paymentCashAmount : "";
                  const activeEwalletInput =
                    selectedVisitForPayment === visit.id ? paymentEwalletAmount : "";
                  const parsedCashInput =
                    selectedVisitForPayment === visit.id
                      ? parseAmountInput(activeCashInput)
                      : 0;
                  const parsedEwalletInput =
                    selectedVisitForPayment === visit.id
                      ? parseAmountInput(activeEwalletInput)
                      : 0;
                  const paymentInputsInvalid =
                    selectedVisitForPayment === visit.id &&
                    (parsedCashInput === null || parsedEwalletInput === null);
                  const cashInputAmount =
                    typeof parsedCashInput === "number" ? parsedCashInput : 0;
                  const ewalletInputAmount =
                    typeof parsedEwalletInput === "number" ? parsedEwalletInput : 0;
                  const paymentPreviewTotal =
                    (cashInputAmount > 0 ? cashInputAmount : 0) +
                    (ewalletInputAmount > 0 ? ewalletInputAmount : 0);
                  const isAddPaymentDisabled =
                    paymentInputsInvalid ||
                    selectedVisitForPayment !== visit.id ||
                    paymentPreviewTotal <= 0;
                  const fallbackTeeth =
                    visit.treatedTeeth && visit.treatedTeeth.length > 0
                      ? [...visit.treatedTeeth].sort((a, b) => a - b)
                      : undefined;
                  const renderedServices = (() => {
                    if (!Array.isArray(visit.services) || visit.services.length === 0) {
                      return [];
                    }
                    if (typeof visit.services[0] === "string") {
                      return (visit.services as string[]).map((id, idx) => {
                        const service = services.find((s) => s.id === id);
                        return {
                          key: `${id}-${idx}`,
                          name: service?.name || id,
                          quantity: 1,
                          teeth: fallbackTeeth,
                        };
                      });
                    }
                    return (visit.services as VisitService[]).map((vs, idx) => {
                        const service = services.find((s) => s.id === vs.serviceId);
                      const teethList =
                        vs.teeth && vs.teeth.length > 0
                          ? [...vs.teeth].sort((a, b) => a - b)
                          : fallbackTeeth;
                      return {
                        key: `${vs.serviceId}-${idx}`,
                        name: service?.name || vs.serviceId,
                        quantity: vs.quantity || 1,
                        teeth: teethList,
                      };
                      });
                  })();
                  let computedStatus = visit.status;
                  const now = new Date();
                  const visitEndTime = parseISO(visit.endTime);
                  if (computedStatus === "scheduled" && visitEndTime < now) {
                    computedStatus = "completed";
                  }

                  const statusLabel =
                    computedStatus === "scheduled"
                      ? "Запланирован"
                      : computedStatus === "completed"
                        ? "Завершен"
                        : "Отменен";
                  const statusVariant =
                    computedStatus === "completed"
                      ? "secondary"
                      : computedStatus === "cancelled"
                        ? "outline"
                        : "default";
                  const infoCards = [
                    {
                      label: "Общая стоимость",
                      value: `${visit.cost.toFixed(2)} смн`,
                      emphasize: false,
                    },
                    {
                      label: "Оплачено",
                      value: `${totalPaidForVisit.toFixed(2)} смн`,
                      emphasize: false,
                    },
                    {
                      label:
                        remainingBalance > 0
                          ? "Остаток к оплате"
                          : "Оплачено полностью",
                      value:
                        remainingBalance > 0
                          ? `${remainingBalance.toFixed(2)} смн`
                          : "0 смн",
                      emphasize: remainingBalance > 0,
                    },
                  ];

                  return (
                    <Card key={visit.id} className="p-4 space-y-4">
                      <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-lg font-semibold">
                            {format(new Date(visit.startTime), "dd.MM.yyyy HH:mm", {
                              locale: ru,
                            })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Врач: {doctor?.name || "Не указан"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={statusVariant}
                            className="text-xs font-semibold uppercase"
                          >
                            {statusLabel}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-3">
                        {infoCards.map((card) => (
                          <div
                            key={card.label}
                            className="rounded-lg border bg-muted/30 p-3"
                          >
                            <p className="text-xs font-medium uppercase text-muted-foreground">
                              {card.label}
                            </p>
                            <p
                              className={`mt-1 text-lg font-semibold ${
                                card.emphasize ? "text-orange-500" : ""
                              }`}
                            >
                              {card.value}
                            </p>
                        </div>
                        ))}
                      </div>

                      <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <Label className="text-sm font-medium">
                            Услуги и зубы
                          </Label>
                          {renderedServices.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {renderedServices.length}
                            </Badge>
                          )}
                                  </div>
                        {renderedServices.length > 0 ? (
                          <div className="grid gap-2">
                            {renderedServices.map((service) => (
                              <div
                                key={service.key}
                                className="rounded-md border border-border/60 bg-background/80 p-3"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <span className="text-sm font-medium leading-tight">
                                    {service.name}
                                    </span>
                                  {service.quantity > 1 && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs font-semibold"
                                    >
                                      ×{service.quantity}
                                    </Badge>
                            )}
                          </div>
                                {service.teeth && service.teeth.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1.5">
                                    {service.teeth.map((tooth) => (
                                      <Badge
                                        key={`${service.key}-tooth-${tooth}`}
                                        variant="outline"
                                        className="font-mono text-xs"
                              >
                                        {tooth}
                                      </Badge>
                            ))}
                          </div>
                                )}
                        </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Услуги не указаны.
                          </p>
                        )}
                      </div>

                      {visit.notes && (
                        <div className="rounded-lg border bg-muted/20 p-3">
                          <Label className="text-xs font-medium uppercase text-muted-foreground">
                            Заметки
                          </Label>
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            {visit.notes}
                          </p>
                        </div>
                      )}

                      <div className="rounded-lg border bg-muted/20 p-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <Label className="text-sm font-medium">
                            Общая стоимость
                          </Label>
                          {costHasChanged && (
                            <Badge variant="outline" className="text-xs">
                              Требуется сохранение
                            </Badge>
                          )}
                        </div>
                        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={costInputValue}
                            onChange={(e) =>
                              setVisitCostInputs((prev) => ({
                                ...prev,
                                [visit.id]: e.target.value,
                              }))
                            }
                            className="flex-1"
                            placeholder="Введите общую стоимость"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSaveVisitCost(visit.id)}
                            disabled={
                              parsedCostInput === null ||
                              parsedCostInput < 0 ||
                              !costHasChanged
                            }
                          >
                            Сохранить стоимость
                          </Button>
                        </div>
                      </div>

                      <div className="rounded-lg border bg-muted/20 p-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Оплата</Label>
                        </div>
                        <div className="mt-3 space-y-3">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">
                                Наличные
                              </Label>
                          <Input
                            type="number"
                            step="0.01"
                                min="0"
                                placeholder="0.00"
                            value={
                              selectedVisitForPayment === visit.id
                                    ? paymentCashAmount
                                : ""
                            }
                            onChange={(e) => {
                                  setPaymentCashAmount(e.target.value);
                              setSelectedVisitForPayment(visit.id);
                            }}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">
                                Электронный кошелёк
                              </Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={
                                  selectedVisitForPayment === visit.id
                                    ? paymentEwalletAmount
                                    : ""
                                }
                                onChange={(e) => {
                                  setPaymentEwalletAmount(e.target.value);
                                  setSelectedVisitForPayment(visit.id);
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm">
                            <span className="text-muted-foreground">Итого</span>
                            <span className="font-medium">
                              {paymentPreviewTotal.toFixed(2)} смн
                            </span>
                          </div>
                          <Button
                            size="sm"
                            onClick={async () => {
                              await handleAddPayment(visit.id);
                            }}
                            disabled={isAddPaymentDisabled}
                          >
                            Добавить платеж
                          </Button>
                        </div>
                        {visit.payments && visit.payments.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <Label className="text-xs text-muted-foreground">
                              История платежей
                            </Label>
                            <div className="space-y-1.5">
                              {visit.payments.map((payment) => {
                                const isEditing = editingPaymentId === payment.id;
                                const methodLabel =
                                  payment.method === "cash"
                                    ? "Наличные"
                                    : payment.method === "ewallet"
                                      ? "Электронный кошелёк"
                                      : "Без категории";
                                const methodVariant =
                                  payment.method === "cash"
                                    ? "secondary"
                                    : payment.method === "ewallet"
                                      ? "outline"
                                      : "default";
                                return (
                                  <div
                                    key={payment.id}
                                    className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-background/80 px-3 py-2"
                                  >
                                    {isEditing ? (
                                      <div className="flex-1 space-y-2">
                                        <div className="flex gap-2">
                                          <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={editingPaymentAmount}
                                            onChange={(e) => setEditingPaymentAmount(e.target.value)}
                                            className="flex-1"
                                            placeholder="Сумма"
                                          />
                                          <Select
                                            value={editingPaymentMethod}
                                            onValueChange={(value: "cash" | "ewallet") => setEditingPaymentMethod(value)}
                                          >
                                            <SelectTrigger className="w-[140px]">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="cash">Наличные</SelectItem>
                                              <SelectItem value="ewallet">Электронный кошелёк</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="flex gap-2">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleCancelEditPayment()}
                                            className="flex-1"
                                          >
                                            Отмена
                                          </Button>
                                          <Button
                                            size="sm"
                                            onClick={() => handleSaveEditPayment(visit.id, payment.id)}
                                            className="flex-1"
                                            disabled={
                                              parseAmountInput(editingPaymentAmount, false) === null ||
                                              parseAmountInput(editingPaymentAmount, false)! <= 0
                                            }
                                          >
                                            Сохранить
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => {
                                              if (confirm("Вы уверены, что хотите удалить этот платеж?")) {
                                                handleDeletePayment(visit.id, payment.id);
                                              }
                                            }}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <div className="flex-1">
                                          <p className="text-sm font-medium">
                                            {payment.amount.toFixed(2)} смн
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {format(new Date(payment.date), "dd.MM.yyyy")}
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Badge variant={methodVariant} className="text-xs">
                                            {methodLabel}
                                          </Badge>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleStartEditPayment(payment)}
                                          >
                                            Редактировать
                                          </Button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="border-t pt-6">
            <Label className="text-lg mb-4 block">Сводка</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Последний визит</Label>
                <p>
                  {lastVisit
                    ? format(new Date(lastVisit.startTime), "dd.MM.yyyy HH:mm", {
                        locale: ru,
                      })
                    : "Нет"}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Всего потрачено</Label>
                <p>{totalSpent.toFixed(2)} смн</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Следующий визит</Label>
                <p>
                  {nextVisit
                    ? format(new Date(nextVisit.startTime), "dd.MM.yyyy HH:mm", {
                        locale: ru,
                      })
                    : "Не запланирован"}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Остаток к оплате</Label>
                <p className={currentBalance > 0 ? "text-orange-500" : ""}>
                  {currentBalance.toFixed(2)} смн
                </p>
              </div>
            </div>
          </div>

          {/* Files Section */}
          <div className="border-t pt-6">
            <Label className="text-lg mb-4 block">Файлы</Label>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileUpload}
                  multiple
                  accept="*/*"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("file-upload")?.click()}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Загрузить файлы
                </Button>
              </div>

              {files.length === 0 ? (
                <p className="text-sm text-muted-foreground">Нет загруженных файлов</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {files.map((file) => {
                    const isEditing = editingFileNameId === file.id;
                    const fileType = getFileType(file);
                    return (
                      <Card key={file.id} className="p-3">
                        {isEditing ? (
                          <div className="space-y-2">
                            <Input
                              value={editingFileName}
                              onChange={(e) => setEditingFileName(e.target.value)}
                              placeholder="Название файла"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleSaveRenameFile(file.id);
                                } else if (e.key === "Escape") {
                                  handleCancelRenameFile();
                                }
                              }}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancelRenameFile()}
                                className="flex-1"
                              >
                                Отмена
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleSaveRenameFile(file.id)}
                                className="flex-1"
                                disabled={!editingFileName.trim()}
                              >
                                Сохранить
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  <p className="text-sm font-medium truncate" title={file.name}>
                                    {file.name}
                                  </p>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(file.uploadedAt), "dd.MM.yyyy", { locale: ru })}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewFile(file)}
                                className="flex-1 gap-1"
                              >
                                <Eye className="h-3 w-3" />
                                Просмотр
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStartRenameFile(file)}
                                className="gap-1"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (confirm("Вы уверены, что хотите удалить этот файл?")) {
                                    handleDeleteFile(file.id);
                                  }
                                }}
                                className="gap-1 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Delete Button */}
          <div className="border-t pt-6">
            <Button
              variant="destructive"
              onClick={onDelete}
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Удалить пациента
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* File Viewer Dialog */}
      <Dialog open={!!viewingFile} onOpenChange={(open) => !open && setViewingFile(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingFile?.name}</DialogTitle>
          </DialogHeader>
          {viewingFile && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Загружено: {format(new Date(viewingFile.uploadedAt), "dd.MM.yyyy HH:mm", { locale: ru })}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const url = getFileUrl(viewingFile);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = viewingFile.name;
                    link.target = "_blank";
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                >
                  Скачать
                </Button>
              </div>
              <div className="border rounded-lg overflow-hidden bg-muted/20">
                {getFileType(viewingFile) === "image" ? (
                  <img
                    src={getFileUrl(viewingFile)}
                    alt={viewingFile.name}
                    className="w-full h-auto max-h-[70vh] object-contain"
                  />
                ) : getFileType(viewingFile) === "pdf" ? (
                  <iframe
                    src={getFileUrl(viewingFile)}
                    className="w-full h-[70vh] border-0"
                    title={viewingFile.name}
                  />
                ) : (
                  <div className="p-8 text-center">
                    <File className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Просмотр этого типа файла не поддерживается в браузере
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const url = getFileUrl(viewingFile);
                        window.open(url, "_blank");
                      }}
                    >
                      Открыть в новой вкладке
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

export default Patients;
