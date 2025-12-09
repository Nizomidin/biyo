import { CheckCircle, FolderOpen, Play, Shield } from "lucide-react";

const InstallGuide = () => {
  const steps = [
    {
      number: 1,
      icon: FolderOpen,
      title: "Откройте скачанный файл",
      description: "Найдите файл BiyoSetup.zip в папке загрузок, распакуйте его и запустите установщик",
    },
    {
      number: 2,
      icon: Shield,
      title: "Нажмите «Подробнее»",
      description: "Windows может показать предупреждение. Нажмите на ссылку «Подробнее»",
      image: "/setup_moreinfo.png",
    },
    {
      number: 3,
      icon: Play,
      title: "Нажмите «Выполнить в любом случае»",
      description: "После этого появится кнопка «Выполнить в любом случае» — нажмите на неё",
      image: "/setup_runanyway.png",
    },
    {
      number: 4,
      icon: CheckCircle,
      title: "Завершите установку",
      description: "Следуйте инструкциям установщика для завершения процесса",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
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

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-200/60 shadow-sm">
              <CheckCircle className="h-10 w-10 text-emerald-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Загрузка <span className="text-emerald-600">началась!</span>
          </h1>
          <p className="text-xl text-slate-600">
            Следуйте инструкции ниже для установки приложения
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-8">
          {steps.map((step) => (
            <div
              key={step.number}
              className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white font-bold text-lg shadow-md">
                    {step.number}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <step.icon className="h-5 w-5 text-emerald-600" />
                    <h3 className="text-xl font-semibold text-slate-900">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-slate-600 mb-4">{step.description}</p>
                  {step.image && (
                    <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 shadow-md">
                      <img
                        src={step.image}
                        alt={step.title}
                        className="w-full h-auto"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-12 text-center">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <p className="text-amber-800">
              <strong>Примечание:</strong> Предупреждение Windows появляется потому, что приложение
              ещё не имеет цифровой подписи. Это безопасно — вы скачали файл с официального сайта.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallGuide;
