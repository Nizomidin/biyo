import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Cloud, Download } from "lucide-react";

const GetStarted = () => {
  const navigate = useNavigate();

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = '/BiyoSetup.zip';
    link.download = 'BiyoSetup.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

      {/* Right Side - Choice Cards */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:pl-8 lg:pr-16 pt-8 lg:pt-0">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">
              <span className="text-emerald-600">Выберите способ</span>
            </h1>
            <p className="text-slate-600">Как вы хотите использовать Serkor?</p>
          </div>

          {/* Online Registration Card */}
          <div
            className="group relative overflow-hidden rounded-[28px] bg-gradient-to-br from-emerald-300 via-teal-300 to-emerald-400 p-[2px] shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
            onClick={() => navigate("/signup")}
          >
            <div className="h-full rounded-[26px] bg-white p-8 space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg">
                  <Cloud className="h-7 w-7" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-slate-900">
                    Регистрация онлайн
                  </h3>
                  <p className="text-sm text-slate-600">Работайте из любого места</p>
                </div>
              </div>

              <ul className="space-y-2 text-sm text-slate-600 pl-1">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                  <span>Доступ с любого устройства</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                  <span>Автоматическое резервное копирование</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                  <span>Совместная работа команды</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                  <span>Всегда актуальная версия</span>
                </li>
              </ul>

              <Button
                className="w-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/signup");
                }}
              >
                Начать онлайн
              </Button>
            </div>
          </div>

          {/* Offline Download Card */}
          <div
            className="group relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-300 via-slate-200 to-slate-300 p-[2px] shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
            onClick={handleDownload}
          >
            <div className="h-full rounded-[26px] bg-white p-8 space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-700 text-white shadow-lg">
                  <Download className="h-7 w-7" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-slate-900">
                    Скачать оффлайн версию
                  </h3>
                  <p className="text-sm text-slate-600">Работайте без интернета</p>
                </div>
              </div>

              <ul className="space-y-2 text-sm text-slate-600 pl-1">
                <li className="flex items-start gap-2">
                  <span className="text-slate-600 font-bold mt-0.5">✓</span>
                  <span>Полная автономность</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-600 font-bold mt-0.5">✓</span>
                  <span>Данные хранятся локально</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-600 font-bold mt-0.5">✓</span>
                  <span>Синхронизация при подключении</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-600 font-bold mt-0.5">✓</span>
                  <span>Для Windows компьютеров</span>
                </li>
              </ul>

              <Button
                className="w-full rounded-full bg-gradient-to-r from-slate-600 to-slate-700 text-white shadow-lg hover:shadow-xl transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload();
                }}
              >
                Скачать для Windows
              </Button>
            </div>
          </div>

          <div className="text-center text-sm text-slate-600 pt-4">
            <p>Уже есть аккаунт?</p>
            <Button
              variant="link"
              className="p-0 h-auto text-emerald-600"
              onClick={() => navigate("/login")}
            >
              Войти
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GetStarted;
