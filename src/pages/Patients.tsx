import { useState, useMemo, useEffect } from "react";
import { Search, Plus, Phone, Mail, Trash2 } from "lucide-react";
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
import { store, Patient, ToothStatus, VisitService } from "@/lib/store";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";

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

  const [patients, setPatients] = useState(store.getPatients());
  const [services, setServices] = useState(store.getServices());
  const [visits, setVisits] = useState(store.getVisits());
  
  // Refresh all data periodically to sync with other users in the same clinic
  useEffect(() => {
    const refreshData = () => {
      setPatients(store.getPatients());
      setServices(store.getServices());
      setVisits(store.getVisits());
    };
    
    // Refresh every 2 seconds to catch changes from other users
    const interval = setInterval(refreshData, 2000);
    
    // Also listen to storage events (for cross-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('biyo_')) {
        refreshData();
      }
    };
    
    // Listen to custom events for same-tab updates
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

  const handleDeletePatient = () => {
    if (patientToDelete) {
      store.deletePatient(patientToDelete.id);
      toast.success("Пациент удален");
      setPatientToDelete(null);
      setIsDeleteDialogOpen(false);
      if (selectedPatient?.id === patientToDelete.id) {
        setSelectedPatient(null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1400px] mx-auto">
        <Card className="bg-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Пациенты</h1>
            <AddPatientDialog
              open={isAddDialogOpen}
              onOpenChange={setIsAddDialogOpen}
              services={services}
            />
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по имени, телефону или email..."
                className="pl-10 bg-secondary border-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mb-6">
            <Button
              variant={activeFilters.has("debt") ? "default" : "secondary"}
              size="sm"
              className="text-sm"
              onClick={() => handleFilterClick("debt")}
            >
              Есть долг
            </Button>
            <Button
              variant={activeFilters.has("untreated") ? "default" : "secondary"}
              size="sm"
              className="text-sm"
              onClick={() => handleFilterClick("untreated")}
            >
              Нелеченные зубы
            </Button>
            <Button
              variant={activeFilters.has("children") ? "default" : "secondary"}
              size="sm"
              className="text-sm"
              onClick={() => handleFilterClick("children")}
            >
              Дети
            </Button>
            <Button
              variant={activeFilters.has("adults") ? "default" : "secondary"}
              size="sm"
              className="text-sm"
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
                    className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
                    onClick={() => handlePatientClick(patient)}
                  >
                    <div className="flex-1">
                      <div className="font-medium mb-1">{patient.name}</div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
                    <div className="text-right">
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
      </div>

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
    </div>
  );
};

// Add Patient Dialog
function AddPatientDialog({
  open,
  onOpenChange,
  services: initialServices,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  services: ReturnType<typeof store.getServices>;
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
    if (!name || !phone || !email || !dateOfBirth) {
      toast.error("Заполните все обязательные поля");
      return;
    }

    const patient: Patient = {
      id: `patient_${Date.now()}_${Math.random()}`,
      name,
      phone,
      email,
      dateOfBirth,
      isChild,
      address,
      notes,
      teeth,
      services: selectedServices,
      balance: price ? parseFloat(price) || 0 : 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await store.savePatient(patient);
    toast.success("Пациент добавлен");

    // Reset form
    setName("");
    setPhone("");
    setEmail("");
    setDateOfBirth("");
    setIsChild(false);
    setAddress("");
    setNotes("");
    setTeeth([]);
    setSelectedServices([]);
    setPrice("");
    setVisitNotes("");
    setServiceSearchOpen(false);
    setIsCreatingService(false);
    setNewServiceName("");
    setServiceSearchQuery("");
    onOpenChange(false);
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
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">
                Дата рождения <span className="text-destructive">*</span>
              </Label>
              <Input
                id="dob"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                required
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
            <ToothChart
              teeth={teeth}
              isChild={isChild}
              onToothChange={setTeeth}
            />
          </div>

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
                                const isSelected = selectedServices.includes(service.id);
                                return (
                                  <CommandItem
                                    key={service.id}
                                    value={service.name}
                                    onSelect={() => {
                                      if (!isSelected) {
                                        setSelectedServices([...selectedServices, service.id]);
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
            {selectedServices.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedServices.map((serviceId) => {
                  const service = services.find((s) => s.id === serviceId);
                  return (
                    <div
                      key={serviceId}
                      className="flex items-center gap-2 px-3 py-1 bg-secondary rounded-full text-sm"
                    >
                      <span>{service?.name || serviceId}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedServices(
                            selectedServices.filter((id) => id !== serviceId)
                          )
                        }
                        className="text-destructive hover:text-destructive/80"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Цена/Стоимость</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Введите стоимость"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="visitNotes">Заметки о визите</Label>
            <Textarea
              id="visitNotes"
              value={visitNotes}
              onChange={(e) => setVisitNotes(e.target.value)}
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
  const [visits, setVisits] = useState(() => 
    store.getVisits()
      .filter((v) => v.patientId === patient.id)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const [visitCostInputs, setVisitCostInputs] = useState<Record<string, string>>(
    {}
  );

  // Refresh visits and patient data periodically to catch updates from other users
  useEffect(() => {
    const refreshData = () => {
      // Refresh visits
      const updatedVisits = store.getVisits()
        .filter((v) => v.patientId === patient.id)
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      setVisits(updatedVisits);
      
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
                      label: "Стоимость визита",
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
                            Стоимость визита
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
                            placeholder="Введите стоимость визита"
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
                                    <div>
                                      <p className="text-sm font-medium">
                                        {payment.amount.toFixed(2)} смн
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {format(new Date(payment.date), "dd.MM.yyyy")}
                                      </p>
                                    </div>
                                    <Badge variant={methodVariant} className="text-xs">
                                      {methodLabel}
                                    </Badge>
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
    </Dialog>
  );
}

export default Patients;
