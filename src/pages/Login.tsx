import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { store } from "@/lib/store";
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

    const user = store.getUserByEmail(email);
    
    if (!user) {
      // User doesn't exist, redirect to signup with email pre-filled
      setIsLoading(false);
      navigate(`/signup?email=${encodeURIComponent(email)}`);
      return;
    }

    store.setCurrentUser(user);
    // Migrate existing data to this clinic if needed
    store.migrateDataToClinic(user.clinicId);
    // Initialize default services for this clinic if needed
    store.initializeDefaultServices();
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

