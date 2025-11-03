import { Search, Plus, ArrowUpDown, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface Patient {
  id: string;
  name: string;
  phone: string;
  balance: number;
}

const mockPatients: Patient[] = [
  { id: "1", name: "ewq", phone: "321", balance: 0 },
  { id: "2", name: "hg", phone: "707097", balance: 0 },
  { id: "3", name: "asdasd", phone: "21312312", balance: 0 },
  { id: "4", name: "asasd", phone: "asdasdasd", balance: 0 },
  { id: "5", name: "asasd", phone: "13", balance: 0 },
  { id: "6", name: "asas", phone: "12", balance: 0 },
  { id: "7", name: "qSASD", phone: "123123123", balance: 0 },
];

const Patients = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1400px] mx-auto">
        <Card className="bg-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Пациенты</h1>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              <Plus className="h-4 w-4" />
              Добавить пациента
            </Button>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по имени, телефону или email..."
                className="pl-10 bg-secondary border-0"
              />
            </div>
            <Button variant="ghost" size="icon" className="rounded-lg">
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2 mb-6">
            <Button variant="secondary" size="sm" className="text-sm">
              Есть долг
            </Button>
            <Button variant="secondary" size="sm" className="text-sm">
              Нелеченные зубы
            </Button>
            <Button variant="secondary" size="sm" className="text-sm">
              Дети
            </Button>
            <Button variant="secondary" size="sm" className="text-sm">
              Взрослые
            </Button>
          </div>

          <div className="space-y-3">
            {mockPatients.map((patient) => (
              <div
                key={patient.id}
                className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
              >
                <div>
                  <div className="font-medium mb-1">{patient.name}</div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {patient.phone}
                  </div>
                </div>
                <div className="text-primary font-medium">
                  {patient.balance.toFixed(2)} смн
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Patients;
