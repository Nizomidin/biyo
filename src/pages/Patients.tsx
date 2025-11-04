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
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";

type FilterType = "debt" | "untreated" | "children" | "adults";

const Patients = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Set<FilterType>>(new Set());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);

  const patients = store.getPatients();
  const services = store.getServices();

  const visits = store.getVisits();

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

  const handleSubmit = (e: React.FormEvent) => {
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

    store.savePatient(patient);
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
  const [teeth, setTeeth] = useState(patient.teeth);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [selectedVisitForPayment, setSelectedVisitForPayment] = useState<
    string | null
  >(null);

  // Update patient state when initialPatient changes (but preserve teeth changes if editing)
  useEffect(() => {
    setPatient(initialPatient);
    // Only update teeth if not currently editing, otherwise preserve user's changes
    if (!isEditing && !isEditingTeeth) {
      setTeeth(initialPatient.teeth || []);
    }
  }, [initialPatient, isEditing, isEditingTeeth]);

  const visits = store
    .getVisits()
    .filter((v) => v.patientId === patient.id)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  const handleSavePatient = () => {
    const updatedPatient = { ...patient, teeth };
    store.savePatient(updatedPatient);
    setPatient(updatedPatient);
    setIsEditing(false);
    setIsEditingTeeth(false);
    toast.success("Данные пациента обновлены");
  };

  const handleCancelEdit = () => {
    setPatient(initialPatient);
    setTeeth(initialPatient.teeth);
    setIsEditing(false);
    setIsEditingTeeth(false);
  };

  const handleSaveTeeth = () => {
    const updatedPatient = { ...patient, teeth };
    store.savePatient(updatedPatient);
    setPatient(updatedPatient);
    setIsEditingTeeth(false);
    toast.success("Зубная карта обновлена");
  };

  const handleAddPayment = (visitId: string) => {
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error("Введите корректную сумму");
      return;
    }

    store.addPayment(visitId, amount);
    toast.success("Платеж добавлен");
    
    // Update patient balance
    const updatedPatient = store.getPatients().find(p => p.id === patient.id);
    if (updatedPatient) {
      updatedPatient.balance = store.calculatePatientBalance(patient.id);
      store.savePatient(updatedPatient);
      setPatient(updatedPatient);
    }
    
    setPaymentAmount("");
    setSelectedVisitForPayment(null);
  };

  const totalSpent = visits.reduce((sum, v) => sum + v.cost, 0);
  const totalPaid = visits.reduce(
    (sum, v) => sum + (v.payments?.reduce((p, pay) => p + pay.amount, 0) || 0),
    0
  );
  const lastVisit = visits[0];
  const nextVisit = visits.find((v) => v.status === "scheduled");

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
                  
                  // Handle services - both legacy (string[]) and new (VisitService[]) formats
                  let serviceList: string[] = [];
                  if (Array.isArray(visit.services) && visit.services.length > 0) {
                    if (typeof visit.services[0] === 'string') {
                      serviceList = (visit.services as string[]).map(id => {
                        const service = services.find((s) => s.id === id);
                        return service?.name || id;
                      });
                    } else {
                      serviceList = (visit.services as VisitService[]).map((vs) => {
                        const service = services.find((s) => s.id === vs.serviceId);
                        const name = service?.name || vs.serviceId;
                        return vs.quantity > 1 ? `${name} (x${vs.quantity})` : name;
                      });
                    }
                  }
                  
                  const totalPaidForVisit =
                    visit.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
                  const remainingBalance = visit.cost - totalPaidForVisit;

                  return (
                    <Card key={visit.id} className="p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <p className="font-medium text-lg mb-1">
                            {format(new Date(visit.startTime), "dd.MM.yyyy HH:mm", {
                              locale: ru,
                            })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Врач: {doctor?.name || "Не указан"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Статус:{" "}
                            {visit.status === "scheduled"
                              ? "Запланирован"
                              : visit.status === "completed"
                                ? "Завершен"
                                : "Отменен"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-lg">{visit.cost.toFixed(2)} смн</p>
                          <p className="text-sm text-muted-foreground">
                            Оплачено: {totalPaidForVisit.toFixed(2)} смн
                          </p>
                          {remainingBalance > 0 && (
                            <p className="text-sm text-orange-500 font-medium">
                              Остаток: {remainingBalance.toFixed(2)} смн
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Services */}
                      {serviceList.length > 0 && (
                        <div className="mb-3">
                          <Label className="text-sm font-medium mb-1 block">Выполненные услуги:</Label>
                          <div className="space-y-2">
                            {Array.isArray(visit.services) && visit.services.length > 0 && typeof visit.services[0] !== 'string' ? (
                              // New format with VisitService[]
                              (visit.services as VisitService[]).map((vs, idx) => {
                                const service = services.find((s) => s.id === vs.serviceId);
                                const serviceName = service?.name || vs.serviceId;
                                const serviceTeeth = vs.teeth && vs.teeth.length > 0 ? vs.teeth.sort((a, b) => a - b) : null;
                                
                                // Build display name with quantity and teeth
                                let displayName = vs.quantity > 1 ? `${serviceName} (x${vs.quantity})` : serviceName;
                                if (serviceTeeth) {
                                  displayName += ` - зубы: ${serviceTeeth.join(", ")}`;
                                }
                                
                                return (
                                  <div key={idx} className="flex items-start gap-2">
                                    <span className="px-2 py-1 bg-secondary text-sm rounded flex-1">
                                      {displayName}
                                    </span>
                                  </div>
                                );
                              })
                            ) : (
                              // Legacy format - show services with treated teeth from visit level
                              serviceList.map((serviceName, idx) => {
                                // Show treated teeth for all services, not just the first one
                                const treatedTeeth = visit.treatedTeeth && visit.treatedTeeth.length > 0 
                                  ? visit.treatedTeeth.sort((a, b) => a - b) 
                                  : null;
                                const displayName = treatedTeeth 
                                  ? `${serviceName} - зубы: ${treatedTeeth.join(", ")}`
                                  : serviceName;
                                
                                return (
                                  <div key={idx} className="flex items-start gap-2">
                                    <span className="px-2 py-1 bg-secondary text-sm rounded flex-1">
                                      {displayName}
                                    </span>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}

                      {/* Treated Teeth */}
                      {visit.treatedTeeth && visit.treatedTeeth.length > 0 && (
                        <div className="mb-3">
                          <Label className="text-sm font-medium mb-1 block">Проведено лечение зубов:</Label>
                          <div className="flex flex-wrap gap-1">
                            {visit.treatedTeeth.sort((a, b) => a - b).map((toothNum) => (
                              <span
                                key={toothNum}
                                className="px-2 py-1 bg-blue-500/20 text-blue-500 text-sm rounded font-medium"
                              >
                                {toothNum}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {visit.notes && (
                        <div className="mb-3">
                          <Label className="text-sm font-medium mb-1 block">Заметки:</Label>
                          <p className="text-sm text-muted-foreground">{visit.notes}</p>
                        </div>
                      )}

                      {/* Payment Section */}
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-sm font-medium">Оплата</Label>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Сумма платежа"
                            value={
                              selectedVisitForPayment === visit.id
                                ? paymentAmount
                                : ""
                            }
                            onChange={(e) => {
                              setPaymentAmount(e.target.value);
                              setSelectedVisitForPayment(visit.id);
                            }}
                            className="flex-1"
                          />
                          <Button
                            size="sm"
                            onClick={() => {
                              handleAddPayment(visit.id);
                              // Refresh patient data to update balance
                              const updatedPatient = store.getPatients().find(p => p.id === patient.id);
                              if (updatedPatient) {
                                setPatient(updatedPatient);
                              }
                            }}
                            disabled={!paymentAmount || selectedVisitForPayment !== visit.id}
                          >
                            Добавить платеж
                          </Button>
                        </div>
                        {visit.payments && visit.payments.length > 0 && (
                          <div className="mt-3 space-y-1">
                            <Label className="text-xs text-muted-foreground">История платежей:</Label>
                            {visit.payments.map((payment) => (
                              <p key={payment.id} className="text-xs text-muted-foreground pl-2">
                                {format(new Date(payment.date), "dd.MM.yyyy")}:{" "}
                                {payment.amount.toFixed(2)} смн
                              </p>
                            ))}
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
                <p className={patient.balance > 0 ? "text-orange-500" : ""}>
                  {patient.balance.toFixed(2)} смн
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
