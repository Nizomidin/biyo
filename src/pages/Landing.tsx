import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Phone, Send, MessageCircle } from "lucide-react";

const navItems = [
  { id: "hero", label: "О нас" },
  { id: "problem", label: "Проблема" },
  { id: "solution", label: "Решение" },
  { id: "pricing", label: "Цены" },
  { id: "faq", label: "FAQ" },
];

const Landing = () => {
  const problemSections = [
    {
      id: "schedule-chaos",
      emoji: "📆",
      name: "Хаос в расписании",
      headline: "Пациенты теряются между кабинетами",
      description:
        "График ведётся в блокнотах и Excel. Переносы и отмены записываются вручную, поэтому пациенты приходят одновременно, а кабинеты простаивают.",
      bullets: [
        "Нет единого календаря по врачам и кабинетам",
        "Переносы не доходят до врача — появляется тройное бронирование",
        "Администраторы звонят по 40+ раз в день, чтобы уточнить время",
      ],
      accent: "amber",
    },
    {
      id: "payments",
      emoji: "💸",
      name: "Нет контроля оплат",
      headline: "Неясно, кто оплатил лечение",
      description:
        "Наличные, переводы и долги записываются в разных тетрадях. Руководитель узнаёт о финансовых провалах только в конце месяца.",
      bullets: [
        "Не видно, какая сумма уже получена и кому начислять процент",
        "Долги пациентов растут незаметно — нет напоминаний об оплате",
        "Касса не сходится: наличные и e-wallet не сведены",
      ],
      accent: "amber",
    },
    {
      id: "reporting",
      emoji: "📊",
      name: "Слепые отчёты",
      headline: "Решения принимаются «на глаз»",
      description:
        "Чтобы собрать показатели, администратор вручную сводит таблицы, ищет услуги в чатах и строит графики в последний момент.",
      bullets: [
        "Нет дашборда по выручке, процентам и загрузке врачей",
        "Живые показатели появляются только к концу месяца",
        "Руководитель не понимает, что тормозит клинику прямо сейчас",
      ],
      accent: "amber",
    },
  ];

  const problemAccentStyles = {
    emerald: {
      tag: "text-emerald-600",
      bullet: "bg-emerald-500",
      glow: "bg-emerald-300",
      badge: "border-emerald-200/70 bg-emerald-50/70 text-emerald-600",
    },
    sky: {
      tag: "text-sky-600",
      bullet: "bg-sky-500",
      glow: "bg-sky-300",
      badge: "border-sky-200/70 bg-sky-50/70 text-sky-600",
    },
    amber: {
      tag: "text-amber-600",
      bullet: "bg-amber-500",
      glow: "bg-amber-300",
      badge: "border-amber-200/70 bg-amber-50/70 text-amber-600",
    },
  } as const;

  const solutionItems = [
    {
      id: "schedule",
      label: "Расписание",
      title: "Расписание без накладок",
      description:
        "Администратор, врачи и руководитель работают в одном календаре. Любой перенос мгновенно виден всей команде.",
      accent: "emerald",
      bullets: [
        "Единая доска по кабинетам, врачам и типам услуг",
        "Автоподтверждения и напоминания пациентам без звонков",
        "План лечения и блокировки кресел видны за месяцы вперёд",
      ],
      metric: {
        value: "−6 часов",
        caption: "ручного обзвона и согласований каждую неделю",
      },
    },
    {
      id: "payments",
      label: "Оплаты",
      title: "Финансовая прозрачность",
      description:
        "Платежи, долги и проценты врачей сходятся автоматически. Руководитель видит кассу в реальном времени.",
      accent: "emerald",
      bullets: [
        "Раздельный учёт наличных, e-wallet и банковских платежей",
        "Проценты врача начисляются сразу после оплаты визита",
        "Долги подсвечиваются и формируют напоминания пациенту",
      ],
      metric: {
        value: "100%",
        caption: "контроль оплат и задолженностей без Excel",
      },
    },
    {
      id: "analytics",
      label: "Аналитика",
      title: "Цифры для роста клиники",
      description:
        "Живые дашборды показывают загрузку кресел, выручку по услугам и источники пациентов.",
      accent: "emerald",
      bullets: [
        "KPI по врачам, услугам и филиалам на одном экране",
        "Источники пациентов и повторные визиты в режиме реального времени",
        "Экспорт отчётов для собственника и главврача за секунды",
      ],
      metric: {
        value: "+18%",
        caption: "рост выручки после внедрения прозрачной аналитики",
      },
    },
  ];

  const solutionAccentStyles = {
    emerald: {
      tag: "border-emerald-200/60 bg-emerald-50/60 text-emerald-600",
      bulletIcon: "bg-emerald-500/15 text-emerald-600",
      metricWrap: "border-emerald-200/60 bg-emerald-50/60",
      metricText: "text-emerald-600",
    },
    sky: {
      tag: "border-sky-200/60 bg-sky-50/60 text-sky-600",
      bulletIcon: "bg-sky-500/15 text-sky-600",
      metricWrap: "border-sky-200/60 bg-sky-50/60",
      metricText: "text-sky-600",
    },
    amber: {
      tag: "border-amber-200/60 bg-amber-50/60 text-amber-600",
      bulletIcon: "bg-amber-500/15 text-amber-600",
      metricWrap: "border-amber-200/60 bg-amber-50/60",
      metricText: "text-amber-600",
    },
  } as const;

  const faqItems = [
    {
      question: "Можно ли работать без интернета?",
      answer:
        "Да. Версия на Windows работает полностью офлайн. Когда интернет появляется — данные синхронизируются с облаком.",
    },
    {
      question: "Сколько времени занимает запуск?",
      answer:
        "Начать работу с Serkor можно мгновенно — регистрируйтесь и используйте систему уже сейчас. Если нужно перенести данные, свяжитесь с нами, и мы аккуратно перенесём всё за 2–3 дня.",
    },
    {
      question: "Нужно или обучать себя или сотрудников?",
      answer:
        "Нет, система интуитивная. Мы также предоставляем короткие видео-инструкции, поддержку.",
    },
    {
      question: "Можно ли перенести данные из старой CRM или Excel?",
      answer:
        "Да, мы поможем перенести базу пациентов, врачей и расписание без потерь за 2-3 дней",
    },
    {
      question: "Какая аналитика есть в Serkor?",
      answer:
        "CRM показывает всё: количество пациентов, загрузку врачей, повторные визиты и прибыль — в понятных графиках и отчётах для точных решений.",
    },
  ];

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [pricingModalOpen, setPricingModalOpen] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_18%_18%,rgba(16,185,129,0.1),transparent_45%),radial-gradient(circle_at_82%_-10%,rgba(14,116,144,0.08),transparent_40%),linear-gradient(135deg,#ffffff_0%,#f9fffb_35%,#f4fffb_70%,#ffffff_100%)] text-slate-900">
      <div className="pointer-events-none absolute inset-0 -z-20">
        <div className="absolute inset-0 opacity-[0.45]">
          <svg
            className="h-full w-full"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <pattern
                id="dental-grid"
                width="200"
                height="200"
                patternUnits="userSpaceOnUse"
              >
                <g className="text-emerald-100/70">
                  <circle
                    cx="24"
                    cy="24"
                    r="3"
                    className="fill-current opacity-70"
                  />
                  <circle
                    cx="80"
                    cy="90"
                    r="2"
                    className="fill-current opacity-50"
                  />
                  <circle
                    cx="150"
                    cy="42"
                    r="3"
                    className="fill-current opacity-65"
                  />
                </g>
                <g className="text-emerald-200/70">
                  <rect
                    x="16"
                    y="120"
                    width="24"
                    height="12"
                    rx="6"
                    className="fill-current opacity-35"
                  />
                  <rect
                    x="110"
                    y="148"
                    width="28"
                    height="12"
                    rx="6"
                    className="fill-current opacity-35"
                  />
                </g>
                <path
                  d="M56 48c0-11 9-20 20-20s20 9 20 20c0 10-4 17-8 24-3 4-4 9-5 12-1 5-8 5-9 0-1-3-2-8-5-12-4-7-8-14-8-24z"
                  fill="none"
                  stroke="rgba(16,185,129,0.35)"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
                <path
                  d="M48 150c0-8 6-14 14-14h12c8 0 14 6 14 14v6c0 4-3 7-7 7h-26c-4 0-7-3-7-7z"
                  fill="rgba(14,165,233,0.12)"
                />
                <path
                  d="M0 0 L200 200"
                  stroke="rgba(16, 185, 129, 0.18)"
                  strokeWidth="1.2"
                  strokeDasharray="5 10"
                />
                <path
                  d="M200 0 L0 200"
                  stroke="rgba(14, 165, 233, 0.18)"
                  strokeWidth="1.2"
                  strokeDasharray="6 14"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dental-grid)" />
          </svg>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 -z-10">
        <img
          src="/image.png"
          alt=""
          className="pointer-events-none absolute -top-16 left-1/2 hidden h-[540px] w-auto -translate-x-1/2 opacity-45 mix-blend-screen sm:block md:-top-20 md:h-[680px]"
        />
        <div className="absolute -left-32 top-10 h-64 w-64 rounded-full bg-emerald-200/22 blur-3xl animate-[spin_24s_linear_infinite]" />
        <div className="absolute right-[-40px] top-40 h-72 w-72 rounded-full bg-sky-200/18 blur-[110px] animate-[pulse_10s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-120px] left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-emerald-100/24 blur-[120px] animate-[spin_30s_linear_reverse_infinite]" />
      </div>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-emerald-100 bg-white/95 backdrop-blur">
        <div className="relative flex w-full items-center justify-between px-4 py-2.5 md:px-10 md:py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-200/60 shadow-sm md:h-12 md:w-12">
              <img
                src="/ser.png"
                alt="Serkor"
                className="h-full w-full rounded-full object-cover"
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold text-emerald-700 md:text-2xl">
                Serkor Dental
              </span>
              <span className="text-[8px] font-semibold uppercase tracking-[0.3em] text-slate-400 md:text-xs">
                Операционная система стоматологии
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <Link to="/signup">
              <Button className="h-8 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 px-4 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                start
              </Button>
            </Link>
            <button
              type="button"
              aria-label="Открыть меню"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-emerald-100 bg-white/70 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="flex h-4 w-4 flex-col justify-between">
                <span className="h-[2px] w-full rounded-full bg-emerald-600 transition-all" />
                <span className="h-[2px] w-full rounded-full bg-emerald-600 transition-all" />
                <span className="h-[2px] w-full rounded-full bg-emerald-600 transition-all" />
              </span>
            </button>
          </div>

          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.getElementById(item.id);
                  if (element) {
                    const headerOffset = 80;
                    const elementPosition = element.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                      top: offsetPosition,
                      behavior: "smooth"
                    });
                  }
                }}
                className="rounded-full border border-emerald-100/60 bg-white/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 shadow-[0_8px_24px_-12px_rgba(16,185,129,0.4)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-emerald-50/70 hover:text-emerald-700"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link to="/login">
              <Button
                variant="ghost"
                className="h-9 rounded-full px-4 text-sm font-semibold text-emerald-700 transition hover:-translate-y-0.5 hover:bg-emerald-50 hover:text-emerald-800 md:h-10 md:px-5 md:text-base"
              >
                Войти
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="group h-9 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 px-5 text-sm font-semibold text-white shadow-[0_16px_32px_-18px_rgba(16,185,129,0.85)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_22px_40px_-16px_rgba(15,118,110,0.7)] md:h-10 md:px-6 md:text-base">
                Начать сейчас
              </Button>
            </Link>
          </div>

          {mobileMenuOpen && (
            <div className="absolute inset-x-4 top-full mt-2 flex flex-col gap-1 rounded-xl bg-white p-2 shadow-xl md:hidden">
                <div className="flex flex-col gap-1">
                {navItems.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setMobileMenuOpen(false);
                      const element = document.getElementById(item.id);
                      if (element) {
                        const headerOffset = 80;
                        const elementPosition = element.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                        window.scrollTo({
                          top: offsetPosition,
                          behavior: "smooth"
                        });
                      }
                    }}
                    className="rounded-md bg-white px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600 shadow-sm transition hover:bg-emerald-50/80 hover:text-emerald-700"
                  >
                    {item.label}
                  </a>
                ))}
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setContactModalOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="flex-1"
                  >
                    <Button
                      variant="ghost"
                      className="h-7 w-full rounded-full px-2 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-50"
                    >
                      Связаться с нами
                    </Button>
                  </button>
                  <Link to="/get-started" onClick={() => setMobileMenuOpen(false)} className="flex-1">
                    <Button className="h-7 w-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-[10px] font-semibold text-white shadow hover:-translate-y-0.5 hover:shadow-lg">
                      Начать сейчас
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="pt-40 pb-20 md:pt-36 md:pb-24">
        <section
          id="hero"
          className="relative mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-4 pt-14 pb-10 text-center sm:gap-8 sm:px-6 md:pt-20 md:pb-16"
        >
          <div className="absolute inset-0 -z-20 overflow-hidden">
            <div className="absolute left-4 top-16 h-40 w-40 -rotate-6 rounded-[34px] border border-white/50 bg-white/35 shadow-[0_26px_60px_-34px_rgba(16,185,129,0.55)] backdrop-blur-2xl sm:left-10 sm:top-20 sm:h-48 sm:w-48 md:left-16 md:top-24">
              <div className="absolute inset-3 rounded-[30px] border border-white/40 bg-gradient-to-br from-emerald-50/80 via-white/75 to-teal-50/70" />
              <div className="absolute left-6 top-6 flex h-8 w-16 items-center justify-between text-base text-emerald-500 opacity-80">
                <span>🦷</span>
                <span>🪥</span>
              </div>
              <div className="absolute bottom-6 right-6 flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-emerald-500 shadow-[0_12px_28px_-18px_rgba(16,185,129,0.45)]">
                clean
              </div>
            </div>
            <div className="absolute right-2 top-24 h-48 w-48 rotate-6 rounded-[42px] border border-white/50 bg-white/30 shadow-[0_30px_72px_-36px_rgba(14,165,233,0.5)] backdrop-blur-2xl sm:right-10 sm:top-24 sm:h-56 sm:w-56 md:right-20">
              <div className="absolute inset-4 rounded-[34px] border border-white/50 bg-gradient-to-br from-white/80 via-emerald-50/60 to-white/75" />
              <div className="absolute -right-5 top-10 flex h-14 w-14 items-center justify-center rounded-full border border-white/70 bg-gradient-to-br from-emerald-200/70 via-white/80 to-emerald-100/80 text-lg text-emerald-600 shadow-[0_18px_36px_-18px_rgba(16,185,129,0.55)]">
                ✨
              </div>
              <div className="absolute bottom-6 left-6 flex flex-col items-start gap-1 rounded-3xl border border-white/60 bg-white/75 px-5 py-4 text-[12px] font-semibold uppercase tracking-[0.3em] text-emerald-500 shadow-[0_16px_36px_-22px_rgba(13,148,136,0.55)]">
                care
                <span className="text-[10px] text-slate-400">smart flow</span>
              </div>
            </div>
            <div className="absolute left-1/2 top-[60%] h-64 w-64 -translate-x-1/2 rounded-full border border-white/40 bg-white/20 blur-3xl sm:h-72 sm:w-72" />
            <div className="absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-emerald-100 blur-3xl" />
            <div className="absolute -bottom-24 left-1/2 h-60 w-60 -translate-x-1/2 rounded-full bg-sky-100 blur-3xl" />
          </div>
          <div className="w-full max-w-3xl space-y-6 sm:space-y-7">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:flex-nowrap">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-gradient-to-r from-emerald-50 via-white to-emerald-100 px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700 shadow-[0_12px_32px_-14px_rgba(6,95,70,0.55)] backdrop-blur transition hover:-translate-y-0.5">
                🇹🇯🦷 Для стоматологий Худжанда
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-[52px] md:leading-tight">
              От пациентов до прибыли — всё под контролем
            </h1>
            <p className="text-base leading-relaxed text-slate-600 sm:text-lg md:text-xl">
              Вся клиника на одной панели: пациенты, финансы, эффективность.
              Работает офлайн и онлайн.
            </p>
            <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-center">
              <Link to="/signup">
                <Button
                  size="lg"
                  className="group w-full overflow-hidden rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 bg-[length:200%_200%] bg-[position:0%_50%] px-10 text-base font-semibold text-white shadow-[0_20px_44px_-18px_rgba(16,185,129,0.85)] transition-all duration-300 hover:-translate-y-1 hover:bg-[position:100%_50%] hover:shadow-[0_26px_50px_-20px_rgba(13,148,136,0.75)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 sm:w-auto sm:px-12 sm:text-lg"
                >
                  Начать сейчас
                </Button>
              </Link>
              <Button
                onClick={() => setContactModalOpen(true)}
                size="lg"
                variant="outline"
                className="group w-full rounded-full border border-emerald-200 bg-white/85 px-10 text-base font-semibold text-emerald-600 shadow transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:bg-emerald-50/80 hover:text-emerald-700 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 sm:w-auto sm:px-12 sm:text-lg"
              >
                Связаться с нами
              </Button>
            </div>
          </div>
        </section>

        <section
          id="problem"
          className="mx-auto mt-12 w-full max-w-6xl px-4 py-14 sm:px-6 md:mt-24 md:py-20"
        >
          <div className="space-y-5 text-center">
            <h2 className="text-3xl font-bold text-slate-900 md:text-5xl">
              Главные боли стоматологий Худжанда
            </h2>
            <p className="mx-auto max-w-3xl text-xl leading-relaxed text-slate-600">
              Администраторы перегружены звонками, врачи не знают реальную
              загрузку, пациенты выпадают из цепочки лечения, а цифры по выручке
              непонятны до конца месяца.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:mt-16 md:grid-cols-2 lg:grid-cols-3">
            {problemSections.map((section) => {
              const accent =
                problemAccentStyles[
                  section.accent as keyof typeof problemAccentStyles
                ];
              return (
                <article
                  key={section.id}
                  className="relative overflow-hidden rounded-[28px] border border-amber-400 bg-gradient-to-br from-amber-300 via-yellow-300 to-amber-400 p-[1px] shadow-xl"
                >
                  <div className="h-full rounded-[26px] bg-white/95 p-6 shadow-inner backdrop-blur-md sm:p-8">
                    <div
                      className={`absolute -top-24 right-[-60px] h-56 w-56 rounded-full opacity-20 blur-3xl ${accent.glow}`}
                    />
                    <div className="relative space-y-4 text-left sm:space-y-5">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] ${accent.badge}`}
                      >
                        <span className="text-base">{section.emoji}</span>
                        {section.name}
                      </span>
                      <h3 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                        {section.headline}
                      </h3>
                      <ul className="space-y-3 sm:space-y-4">
                        {section.bullets.map((bullet) => (
                          <li
                            key={bullet}
                            className="flex items-start gap-3 text-sm font-medium text-slate-600 sm:text-base"
                          >
                            <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-white/90 text-lg shadow">
                              {section.emoji}
                            </span>
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section id="solution" className="bg-white py-16 sm:py-20">
          <div className="mx-auto w-full max-w-6xl space-y-12 px-4 sm:px-6">
            <div className="space-y-5 text-center">
              <span className="text-base font-bold uppercase tracking-[0.35ем] text-emerald-500">
                Наш ответ
              </span>
              <h2 className="text-3xl font-bold text-slate-900 md:text-5xl">
                <span className="text-emerald-600">Serkor</span> превращает
                клинику в предсказуемую систему
              </h2>
              <p className="mx-auto max-w-3xl text-xl leading-relaxed text-slate-600">
                Вся операционка — в одной платформе. Сердце клиники работает
                плавно: приёмы идут по плану, командa видит загрузку, а
                руководитель понимает цифры в реальном времени.
              </p>
            </div>

            <div className="grid gap-5 sm:gap-6 lg:grid-cols-3 lg:gap-8">
              {solutionItems.map((item, index) => {
                const accentClass =
                  solutionAccentStyles[
                    item.accent as keyof typeof solutionAccentStyles
                  ];
                return (
                  <article
                    key={item.id}
                    className={`relative flex h-full flex-col gap-5 rounded-[28px] border border-emerald-400 bg-gradient-to-br from-emerald-300 via-teal-300 to-emerald-400 p-[1px] shadow-lg sm:gap-6 ${
                      index === 1 ? "lg:-mt-6 lg:pb-10" : ""
                    }`}
                  >
                    <div className="flex h-full flex-col gap-5 rounded-[26px] bg-white/90 p-6 backdrop-blur sm:gap-6 sm:p-8">
                      <div className="space-y-3">
                        <span
                          className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-xs font-bold uppercase tracking-[0.35em] ${accentClass.tag}`}
                        >
                          {item.label}
                        </span>
                        <h3 className="text-xl font-semibold text-slate-900 sm:text-2xl">
                          {item.title}
                        </h3>
                        <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                          {item.description}
                        </p>
                      </div>

                      <ul className="space-y-2.5 text-sm leading-relaxed text-slate-600 sm:space-y-3">
                        {item.bullets.map((bullet) => (
                          <li key={bullet} className="flex gap-3">
                            <span
                              className={`mt-1 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full text-xs font-semibold ${accentClass.bulletIcon}`}
                            >
                              ✓
                            </span>
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>

                      <div
                        className={`mt-auto rounded-2xl border p-5 text-center ${accentClass.metricWrap}`}
                      >
                        <div
                          className={`text-3xl font-bold ${accentClass.metricText}`}
                        >
                          {item.metric.value}
                        </div>
                        <div className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                          {item.metric.caption}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section
          id="pricing"
          className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20"
        >
          <div className="space-y-5 text-center">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl md:text-5xl">
              Модели под любую стоматологию
            </h2>
            <p className="mx-auto max-w-2xl text-base text-slate-600 sm:text-lg md:text-xl">
              Используйте Serkor бесплатно 2 недели. Потом мы свяжемся для выбора подходящего таррифа с обучением, миграцией и другими услугами
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3 md:gap-6 lg:mt-12">
            {[
              {
                name: "Старт",
                accent: "bg-white",
                subtitle: "Для соло-врачей",
                bullets: [
                  "1 клиника · 1 врач",
                  "Полный функционал: расписание, пациенты, аналитика",
                  "Управление оплатами и долгами",
                ],
                primaryCta: {
                  to: "/signup?plan=start&period=monthly",
                  label: "199 смн / месяц",
                },
                secondaryCta: {
                  to: "/signup?plan=start&period=yearly",
                  label: "1 990 смн / год",
                },
              },
              {
                name: "Рост",
                accent:
                  "bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-500 text-white",
                subtitle: "1 клиника · 2–10 врачей",
                bullets: [
                  "Синхронизация аккаунтов врачей и общее расписание",
                  "Администратор + аналитика по команде",
                  "Бесплатный перенос данных из старой CRM",
                ],
                primaryCta: {
                  to: "/signup?plan=growth&period=monthly",
                  label: "150 смн за врача / месяц",
                },
                secondaryCta: {
                  to: "/signup?plan=growth&period=yearly",
                  label: "1 500 смн за врача / год",
                },
              },
              {
                name: "Сеть",
                accent: "bg-white",
                subtitle: "Для сетей и франшиз",
                bullets: [
                  "Несколько филиалов",
                  "Единый финансовый контур",
                  "API и кастомные интеграции",
                ],
                primaryCta: {
                  to: "/signup?plan=network",
                  label: "Связаться с командой",
                },
              },
            ].map((plan, index) => (
              <div
                key={plan.name}
                className={`group relative overflow-hidden rounded-[30px] bg-gradient-to-br from-emerald-300 via-teal-300 to-emerald-400 bg-[length:200%_200%] bg-[position:0%_50%] p-[1px] shadow-[0_16px_44px_-28px_rgba(16,185,129,0.55)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_28px_54px_-26px_rgba(13,148,136,0.55)] animate-[gradient_3s_ease_infinite] ${
                  index === 1
                    ? "from-emerald-400 via-emerald-300 to-teal-400"
                    : ""
                }`}
              >
                <div
                  className={`flex h-full flex-col gap-5 rounded-[26px] ${plan.accent} p-6 sm:p-8 transition-all duration-300 ${
                    index === 1 ? "text-white" : ""
                  }`}
                >
                  <div
                    className={`flex flex-col gap-5 text-left ${index === 1 ? "text-white" : ""}`}
                  >
                    <div>
                      <span
                        className={`text-sm uppercase tracking-[0.3em] ${
                          index === 1 ? "text-white/70" : "text-slate-500"
                        }`}
                      >
                        {plan.name}
                      </span>
                      <h3
                        className={`mt-2 text-2xl font-semibold ${index === 1 ? "text-white" : "text-slate-900"}`}
                      >
                        {plan.subtitle}
                      </h3>
                    </div>
                    <ul className="space-y-3 text-sm">
                      {plan.bullets.map((bullet) => (
                        <li
                          key={bullet}
                          className={`flex items-start gap-3 ${
                            index === 1 ? "text-white/90" : "text-slate-600"
                          }`}
                        >
                          <span
                            className={`mt-[6px] h-2 w-2 rounded-full ${
                              index === 1 ? "bg-white" : "bg-emerald-400"
                            }`}
                          />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="space-y-3">
                      {plan.primaryCta && (
                        <Button
                          onClick={() => {
                            if (index === 2) {
                              setContactModalOpen(true);
                            } else {
                              setPricingModalOpen(true);
                            }
                          }}
                          className={`group w-full rounded-full border py-4 text-base font-semibold backdrop-blur transition-all duration-200 ${
                            index === 1
                              ? "border-emerald-200/70 bg-white text-emerald-600 shadow-lg hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow-xl"
                              : index === 0 || index === 2
                                ? "border-emerald-500 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white shadow-lg hover:-translate-y-0.5 hover:shadow-xl"
                                : "border-emerald-200/70 bg-white/75 text-emerald-600 shadow hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-lg"
                          }`}
                        >
                          {plan.primaryCta.label}
                        </Button>
                      )}
                      {plan.secondaryCta && (
                        <Button
                          onClick={() => setPricingModalOpen(true)}
                          className={`group w-full rounded-full border py-4 text-base font-semibold backdrop-blur transition-all duration-200 ${
                            index === 1
                              ? "border-emerald-200/60 bg-white text-emerald-600 hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow-lg"
                              : index === 0 || index === 2
                                ? "border-emerald-500 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white shadow-lg hover:-translate-y-0.5 hover:shadow-xl"
                                : "border-emerald-200/60 bg-white/60 text-emerald-600 hover:-translate-y-0.5 hover:bg-white/80 hover:shadow"
                          }`}
                        >
                          {plan.secondaryCta.label}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="faq" className="bg-white/60 py-16 sm:py-20">
          <div className="mx-auto max-w-4xl space-y-10 px-4 sm:px-6">
            <div className="space-y-4 text-center">
              <span className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-500">
                FAQ
              </span>
              <h2 className="text-3xl font-semibold text-slate-900 md:text-4xl">
                Частые вопросы о{" "}
                <span className="text-emerald-600">Serkor</span>
              </h2>
            </div>

            <div className="space-y-4">
              {faqItems.map((item) => {
                const isOpen = openFaqId === item.question;
                return (
                  <div
                    key={item.question}
                    className="overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-100/60 via-teal-100/50 to-emerald-200/60 p-[1px] shadow-sm"
                  >
                    <div className="overflow-hidden rounded-[22px] bg-white">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenFaqId(isOpen ? null : item.question)
                        }
                        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                      >
                        <span className="text-lg font-semibold text-slate-900">
                          {item.question}
                        </span>
                        <span className="text-emerald-500">
                          {isOpen ? "−" : "+"}
                        </span>
                      </button>
                      {isOpen && (
                        <div className="border-t border-emerald-50 px-6 pb-6 text-sm leading-relaxed text-slate-600">
                          {item.answer}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl rounded-[32px] bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-500 px-5 py-12 text-center text-white shadow-2xl sm:px-8 sm:py-16">
          <div className="space-y-5 sm:space-y-6">
            <h2 className="text-2xl font-semibold sm:text-3xl md:text-4xl">
              Начните управлять своей стоматологией уже сегодня
            </h2>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/signup">
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-full rounded-full bg-white/90 px-8 text-base font-semibold text-emerald-700 shadow-lg hover:bg-white sm:w-auto sm:px-10 sm:text-lg"
                >
                  Начать сейчас
                </Button>
              </Link>
              <Button
                onClick={() => setContactModalOpen(true)}
                size="lg"
                variant="outline"
                className="w-full rounded-full border-2 border-white/80 bg-transparent px-8 text-base font-semibold text-white shadow-lg hover:bg-white/10 sm:w-auto sm:px-10 sm:text-lg"
              >
                Связаться с нами
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Dialog open={contactModalOpen} onOpenChange={setContactModalOpen}>
        <DialogContent className="bg-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-slate-900">
              Мы ответим на любой вопрос и поможем настроить
            </DialogTitle>
            <DialogDescription className="text-base text-slate-600">
              Выберите удобный способ связи
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <a
              href="tel:927474090"
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 transition hover:bg-slate-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-slate-900">Позвонить</div>
                <div className="text-sm text-slate-600">927474090</div>
              </div>
            </a>
            <a
              href="https://t.me/mankimtukim"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 transition hover:bg-slate-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-slate-900">Телеграм</div>
                <div className="text-sm text-slate-600">@mankimtukim</div>
              </div>
            </a>
            <a
              href="https://wa.me/992929898800"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 transition hover:bg-slate-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-slate-900">WhatsApp</div>
                <div className="text-sm text-slate-600">+992929898800</div>
              </div>
            </a>
            <a
              href="https://instagram.com/over7inker"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 transition hover:bg-slate-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white">
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-slate-900">Instagram</div>
                <div className="text-sm text-slate-600">@over7inker</div>
              </div>
            </a>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={pricingModalOpen} onOpenChange={setPricingModalOpen}>
        <DialogContent className="bg-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-slate-900">
              Начните бесплатно
            </DialogTitle>
            <DialogDescription className="text-base text-slate-600">
              После начала использования у вас будет 2 недели бесплатного
              пробного периода, вы можете начать даже сейчас.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <p className="text-base text-slate-700">
                После окончания пробного периода мы свяжемся с вами, чтобы
                выбрать платный тариф, если вы хотите продолжить.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-900">
                Способы оплаты:
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  DC
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Alif
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Корти Милли
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Visa cards
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Cash
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <Link to="/signup">
                <Button
                  className="w-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-lg hover:shadow-xl"
                  onClick={() => setPricingModalOpen(false)}
                >
                  Начать сейчас
                </Button>
              </Link>
              <p className="text-center text-sm text-slate-600">
                или{" "}
                <button
                  onClick={() => {
                    setPricingModalOpen(false);
                    setContactModalOpen(true);
                  }}
                  className="font-semibold text-emerald-600 underline hover:text-emerald-700"
                >
                  вы можете связаться с нами сейчас
                </button>
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Landing;
