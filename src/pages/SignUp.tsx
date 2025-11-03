import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { store, User, Clinic } from "@/lib/store";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft } from "lucide-react";

const SignUp = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [proficiency, setProficiency] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Введите email");
      return;
    }
    if (!clinicName) {
      toast.error("Введите название клиники");
      return;
    }
    if (!proficiency) {
      toast.error("Введите вашу специализацию");
      return;
    }
    
    // Check if clinic already has an admin
    const existingClinics = store.getClinics();
    const existingClinic = existingClinics.find((c) => c.name === clinicName);
    
    if (existingClinic) {
      const clinicUsers = store.getUsersByClinic(existingClinic.id);
      const hasAdmin = clinicUsers.some((u) => u.role === "admin");
      if (hasAdmin) {
        // Clinic already has admin, set to user
        setIsAdmin(false);
      } else {
        // Clinic exists but no admin, allow admin selection
        setIsAdmin(true);
      }
    } else {
      // New clinic, allow admin selection
      setIsAdmin(true);
    }
    
    setStep(2);
  };

  const handleSignUp = async () => {
    setIsLoading(true);

    // Check if user already exists
    if (store.getUserByEmail(email)) {
      toast.error("Пользователь с таким email уже существует");
      setIsLoading(false);
      return;
    }

    // Create or get clinic
    let clinic: Clinic;
    const existingClinics = store.getClinics();
    const existingClinic = existingClinics.find((c) => c.name === clinicName);
    
    if (existingClinic) {
      clinic = existingClinic;
    } else {
      clinic = {
        id: `clinic_${Date.now()}_${Math.random()}`,
        name: clinicName,
        createdAt: new Date().toISOString(),
      };
      store.saveClinic(clinic);
    }

    // Check if clinic already has admin (additional check)
    if (isAdmin) {
      const clinicUsers = store.getUsersByClinic(clinic.id);
      const hasAdmin = clinicUsers.some((u) => u.role === "admin");
      if (hasAdmin) {
        toast.error("У этой клиники уже есть администратор");
        setIsLoading(false);
        return;
      }
    }

    // Create user
    const user: User = {
      id: `user_${Date.now()}_${Math.random()}`,
      email,
      clinicId: clinic.id,
      proficiency,
      role: isAdmin ? "admin" : "user",
      createdAt: new Date().toISOString(),
    };

    store.saveUser(user);
    store.setCurrentUser(user);
    
    toast.success("Регистрация успешна");
    navigate("/");
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">БИ Biyo</h1>
            <p className="text-muted-foreground">Регистрация</p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleStep1} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clinicName">Название клиники</Label>
                <Input
                  id="clinicName"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder="Название вашей клиники"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="proficiency">Специализация</Label>
                <Input
                  id="proficiency"
                  value={proficiency}
                  onChange={(e) => setProficiency(e.target.value)}
                  placeholder="Ваша специализация"
                  required
                />
              </div>

              <Button type="submit" className="w-full">
                Далее <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <p className="text-sm text-muted-foreground">{email}</p>
              </div>
              <div className="space-y-2">
                <Label>Клиника</Label>
                <p className="text-sm text-muted-foreground">{clinicName}</p>
              </div>
              <div className="space-y-2">
                <Label>Специализация</Label>
                <p className="text-sm text-muted-foreground">{proficiency}</p>
              </div>

              {(() => {
                // Check if clinic already has an admin
                const existingClinics = store.getClinics();
                const existingClinic = existingClinics.find((c) => c.name === clinicName);
                let clinicHasAdmin = false;
                
                if (existingClinic) {
                  const clinicUsers = store.getUsersByClinic(existingClinic.id);
                  clinicHasAdmin = clinicUsers.some((u) => u.role === "admin");
                }
                
                // Don't show admin option if clinic already has admin
                if (clinicHasAdmin) {
                  return null;
                }
                
                return (
                  <div className="space-y-2 pt-4 border-t">
                    <Label className="text-base">Роль</Label>
                    <div
                      className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
                        isAdmin
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary hover:bg-secondary/80"
                      }`}
                      onClick={() => setIsAdmin(!isAdmin)}
                    >
                      <span className="flex-1">Администратор</span>
                      <span className="text-sm opacity-70">(admin)</span>
                      {isAdmin && <span className="text-sm">✓</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {isAdmin
                        ? "Вы будете администратором этой клиники. Другие пользователи из той же клиники также будут видны здесь."
                        : "Нажмите, чтобы стать администратором этой клиники."}
                    </p>
                  </div>
                );
              })()}

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Назад
                </Button>
                <Button
                  type="button"
                  onClick={handleSignUp}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? "Регистрация..." : "Зарегистрироваться"}
                </Button>
              </div>
            </div>
          )}

          <div className="text-center text-sm text-muted-foreground">
            <p>Уже есть аккаунт?</p>
            <Button
              variant="link"
              className="p-0 h-auto"
              onClick={() => navigate("/login")}
            >
              Войти
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SignUp;

