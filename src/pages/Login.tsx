import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { store, Doctor } from "@/lib/store";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!email) {
      toast.error("Введите email");
      setIsLoading(false);
      return;
    }

    let user = store.getUserByEmail(email);

    if (!user) {
      user = await store.fetchUserByEmailFromAPI(email) || undefined;
    }
    
    if (!user) {
      // User doesn't exist, redirect to signup with email pre-filled
      setIsLoading(false);
      navigate(`/signup?email=${encodeURIComponent(email)}`);
      return;
    }

    // Ensure clinic info is cached before continuing
    const clinic = store.getClinicById(user.clinicId);
    if (!clinic) {
      await store.fetchClinicByIdFromAPI(user.clinicId);
    }

    store.setCurrentUser(user);
    // Migrate existing data to this clinic if needed
    store.migrateDataToClinic(user.clinicId);
    
    // If user is not admin, ensure they have a doctor profile linked
    if (user.role !== "admin") {
      const allDoctors = store.getDoctors();
      // Check if doctor exists with userId link
      let userDoctor = allDoctors.find((d) => d.userId === user.id);
      
      // If not found, try to find by email
      if (!userDoctor) {
        userDoctor = allDoctors.find((d) => d.email === user.email && d.clinicId === user.clinicId);
        // If found by email, link it to the user
        if (userDoctor) {
          userDoctor.userId = user.id;
          await store.saveDoctor(userDoctor);
        }
      }
      
      // If still not found, create a new doctor profile
      if (!userDoctor) {
        const doctorColors = ["blue", "emerald", "red", "yellow", "purple"];
        const randomColor = doctorColors[Math.floor(Math.random() * doctorColors.length)];
        
        const doctor: Doctor = {
          id: `doctor_${Date.now()}_${Math.random()}`,
          name: user.email.split("@")[0], // Use email prefix as default name
          specialization: user.proficiency || undefined,
          email: user.email,
          userId: user.id, // Link doctor to user account
          color: randomColor,
          clinicId: user.clinicId,
        };
        
        await store.saveDoctor(doctor);
      }
    }
    
    // Initialize default services for this clinic if needed
    await store.initializeDefaultServices();
    toast.success("Вход выполнен");
    navigate("/");
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">БИ Biyo</h1>
            <p className="text-muted-foreground">Вход в систему</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
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

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Вход..." : "Войти"}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            <p>Нет аккаунта?</p>
            <Button
              variant="link"
              className="p-0 h-auto"
              onClick={() => navigate("/signup")}
            >
              Зарегистрироваться
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Login;

