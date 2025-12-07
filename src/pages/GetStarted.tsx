import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Globe, Download, CheckCircle } from "lucide-react";

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

      {/* Mobile: Show left content at top */}
      <div className="lg:hidden w-full px-6 pt-12 pb-6 bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="space-y-4 text-center max-w-md mx-auto">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-200/60 shadow-sm">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 leading-tight">
            <span className="block">Регистрация <span className="text-emerald-600">успешна!</span></span>
          </h2>
          <p className="text-base text-slate-700 leading-relaxed">
            <span className="block">Добро пожаловать в Serkor</span>
            <span className="block">Выберите как продолжить</span>
          </p>
        </div>
      </div>

      {/* Left Side Content - Desktop */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 xl:px-16 bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="max-w-md space-y-10">
          <div className="flex justify-center mb-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-200/60 shadow-sm">
              <CheckCircle className="h-12 w-12 text-emerald-600" />
            </div>
          </div>
          <div className="space-y-8">
            <h2 className="text-5xl font-bold text-slate-900 leading-tight">
              <span className="block whitespace-nowrap">Регистрация</span>
              <span className="block whitespace-nowrap text-emerald-600">успешна!</span>
            </h2>
            <p className="text-2xl text-slate-700 leading-relaxed">
              <span className="block">Добро пожаловать в Serkor</span>
              <span className="block">Выберите как продолжить</span>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Choice Cards */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:pl-8 lg:pr-16 pt-8 lg:pt-0">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">
              <span className="text-emerald-600">Как продолжить?</span>
            </h1>
            <p className="text-slate-600">Выберите удобный способ работы</p>
          </div>

          {/* Continue in Web Card */}
          <div
            className="group relative overflow-hidden rounded-[28px] bg-gradient-to-br from-emerald-300 via-teal-300 to-emerald-400 p-[2px] shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
            onClick={() => navigate("/")}
          >
            <div className="h-full rounded-[26px] bg-white p-8 space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg">
                  <Globe className="h-7 w-7" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-slate-900">
                    Продолжить в веб
                  </h3>
                  <p className="text-sm text-slate-600">Начать работу прямо сейчас</p>
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
                  navigate("/");
                }}
              >
                Продолжить в веб
              </Button>
            </div>
          </div>

          {/* Download Desktop Card */}
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
                    Скачать десктоп
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
        </div>
      </div>
    </div>
  );
};

export default GetStarted;
