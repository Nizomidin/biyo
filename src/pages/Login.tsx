import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { store, Doctor, Subscription } from "@/lib/store";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { parseISO } from "date-fns";

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
      try {
        user = await store.fetchUserByEmail(email) || undefined;
      } catch (error) {
        console.error("Failed to fetch user:", error);
        toast.error("Не удалось подключиться к серверу. Проверьте подключение к интернету.");
        setIsLoading(false);
        return;
      }
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
      try {
        await store.fetchClinicById(user.clinicId);
      } catch (error) {
        console.error("Failed to fetch clinic:", error);
        // Continue anyway, clinic info will be fetched later if needed
      }
    }

    store.setCurrentUser(user);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("user-login-time", Date.now().toString());
      localStorage.removeItem("onboarding-tour-shown");
    }
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
    
    // Initialize default subscription if none exists (free trial, monthly, start plan for 1 doctor)
    const existingSubscription = store.getSubscription(user.clinicId);
    if (!existingSubscription) {
      const accountCreatedDate = parseISO(user.createdAt);
      const trialEndDate = new Date(accountCreatedDate);
      trialEndDate.setDate(trialEndDate.getDate() + 14); // Trial ends 14 days from account creation
      
      const nextPaymentDate = new Date(trialEndDate); // Payment due when trial ends
      
      const defaultSubscription: Subscription = {
        id: `subscription_${Date.now()}`,
        clinicId: user.clinicId,
        plan: "start" as const,
        period: "monthly" as const,
        startDate: accountCreatedDate.toISOString(),
        nextPaymentDate: nextPaymentDate.toISOString(),
        isActive: true,
        createdAt: accountCreatedDate.toISOString(),
        isTrial: true,
        trialEndDate: trialEndDate.toISOString(),
      };
      
      await store.saveSubscription(defaultSubscription);
    }
    
    toast.success("Вход выполнен");
    setIsLoading(false);
    
    // Small delay to ensure state propagates before navigation
    setTimeout(() => {
      navigate("/", { replace: true });
    }, 100);
  };

  useEffect(() => {
    // Force light mode for login page
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
    
    return () => {
      // Cleanup if needed
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex flex-col lg:flex-row relative">
      {/* Force light mode */}
      <style>{`
        html, body {
          background-color: #ecfdf5 !important;
          color: #0f172a !important;
        }
        .dark {
          display: none !important;
        }
        #login-form input:focus {
          scroll-margin-top: 0;
        }
      `}</style>
      
      <Button
        variant="ghost"
        onClick={() => navigate("/")}
        className="absolute top-4 left-4 gap-2 z-10"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад
      </Button>

      {/* Mobile: Show left content at top */}
      <div className="lg:hidden w-full px-6 pt-20 pb-6 bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="space-y-4 text-center max-w-md mx-auto">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-200/60 shadow-sm">
              <img
                src="/ser.png"
                alt="Serkor"
                className="h-full w-full rounded-full object-cover"
              />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 leading-tight">
            <span className="block">Используйте <span className="text-emerald-600">Serkor</span></span>
            <span className="block"><span className="text-emerald-600">бесплатно</span> 2 недели</span>
          </h2>
          <p className="text-base text-slate-700 leading-relaxed">
            <span className="block">После этого мы свяжемся с вами</span>
            <span className="block">и продолжим с платной версией, если вы захотите</span>
          </p>
          <div className="pt-2">
            <a
              href="/#pricing"
              onClick={(e) => {
                e.preventDefault();
                navigate('/');
                setTimeout(() => {
                  const pricingElement = document.getElementById('pricing');
                  if (pricingElement) {
                    const headerOffset = 80;
                    const elementPosition = pricingElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                    
                    window.scrollTo({
                      top: offsetPosition,
                      behavior: 'smooth'
                    });
                  }
                }, 100);
              }}
              className="text-sm text-emerald-600 hover:text-emerald-700 underline cursor-pointer"
            >
              посмотреть цены
            </a>
          </div>
        </div>
      </div>

      {/* Left Side Content - Desktop */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 xl:px-16 bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="max-w-md space-y-10">
          <div className="flex justify-center mb-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-200/60 shadow-sm">
              <img
                src="/ser.png"
                alt="Serkor"
                className="h-full w-full rounded-full object-cover"
              />
            </div>
          </div>
          <div className="space-y-8">
            <h2 className="text-6xl font-bold text-slate-900 leading-tight">
              <span className="block whitespace-nowrap">Используйте <span className="text-emerald-600">Serkor</span></span>
              <span className="block whitespace-nowrap"><span className="text-emerald-600">бесплатно</span> 2 недели</span>
            </h2>
            <p className="text-3xl text-slate-700 leading-relaxed">
              <span className="block whitespace-nowrap">После этого мы свяжемся с вами</span>
              <span className="block whitespace-nowrap">и продолжим с платной версией, если вы захотите</span>
            </p>
          </div>
          <div className="pt-6">
            <a
              href="/#pricing"
              onClick={(e) => {
                e.preventDefault();
                navigate('/');
                setTimeout(() => {
                  const pricingElement = document.getElementById('pricing');
                  if (pricingElement) {
                    const headerOffset = 80;
                    const elementPosition = pricingElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                    
                    window.scrollTo({
                      top: offsetPosition,
                      behavior: 'smooth'
                    });
                  }
                }, 100);
              }}
              className="text-lg text-emerald-600 hover:text-emerald-700 underline cursor-pointer"
            >
              посмотреть цены
            </a>
          </div>
        </div>
      </div>

      {/* Right Side - Login Card */}
      <div id="login-form" className="w-full lg:w-1/2 flex items-center justify-start p-4 lg:pl-8 lg:pr-16 pt-8 lg:pt-0">
        <Card className="w-full max-w-md p-8 bg-white">
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2">
                <span className="text-emerald-600">Serkor</span>
              </h1>
              <p className="text-slate-900">Вход в систему</p>
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
                  className="bg-white h-12 text-base text-slate-900 placeholder:text-slate-400"
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

    </div>
  );
};

export default Login;

