import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const navItems = [
  { id: "hero", label: "Serkor" },
  { id: "problem", label: "Проблема" },
  { id: "solution", label: "Решение" },
  { id: "pricing", label: "Тарифы" },
  { id: "faq", label: "FAQ" },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-indigo-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-emerald-100/60 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-200/60 shadow-sm">
              <img src="/ser.png" alt="Serkor" className="h-9 w-9 object-contain" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xl font-semibold text-emerald-700">Serkor Dental OS</span>
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Clinic Operating System</span>
            </div>
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="rounded-full px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-emerald-100/60 hover:text-emerald-700"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" className="font-semibold text-emerald-700 hover:text-emerald-800">
                Войти
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-emerald-600 px-6 text-white hover:bg-emerald-500">Начать сейчас</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="pb-24">
        <section
          id="hero"
          className="relative mx-auto flex max-w-6xl flex-col gap-10 px-6 pt-20 pb-16 md:flex-row md:items-center md:justify-between"
        >
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-emerald-100 blur-3xl" />
            <div className="absolute -bottom-24 right-24 h-60 w-60 rounded-full bg-sky-100 blur-3xl" />
          </div>
          <div className="max-w-xl space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-4 py-1 text-xs font-medium uppercase tracking-[0.3em] text-emerald-500">
              Dental CRM
            </span>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
              Умная платформа для стоматологических клиник
            </h1>
            <p className="text-lg leading-relaxed text-slate-600">
              Управляйте расписанием, пациентами и оплатами в единой системе. Serkor помогает команде клиники
              работать без хаоса и растить бизнес.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/signup">
                <Button size="lg" className="bg-emerald-600 px-8 text-white hover:bg-emerald-500">
                  Открыть аккаунт
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="px-8 text-emerald-600">
                  Смотреть демо
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span>Полностью офлайн + облако</span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span>Подходит для сетей и соло-клиник</span>
            </div>
          </div>

          <div className="relative flex w-full max-w-lg justify-center">
            <div className="relative rounded-[32px] border border-white/80 bg-white/80 p-6 shadow-xl backdrop-blur">
              <div className="rounded-[24px] bg-gradient-to-br from-emerald-200 via-white to-sky-100 p-6">
                <div className="rounded-2xl bg-white/70 p-5 shadow-inner">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <span>Сегодня</span>
                      <span>Пятница</span>
                    </div>
                    <div className="space-y-2 text-left">
                      <div className="rounded-xl bg-emerald-600/10 p-4">
                        <div className="text-sm font-semibold text-emerald-700">Имплантация · 11:00</div>
                        <div className="text-xs text-slate-500">Д-р Азизова — Кабинет 2</div>
                      </div>
                      <div className="rounded-xl bg-sky-500/10 p-4">
                        <div className="text-sm font-semibold text-sky-700">Гигиена · 13:30</div>
                        <div className="text-xs text-slate-500">Д-р Беков — Кабинет 1</div>
                      </div>
                      <div className="rounded-xl bg-amber-500/10 p-4">
                        <div className="text-sm font-semibold text-amber-700">Ортодонтия · 15:00</div>
                        <div className="text-xs text-slate-500">Д-р Саидова — Кабинет 4</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 rounded-2xl bg-white px-5 py-4 shadow-lg">
              <div className="text-xs uppercase tracking-wide text-slate-400">Средний чек</div>
              <div className="mt-1 text-2xl font-semibold text-emerald-600">560 TJS</div>
              <div className="text-xs text-emerald-500">+18% за месяц</div>
            </div>
          </div>
        </section>

        <section id="problem" className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-16 md:grid-cols-[1.2fr_1fr] md:items-center">
            <div className="space-y-6">
              <span className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-500">
                Проблема сегодня
              </span>
              <h2 className="text-3xl font-semibold text-slate-900 md:text-4xl">Что мешает клиникам расти</h2>
              <p className="text-lg leading-relaxed text-slate-600">
                Стоматология держится на точности — но хаос в расписании, неявки пациентов и путаница с оплатами
                сжирают время команды, снижают выручку и портят впечатление пациентов.
              </p>
              <div className="space-y-4">
                {[
                  "Расписание ведётся в тетрадях и Excel — врачи не синхронизированы, записи теряются.",
                  "Напоминания пациентам вручную — администраторы весь день в телефоне.",
                  "Нет понимания по оплатам: что оплачено, где долг, кому выплачивать процент.",
                  "Отчёты собираются ночью — клиника не видит реальных показателей и точек роста.",
                ].map((problem) => (
                  <div key={problem} className="flex gap-3 rounded-2xl bg-white/80 p-4 shadow-sm">
                    <span className="mt-1 h-2 w-2 flex-none rounded-full bg-emerald-400" />
                    <p className="text-sm text-slate-600">{problem}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative h-full rounded-[32px] border border-emerald-100 bg-white/80 p-8 shadow-lg backdrop-blur">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-emerald-700">Как это выглядит</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Разрозненные таблицы, блокноты и чаты. Пациенты приходят в неудобное время, а врачи простаивают.
                  </p>
                </div>
                <div className="space-y-4 text-sm">
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-emerald-700">
                    38% звонков администратора — напоминания о визитах
                  </div>
                  <div className="rounded-2xl border border-amber-100 bg-amber-50/60 px-4 py-3 text-amber-600">
                    Потери до 15% выручки из-за несогласованных графиков
                  </div>
                  <div className="rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-3 text-sky-600">
                    Обновление отчётов занимает 6-8 часов каждую неделю
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="solution" className="bg-white py-20">
          <div className="mx-auto max-w-6xl space-y-12 px-6">
            <div className="text-center space-y-4">
              <span className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-500">
                Наш ответ
              </span>
              <h2 className="text-3xl font-semibold text-slate-900 md:text-4xl">
                Serkor превращает клинику в предсказуемую систему
              </h2>
              <p className="mx-auto max-w-3xl text-lg leading-relaxed text-slate-600">
                Вся операционка — в одной платформе. Сердце клиники работает плавно: приёмы идут по плану, командa
                видит загрузку, а руководитель понимает цифры в реальном времени.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  title: "Единое расписание",
                  description:
                    "Календарь клиники синхронизирован с врачами и кабинетами. Переносы, цепочки лечения и планы — под контролем.",
                },
                {
                  title: "Умные напоминания",
                  description:
                    "SMS и WhatsApp автоматически напоминают пациентам о визитах. Нет простоев, врачи заняты временем без провалов.",
                },
                {
                  title: "Платежи и аналитика",
                  description:
                    "Контроль оплат, кассы, долг по пациентам и проценты врачей. Отчёты по выручке и эффективности — в один клик.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-6">
                  <h3 className="text-xl font-semibold text-emerald-700">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-emerald-900/80">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center space-y-4">
            <span className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-500">Тарифы</span>
            <h2 className="text-3xl font-semibold text-slate-900 md:text-4xl">Модели под любую стоматологию</h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-600">
              Выберите подходящий формат. Мы поможем перенести данные, обучим команду и включим офлайн-режим.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                name: "Start",
                accent: "bg-white",
                price: "Для соло-клиники",
                bullets: ["1 клиника · 5 пользователей", "Учет пациентов и оплат", "Офлайн + веб-доступ"],
              },
              {
                name: "Growth",
                accent: "bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-500 text-white",
                price: "Для команд 10+ человек",
                bullets: ["Безлимит врачи и кабинеты", "Автоматизация процессов", "Отчёты по выручке и KPI"],
              },
              {
                name: "Network",
                accent: "bg-white",
                price: "Для сетей и франшиз",
                bullets: ["Несколько филиалов", "Единый финансовый контур", "API и кастомные интеграции"],
              },
            ].map((plan, index) => (
              <div
                key={plan.name}
                className={`relative rounded-[28px] border border-emerald-100 p-[1px] shadow-lg ${
                  index === 1 ? "shadow-emerald-200/60" : "shadow-emerald-100/50"
                }`}
              >
                <div className={`h-full rounded-[26px] ${plan.accent} p-8`}>
                  <div className="flex flex-col gap-6 text-left">
                    <div>
                      <span className="text-sm uppercase tracking-[0.3em] opacity-70">{plan.name}</span>
                      <h3 className={`mt-2 text-2xl font-semibold ${index === 1 ? "text-white" : "text-slate-900"}`}>
                        {plan.price}
                      </h3>
                    </div>
                    <ul className="space-y-3 text-sm">
                      {plan.bullets.map((bullet) => (
                        <li
                          key={bullet}
                          className={`flex items-start gap-3 ${
                            index === 1 ? "text-emerald-50/90" : "text-slate-600"
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
                    <Link to="/signup">
                      <Button
                        className={`w-full ${
                          index === 1
                            ? "bg-white text-emerald-600 hover:bg-emerald-50"
                            : "bg-emerald-600 text-white hover:bg-emerald-500"
                        }`}
                      >
                        Выбрать тариф
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="faq" className="bg-white/60 py-20">
          <div className="mx-auto max-w-4xl space-y-10 px-6">
            <div className="text-center space-y-4">
              <span className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-500">FAQ</span>
              <h2 className="text-3xl font-semibold text-slate-900 md:text-4xl">Частые вопросы о Serkor</h2>
              <p className="mx-auto max-w-2xl text-lg text-slate-600">
                Мы подготовим оргструктуру, загрузим пациентов и обучим администраторов. Все данные остаются только у
                вас.
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  question: "Можно ли работать без интернета?",
                  answer:
                    "Да. Версия на Windows работает полностью офлайн. Когда интернет появляется — данные синхронизируются с облаком.",
                },
                {
                  question: "Сколько времени занимает запуск?",
                  answer:
                    "Обычно мы настраиваем клинику за 3–5 дней: переносим пациентов, подключаем расписание и учим команду работать в системе.",
                },
                {
                  question: "Как подключить несколько филиалов?",
                  answer:
                    "Serkor изначально поддерживает сети. Вы будете видеть загрузку по каждой клинике и управлять финансовыми потоками из одной панели.",
                },
                {
                  question: "Что с безопасностью данных пациентов?",
                  answer:
                    "Храним данные в зашифрованном виде. Доступ разграничен по ролям. В офлайн-версии вся информация остаётся локально на устройстве.",
                },
              ].map((item) => (
                <div key={item.question} className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900">{item.question}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl rounded-[32px] bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-500 px-8 py-16 text-center text-white shadow-2xl">
          <div className="space-y-6">
            <h2 className="text-3xl font-semibold md:text-4xl">
              Запустите новую стоматологию для вашей команды уже на этой неделе
            </h2>
            <p className="text-lg text-emerald-50/90">
              Мы лично проведём онбординг, настроим офлайн-режим и дадим инструкции по росту клиники.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/signup">
                <Button size="lg" variant="secondary" className="px-8 text-emerald-700">
                  Забронировать запуск
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white px-8 text-white hover:bg-white/10 hover:text-white"
                >
                  Посмотреть CRM
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Landing;

