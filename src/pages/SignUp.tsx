import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { store, User, Clinic, Doctor, Service, Subscription } from "@/lib/store";
import { apiClient } from "@/lib/api";
import { parseISO } from "date-fns";
import { toast } from "sonner";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { ArrowRight, ArrowLeft, ChevronDown } from "lucide-react";

const SignUp = () => {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  
  // Pre-fill email from URL parameter if provided
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);
  const [clinicName, setClinicName] = useState("");
  const [proficiency, setProficiency] = useState("");
  const [phone, setPhone] = useState("+992 ");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [clinicExists, setClinicExists] = useState<boolean | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const navigate = useNavigate();

  // Check if clinic exists as user types
  useEffect(() => {
    if (clinicName.trim().length > 0) {
      const existingClinics = store.getClinics();
      const exists = existingClinics.some((c) => 
        c.name.toLowerCase().trim() === clinicName.toLowerCase().trim()
      );
      setClinicExists(exists);
    } else {
      setClinicExists(null);
    }
  }, [clinicName]);

  // Check email as user types
  useEffect(() => {
    const checkEmail = async () => {
      if (!email || email.length < 3) return;
      
      // Basic email format check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) return;
      
      setIsCheckingEmail(true);
      try {
        await store.fetchAllUsersFromAPI();
        const existingUser = store.getUserByEmail(email);
        if (existingUser) {
          toast.info("Аккаунт с таким email уже существует. Переход на страницу входа...");
          setTimeout(() => {
            navigate("/login");
          }, 500);
        }
      } catch (error) {
        console.error('Failed to check email:', error);
      } finally {
        setIsCheckingEmail(false);
      }
    };

    const timeoutId = setTimeout(checkEmail, 1000); // Debounce for 1 second
    
    return () => clearTimeout(timeoutId);
  }, [email, navigate]);

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    
    store.fetchClinicsFromAPI().catch((error) => console.error('Failed to prefetch clinics:', error));
    store.fetchAllUsersFromAPI().catch((error) => console.error('Failed to prefetch users:', error));
    
    // Force light mode for sign-up page
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
    
    // Auto scroll down when inputs are focused
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' && target.closest('#signup-form')) {
        setTimeout(() => {
          const formElement = document.getElementById('signup-form');
          if (formElement) {
            const headerOffset = 80;
            const elementPosition = formElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            
            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });
          }
        }, 100);
      }
    };
    
    document.addEventListener('focusin', handleFocus);
    
    return () => {
      document.removeEventListener('focusin', handleFocus);
    };
  }, []);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Remove all non-digit characters except + at the start
    const digitsOnly = value.replace(/[^\d\+]/g, "");
    
    // If user tries to delete +992, prevent it
    if (!digitsOnly.startsWith("+992") && digitsOnly.length > 0) {
      // If they're typing, ensure +992 prefix
      if (digitsOnly.startsWith("992")) {
        value = "+" + digitsOnly;
      } else if (!digitsOnly.startsWith("+")) {
        value = "+992 " + digitsOnly.replace(/^992/, "");
      } else {
        value = "+992 " + digitsOnly.replace(/^\+992/, "");
      }
    } else if (digitsOnly.startsWith("+992")) {
      // Format: +992 XX XXX XXXX
      const numberPart = digitsOnly.substring(4); // Remove +992
      if (numberPart.length <= 2) {
        value = "+992 " + numberPart;
      } else if (numberPart.length <= 5) {
        value = "+992 " + numberPart.substring(0, 2) + " " + numberPart.substring(2);
      } else {
        value = "+992 " + numberPart.substring(0, 2) + " " + numberPart.substring(2, 5) + " " + numberPart.substring(5, 9);
      }
    } else {
      value = "+992 ";
    }
    
    setPhone(value);
  };

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Введите email");
      return;
    }
    
    // Check if user already exists
    await store.fetchAllUsersFromAPI();
    const existingUser = store.getUserByEmail(email);
    if (existingUser) {
      toast.info("Аккаунт с таким email уже существует. Переход на страницу входа...");
      setTimeout(() => {
        navigate("/login");
      }, 500);
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
    // Validate phone number - should be +992 followed by at least 9 digits
    const phoneDigits = phone.replace(/\D/g, "");
    if (!phone.trim() || phone.trim() === "+992" || phoneDigits.length < 12) {
      toast.error("Введите полный номер телефона");
      return;
    }
    
    await store.fetchClinicsFromAPI();
    const existingClinics = store.getClinics();
    const existingClinic = existingClinics.find((c) => c.name === clinicName);

    // Check if clinic already has an admin
    
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

    try {
      // Check if user already exists via API
      const existingUserFromAPI = await apiClient.getUserByEmail(email);
      if (existingUserFromAPI) {
        toast.info("Аккаунт с таким email уже существует. Переход на страницу входа...");
        setIsLoading(false);
        setTimeout(() => {
          navigate("/login");
        }, 500);
        return;
      }

      // Create or get clinic - save to API first
      let clinic: Clinic;
      const existingClinics = await apiClient.getClinics();
      const existingClinic = existingClinics.find((c) => c.name === clinicName);
      
      if (existingClinic) {
        clinic = existingClinic;
      } else {
        // Don't provide id - let backend generate it for new clinics
        const newClinic: Omit<Clinic, 'id'> = {
          name: clinicName,
          createdAt: new Date().toISOString(),
        };
        const savedClinic = await apiClient.saveClinic(newClinic);
        if (!savedClinic) {
          throw new Error("Не удалось создать клинику");
        }
        clinic = savedClinic;
        // Cache in localStorage after successful API save
        await store.saveClinic(clinic, { skipApi: true });
      }

      // Check if clinic already has admin (additional check)
      if (isAdmin) {
        const clinicUsers = await apiClient.getUsers(clinic.id);
        const hasAdmin = clinicUsers.some((u) => u.role === "admin");
        if (hasAdmin) {
          toast.error("У этой клиники уже есть администратор");
          setIsLoading(false);
          return;
        }
      }

      // Create user - save to API first
      // Don't provide id - let backend generate it for new users
      const newUser: Omit<User, 'id'> = {
        email,
        phone: phone.trim(),
        clinicId: clinic.id,
        proficiency,
        role: isAdmin ? "admin" : "user",
        createdAt: new Date().toISOString(),
      };

      const savedUser = await apiClient.saveUser(newUser);
      if (!savedUser) {
        throw new Error("Не удалось сохранить пользователя");
      }
      
      // Cache in localStorage after successful API save
      await store.saveUser(savedUser, { skipApi: true });
      store.setCurrentUser(savedUser);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("user-login-time", Date.now().toString());
        localStorage.removeItem("onboarding-tour-shown");
      }
      
      // Initialize default subscription if none exists (free trial, monthly, start plan for 1 doctor)
      // Note: Subscription is stored locally only (no API endpoint yet)
      const existingSubscription = store.getSubscription(savedUser.clinicId);
      if (!existingSubscription) {
        const accountCreatedDate = parseISO(savedUser.createdAt);
        const trialEndDate = new Date(accountCreatedDate);
        trialEndDate.setDate(trialEndDate.getDate() + 14); // Trial ends 14 days from account creation
        
        const nextPaymentDate = new Date(trialEndDate); // Payment due when trial ends
        
        const defaultSubscription: Subscription = {
          id: `subscription_${Date.now()}`,
          clinicId: savedUser.clinicId,
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
      
      // If user is not admin, create a doctor profile for them - save to API first
      if (!isAdmin) {
        const doctorColors = ["blue", "emerald", "red", "yellow", "purple"];
        const randomColor = doctorColors[Math.floor(Math.random() * doctorColors.length)];
        
        // Don't provide id - let backend generate it for new doctors
        const newDoctor: Omit<Doctor, 'id'> = {
          name: email.split("@")[0], // Use email prefix as default name
          specialization: proficiency || undefined,
          email: email,
          userId: savedUser.id, // Link doctor to user account
          color: randomColor,
          clinicId: clinic.id,
        };
        
        const savedDoctor = await apiClient.saveDoctor(newDoctor);
        if (savedDoctor) {
          // Cache in localStorage after successful API save
          await store.saveDoctor(savedDoctor, { skipApi: true });
        }
      }
      
      // Initialize default services for this clinic - save to API first
      const existingServices = await apiClient.getServices(clinic.id);
      if (existingServices.length === 0) {
        // Don't provide id - let backend generate it for new services
        const defaultServices: Omit<Service, 'id'>[] = [
          // Лечебная стоматология
          { name: "Пломбирование корневых каналов", defaultPrice: 0, clinicId: clinic.id },
          { name: "Пломбирование передних зубов", defaultPrice: 0, clinicId: clinic.id },
          { name: "Пломбирование боковых зубов", defaultPrice: 0, clinicId: clinic.id },
          { name: "Реставрация зуба", defaultPrice: 0, clinicId: clinic.id },
          { name: "Деветелизирующая паста", defaultPrice: 0, clinicId: clinic.id },
          { name: "Стекловолоконный штифт", defaultPrice: 0, clinicId: clinic.id },
          
          // Ортопедическая стоматология
          { name: "Металлокерамическая коронка", defaultPrice: 0, clinicId: clinic.id },
          { name: "Диоксид цирконий", defaultPrice: 0, clinicId: clinic.id },
          { name: "Открыто винтовая коронка на имплантах", defaultPrice: 0, clinicId: clinic.id },
          { name: "Культовая вкладка", defaultPrice: 0, clinicId: clinic.id },
          { name: "Напиленные коронки", defaultPrice: 0, clinicId: clinic.id },
          { name: "Бюгельный протез", defaultPrice: 0, clinicId: clinic.id },
          { name: "Простой съемный протез", defaultPrice: 0, clinicId: clinic.id },
          { name: "Баллочная фиксация на имплантах с диоксид цирконий", defaultPrice: 0, clinicId: clinic.id },
          { name: "Баллочная акриловая фиксация на имплантах", defaultPrice: 0, clinicId: clinic.id },
          { name: "Диоксид цирконий с абатменом", defaultPrice: 0, clinicId: clinic.id },
          
          // Хирургическая стоматология
          { name: "Удаление зуба", defaultPrice: 0, clinicId: clinic.id },
          { name: "Пластика уздечки", defaultPrice: 0, clinicId: clinic.id },
          { name: "Удаление ретентрованного зуба", defaultPrice: 0, clinicId: clinic.id },
          { name: "Удаление зуба мудрости", defaultPrice: 0, clinicId: clinic.id },
          { name: "Зашивание лунки", defaultPrice: 0, clinicId: clinic.id },
          
          // Имплантология
          { name: "Имплантация Dentium", defaultPrice: 0, clinicId: clinic.id },
          { name: "Имплантация Osstem", defaultPrice: 0, clinicId: clinic.id },
          { name: "Имплантация Impro", defaultPrice: 0, clinicId: clinic.id },
          { name: "Формирователь десны", defaultPrice: 0, clinicId: clinic.id },
          { name: "Мультиюниты", defaultPrice: 0, clinicId: clinic.id },
          { name: "Мембрана", defaultPrice: 0, clinicId: clinic.id },
          { name: "Костная пластика", defaultPrice: 0, clinicId: clinic.id },
          { name: "Синус лифтинг", defaultPrice: 0, clinicId: clinic.id },
          
          // Одноразовые наборы
          { name: "Одноразовый набор", defaultPrice: 0, clinicId: clinic.id },
          { name: "Тесты на гепатит В С и СПИД", defaultPrice: 0, clinicId: clinic.id },
          { name: "Анестезия", defaultPrice: 0, clinicId: clinic.id },
          { name: "Рентген", defaultPrice: 0, clinicId: clinic.id },
        ];

        // Save services to API first, then cache in localStorage
        for (const service of defaultServices) {
          const savedService = await apiClient.saveService(service);
          if (savedService) {
            await store.saveService(savedService, { skipApi: true });
          }
        }
      }
      
      toast.success("Регистрация успешна");
      setIsLoading(false);
      
      // Small delay to ensure state propagates before navigation
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 100);
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(error instanceof Error ? error.message : "Ошибка при регистрации");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex flex-col lg:flex-row relative">
      {/* Force light mode */}
      <style>{`
        html, body {
          background-color: #ecfdf5 !important;
          color: #0f172a !important;
          overflow-x: hidden;
        }
        .dark {
          display: none !important;
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

      {/* Right Side - Sign Up Card */}
      <div id="signup-form" className="w-full lg:w-1/2 flex items-center justify-start p-4 lg:pl-8 lg:pr-16 pt-8 lg:pt-0">
        <Card className="w-full max-w-md p-8 bg-white">
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2">
                <span className="text-emerald-600">Serkor</span>
              </h1>
              <p className="text-slate-900">Регистрация</p>
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
                  className="bg-white h-12 text-base text-slate-900 placeholder:text-slate-400"
                  disabled={isCheckingEmail}
                />
                {isCheckingEmail && (
                  <p className="text-xs text-muted-foreground">Проверка...</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="clinicName">Название клиники</Label>
                <Input
                  id="clinicName"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder="Название вашей клиники"
                  required
                  className="bg-white h-12 text-base text-slate-900 placeholder:text-slate-400"
                />
                {clinicExists !== null && clinicName.trim().length > 0 && (
                  <p className={`text-xs flex items-center gap-1 ${
                    clinicExists 
                      ? "text-green-600" 
                      : "text-blue-600"
                  }`}>
                    {clinicExists ? (
                      <>
                        <span>✓</span>
                        <span>Эта клиника уже существует. Вы присоединитесь к ней.</span>
                      </>
                    ) : (
                      <>
                        <span>+</span>
                        <span>Эта клиника не существует. Будет создана новая клиника.</span>
                      </>
                    )}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="proficiency">Специализация</Label>
                <Input
                  id="proficiency"
                  value={proficiency}
                  onChange={(e) => setProficiency(e.target.value)}
                  placeholder="Ваша специализация"
                  required
                  className="bg-white h-12 text-base text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Номер телефона</Label>
                <div className="flex items-center gap-2">
                  <span className="text-base text-slate-900 font-medium">+992</span>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone.replace(/^\+992\s*/, "")}
                    onChange={(e) => {
                      const value = e.target.value;
                      setPhone("+992 " + value.replace(/^\+992\s*/, ""));
                    }}
                    placeholder="93 123 4567"
                    required
                    className="bg-white h-12 text-base text-slate-900 placeholder:text-slate-400 flex-1"
                  />
                </div>
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
              <div className="space-y-2">
                <Label>Номер телефона</Label>
                <p className="text-sm text-muted-foreground">{phone}</p>
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

    </div>
  );
};

export default SignUp;

