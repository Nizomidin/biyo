import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const sections = [
  { id: "hero", label: "Главная" },
  { id: "social-proof", label: "Отзывы" },
  { id: "problems", label: "Проблемы" },
  { id: "solution", label: "Решение" },
  { id: "cta", label: "Начать" },
];

const testimonials = [
  {
    name: "Д-р Нигина Рахимова",
    clinic: "Клиника «Здоровая Улыбка»",
    quote: "Теперь я точно знаю, кто когда придёт. Никакой путаницы с записями!",
  },
  {
    name: "Д-р Фаррух Холлов",
    clinic: "Стоматология «Дент-Профи»",
    quote: "Раньше тратили по 2 часа на отчёты. Сейчас — 10 минут. Просто волшебство.",
  },
  {
    name: "Д-р Малика Содикова",
    clinic: "Центр «Белый Зуб»",
    quote: "Пациенты довольны — напоминания приходят сами, никто не забывает прийти.",
  },
];

const problems = [
  {
    title: "Тетрадки и Excel",
    description: "Записи теряются, путаешься кто когда придёт.",
  },
  {
    title: "Звонки весь день",
    description: "Пациенты забывают про приём, приходится напоминать.",
  },
  {
    title: "Деньги не сходятся",
    description: "Непонятно кто заплатил, кто должен.",
  },
  {
    title: "Вечера на отчётах",
    description: "Вместо семьи — сидишь считаешь в Excel.",
  },
];

const solutionPoints = [
  {
    title: "Автоматическое расписание",
    description:
      "Врачи видят своё расписание в реальном времени. Смены, перенесённые визиты и записи онлайн — всё синхронизируется мгновенно.",
  },
  {
    title: "Напоминания пациентам",
    description:
      "SMS и WhatsApp-уведомления уходят автоматически. Пациенты приходят вовремя, а врачи не простаивают.",
  },
  {
    title: "Финансовый контроль",
    description:
      "Каждый визит, оплата, долг и возврат фиксируются. Видно, кто должен, сколько заработано, что оплачено.",
  },
  {
    title: "Отчёты в один клик",
    description:
      "Готовые отчёты по врачам, услугам и клиникам. Не нужно собирать цифры вручную — всё под рукой.",
  },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-100 via-emerald-50 to-emerald-100 text-slate-900">
      <header className="sticky top-0 z-50 border-b border-blue-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img
              src="/ser.png"
              alt="Serkor"
              className="h-10 w-10 rounded-full border border-blue-200 object-cover"
            />
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-semibold text-emerald-600">Serkor</span>
              <span className="text-xs text-slate-500">CRM для стоматологий</span>
            </div>
          </div>
          <nav className="hidden gap-4 md:flex">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="rounded-full px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
              >
                {section.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="outline">Войти</Button>
            </Link>
            <Link to="/signup">
              <Button>Попробовать бесплатно</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section
          id="hero"
          className="mx-auto flex max-w-6xl flex-col items-start gap-10 px-6 py-20 md:flex-row md:items-center md:justify-between"
        >
          <div className="max-w-xl space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1 text-sm font-medium text-emerald-700">
              Сделано в Худжанде
            </span>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
              CRM для стоматологий <span className="text-emerald-600">без бумажек</span>
            </h1>
            <p className="text-lg text-slate-600">
              Ведите пациентов, приёмы и оплаты просто. Больше времени на лечение — меньше на Excel.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/signup">
                <Button size="lg" className="px-8">
                  Начать бесплатно
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="px-8">
                  Посмотреть демо
                </Button>
              </Link>
            </div>
            <p className="text-sm text-slate-500">7 дней без карты · Настройка за 5 минут</p>
          </div>
          <div className="relative w-full max-w-xl">
            <div className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-xl shadow-blue-100/50">
              <img
                src="https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=900&q=80"
                alt="Стоматолог и пациент"
                className="h-80 w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 rounded-2xl border border-emerald-200 bg-white px-5 py-3 shadow-lg shadow-emerald-100/50">
              <div className="text-sm font-semibold text-emerald-600">150+</div>
              <div className="text-xs text-slate-500">Довольных врачей</div>
            </div>
          </div>
        </section>

        <section id="social-proof" className="bg-emerald-50/50 py-20">
          <div className="mx-auto max-w-6xl space-y-6 px-6 text-center">
            <h2 className="text-3xl font-bold text-slate-900">Врачи Худжанда уже работают с нами</h2>
            <p className="text-slate-600">150+ стоматологов доверяют нашей системе</p>
            <div className="grid gap-6 md:grid-cols-3">
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.name}
                  className="rounded-3xl border border-white bg-white p-6 text-left shadow-sm shadow-emerald-100/60"
                >
                  <div className="mb-3 text-base font-semibold text-slate-900">{testimonial.name}</div>
                  <div className="mb-4 text-sm text-emerald-600">{testimonial.clinic}</div>
                  <p className="text-sm text-slate-600">“{testimonial.quote}”</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="problems" className="mx-auto max-w-6xl px-6 py-20">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-slate-900">Знакомо?</h2>
            <p className="text-slate-600">
              Ежедневные хаос с записями, неявки пациентов и вечера в Excel — мы прошли через это вместе с клиниками Худжанда.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {problems.map((problem) => (
              <div key={problem.title} className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
                <div className="text-lg font-semibold text-slate-900">{problem.title}</div>
                <p className="mt-2 text-sm text-slate-600">{problem.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="solution" className="bg-white py-20">
          <div className="mx-auto max-w-6xl space-y-8 px-6">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold text-slate-900">Что делает Serkor</h2>
              <p className="text-slate-600">
                Мы построили CRM, которая понимает стоматологию Худжанда. Не просто календарь — а помощник для всей клиники.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {solutionPoints.map((point) => (
                <div key={point.title} className="rounded-3xl border border-emerald-100 bg-emerald-50/50 p-6">
                  <div className="text-lg font-semibold text-emerald-700">{point.title}</div>
                  <p className="mt-3 text-sm text-emerald-900/80">{point.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="cta"
          className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 py-20 text-center text-white"
        >
          <div className="mx-auto max-w-3xl space-y-6 px-6">
            <h2 className="text-3xl font-bold md:text-4xl">Готовы навести порядок в клинике?</h2>
            <p className="text-emerald-100">
              Присоединяйтесь к врачам Худжанда, которые уже управляют расписанием, оплатами и пациентами без хаоса.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/signup">
                <Button size="lg" variant="secondary" className="px-10 text-emerald-700">
                  Создать аккаунт
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Войти
                </Button>
              </Link>
            </div>
            <p className="text-xs uppercase tracking-wide text-emerald-200">Serkor · CRM для стоматологий Худжанда</p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Landing;

