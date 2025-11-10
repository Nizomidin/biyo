import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const navItems = [
  { id: "hero", label: "About us" },
  { id: "problem", label: "Проблема" },
  { id: "solution", label: "Решение" },
  { id: "pricing", label: "Тарифы" },
  { id: "faq", label: "FAQ" },
];

const Landing = () => {
  const problemTabs = [
    {
      id: "schedule-chaos",
      name: "Хаос в расписании",
      headline: "Пациенты теряются между кабинетами",
      description:
        "График ведётся в блокнотах и Excel. Переносы и отмены записываются вручную, поэтому пациенты приходят одновременно, а кабинеты простаивают.",
      bullets: [
        "Нет единого календаря по врачам и кабинетам",
        "Переносы не доходят до врача — появляется тройное бронирование",
        "Администраторы звонят по 40+ раз в день, чтобы уточнить время",
      ],
      accent: "emerald",
    },
    {
      id: "payments",
      name: "Нет контроля оплат",
      headline: "Неясно, кто оплатил лечение",
      description:
        "Наличные, переводы и долги записываются в разных тетрадях. Руководитель узнаёт о финансовых провалах только в конце месяца.",
      bullets: [
        "Не видно, какая сумма уже получена и кому начислять процент",
        "Долги пациентов растут незаметно — нет напоминаний об оплате",
        "Касса не сходится: наличные и e-wallet не сведены",
      ],
      accent: "sky",
    },
    {
      id: "reporting",
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

  const solutionItems = [
    {
      title: "Единое расписание",
      description:
        "Врачи, администраторы и руководители работают в одном календаре. Переносы синхронизируются автоматически, цепочки лечения видны на 6 месяцев вперёд.",
      accent: "emerald",
      preview: [
        {
          time: "09:00",
          label: "Имплантация",
          doctor: "Д-р Азизова",
          room: "Каб. 2",
        },
        {
          time: "11:30",
          label: "Гигиена",
          doctor: "Д-р Саидов",
          room: "Каб. 4",
        },
        {
          time: "14:00",
          label: "Ортодонтия",
          doctor: "Д-р Муродов",
          room: "Каб. 1",
        },
      ],
    },
    {
      title: "Умные оплаты",
      description:
        "Каждый визит связывается с кассой и электронными платежами. Врачи видят свои начисления, пациенты получают чеки, задолженности подсвечиваются автоматически.",
      accent: "sky",
      preview: [
        {
          label: "Оплата визита",
          value: "560 TJS",
          status: "Получено через e-wallet",
        },
        {
          label: "Долг пациента",
          value: "120 TJS",
          status: "Напоминание отправлено",
        },
        { label: "Процент врачу", value: "40%", status: "Начислено" },
      ],
    },
    {
      title: "Оцифрованная аналитика",
      description:
        "Дашборды показывают загрузку кабинетов, выручку по услугам и эффективность врачей. Решения принимаются по данным, а не по ощущениям.",
      accent: "amber",
      preview: [
        {
          label: "Выручка за неделю",
          value: "+18%",
          status: "Рост к прошлой неделе",
        },
        { label: "Заполненность кресел", value: "87%", status: "В норме" },
        { label: "Новые пациенты", value: "32", status: "Через рекомендации" },
      ],
    },
  ];

  const faqItems = [
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
  ];

  const [activeProblemId, setActiveProblemId] = useState(problemTabs[0].id);
  const activeProblem =
    problemTabs.find((item) => item.id === activeProblemId) ?? problemTabs[0];
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-indigo-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-emerald-100 bg-white">
        <div className="flex w-full items-center justify-between px-10 py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-200/60 shadow-sm">
              <img
                src="/ser.png"
                alt="Serkor"
                className="h-full w-full rounded-full object-cover"
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-2xl font-bold text-emerald-700">
                Serkor Dental
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                Операционная система стоматологии
              </span>
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
              <Button
                variant="ghost"
                className="font-semibold text-emerald-700 hover:text-emerald-800"
              >
                Войти
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-emerald-600 px-6 text-white hover:bg-emerald-500">
                Начать сейчас
              </Button>
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
          <div className="max-w-xl space-y-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-emerald-500">
              🇹🇯 Made in Khujand
            </span>
            <h1 className="text-5xl font-bold tracking-tight text-slate-900 md:text-6xl">
              Умная платформа для стоматологических клиник
            </h1>
            <p className="text-xl leading-relaxed text-slate-600">
              Управляйте расписанием, пациентами и оплатами в единой системе.
              Serkor помогает команде клиники работать без хаоса и растить
              бизнес.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/signup">
                <Button
                  size="lg"
                  className="bg-emerald-600 px-10 text-lg font-semibold text-white hover:bg-emerald-500"
                >
                  Открыть аккаунт
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="border border-white/60 bg-emerald-700/80 px-10 text-lg font-semibold !text-white backdrop-blur hover:bg-emerald-700 hover:!text-white"
                >
                  Смотреть демо
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-4 text-base font-semibold text-slate-600">
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
                        <div className="text-sm font-semibold text-emerald-700">
                          Имплантация · 11:00
                        </div>
                        <div className="text-xs text-slate-500">
                          Д-р Азизова — Кабинет 2
                        </div>
                      </div>
                      <div className="rounded-xl bg-sky-500/10 p-4">
                        <div className="text-sm font-semibold text-sky-700">
                          Гигиена · 13:30
                        </div>
                        <div className="text-xs text-slate-500">
                          Д-р Беков — Кабинет 1
                        </div>
                      </div>
                      <div className="rounded-xl bg-amber-500/10 p-4">
                        <div className="text-sm font-semibold text-amber-700">
                          Ортодонтия · 15:00
                        </div>
                        <div className="text-xs text-slate-500">
                          Д-р Саидова — Кабинет 4
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 rounded-2xl bg-white px-5 py-4 shadow-lg">
              <div className="text-xs uppercase tracking-wide text-slate-400">
                Средний чек
              </div>
              <div className="mt-1 text-2xl font-semibold text-emerald-600">
                560 TJS
              </div>
              <div className="text-xs text-emerald-500">+18% за месяц</div>
            </div>
          </div>
        </section>

        <section id="problem" className="mx-auto max-w-6xl px-6 py-20">
          <div className="space-y-5 text-center">
            <span className="text-base font-bold uppercase tracking-[0.3em] text-emerald-500">
              Почему клиники застревают
            </span>
            <h2 className="text-4xl font-bold text-slate-900 md:text-5xl">
              Главные боли стоматологических центров Худжанда
            </h2>
            <p className="mx-auto max-w-3xl text-xl leading-relaxed text-slate-600">
              Администраторы перегружены звонками, врачи не знают реальную
              загрузку, пациенты выпадают из цепочки лечения, а цифры по выручке
              непонятны до конца месяца.
            </p>
          </div>

          <div className="mt-16 space-y-8">
            <div className="flex flex-col items-center justify-center gap-5 md:flex-row">
              {problemTabs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveProblemId(item.id)}
                  className={`rounded-full px-10 py-4 text-lg font-semibold uppercase tracking-wide transition ${
                    activeProblemId === item.id
                      ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white shadow-xl shadow-emerald-200/80"
                      : "bg-white/90 text-slate-600 ring-2 ring-emerald-100 hover:bg-emerald-50 hover:text-emerald-600"
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>

            <div
              key={activeProblem.id}
              className="relative overflow-hidden rounded-[32px] border border-emerald-100 bg-white/90 p-10 shadow-xl"
            >
              <div
                className={`absolute -top-24 right-[-80px] h-56 w-56 rounded-full opacity-20 blur-3xl ${
                  activeProblem.accent === "emerald"
                    ? "bg-emerald-300"
                    : activeProblem.accent === "sky"
                      ? "bg-sky-300"
                      : "bg-amber-300"
                }`}
              />
              <div className="relative grid gap-10 md:grid-cols-[1.2fr_1fr] md:items-center">
                <div className="space-y-5 text-left">
                  <span
                    className={`inline-flex items-center rounded-full px-5 py-2 text-sm font-bold uppercase tracking-[0.35em] text-${
                      activeProblem.accent
                    }-600`}
                  >
                    {activeProblem.name}
                  </span>
                  <h3 className="text-4xl font-bold text-slate-900 md:text-[2.6rem] md:leading-tight">
                    {activeProblem.headline}
                  </h3>
                  <p className="text-xl font-medium leading-relaxed text-slate-600">
                    {activeProblem.description}
                  </p>
                  <ul className="space-y-5">
                    {activeProblem.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="flex gap-4 text-lg font-medium text-slate-600"
                      >
                        <span
                          className={`mt-1 h-2.5 w-2.5 flex-none rounded-full bg-${activeProblem.accent}-500`}
                        />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="relative rounded-3xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/40 to-white p-8 shadow-inner">
                  <div className="space-y-4">
                    <div className="text-base font-bold uppercase tracking-[0.2em] text-slate-500">
                      Как это выглядит сейчас
                    </div>
                    <div className="space-y-4">
                      {activeProblem.bullets.map((bullet) => (
                        <div
                          key={bullet}
                          className="rounded-2xl border border-white/70 bg-white/95 px-5 py-4 text-base font-medium text-slate-600 shadow-sm"
                        >
                          {bullet}
                        </div>
                      ))}
                    </div>
                    <div className="rounded-2xl border border-emerald-100 bg-white/95 p-5 text-sm font-semibold uppercase tracking-[0.25em] text-emerald-500">
                      Visual mockup
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="solution" className="bg-white py-20">
          <div className="mx-auto max-w-6xl space-y-12 px-6">
            <div className="space-y-5 text-center">
              <span className="text-base font-bold uppercase tracking-[0.35em] text-emerald-500">
                Наш ответ
              </span>
              <h2 className="text-4xl font-bold text-slate-900 md:text-5xl">
                Serkor превращает клинику в предсказуемую систему
              </h2>
              <p className="mx-auto max-w-3xl text-xl leading-relaxed text-slate-600">
                Вся операционка — в одной платформе. Сердце клиники работает
                плавно: приёмы идут по плану, командa видит загрузку, а
                руководитель понимает цифры в реальном времени.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {solutionItems.map((item) => (
                <div
                  key={item.title}
                  className="flex h-full flex-col gap-7 rounded-3xl border border-emerald-100 bg-emerald-50/60 p-8 shadow-lg"
                >
                  <div className="space-y-4">
                    <span
                      className={`inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-bold uppercase tracking-[0.3em] text-${item.accent}-600`}
                    >
                      {item.title}
                    </span>
                    <p className="text-xl font-semibold leading-relaxed text-emerald-900/90">
                      {item.description}
                    </p>
                  </div>
                  <div className="flex flex-1 flex-col gap-4 rounded-2xl border border-white/70 bg-white/95 p-6 shadow-inner">
                    {item.preview.map((row) => (
                      <div
                        key={row.label}
                        className="rounded-xl bg-white p-5 shadow-sm"
                      >
                        <div className="text-lg font-bold text-emerald-700">
                          {row.label}
                        </div>
                        {"time" in row ? (
                          <div className="mt-1 text-base font-medium text-slate-500">
                            {row.time} · {row.doctor} · {row.room}
                          </div>
                        ) : (
                          <>
                            <div className="mt-1 text-2xl font-bold text-emerald-700">
                              {row.value}
                            </div>
                            <div className="text-base font-medium text-slate-500">
                              {row.status}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-6xl px-6 py-20">
          <div className="space-y-5 text-center">
            <span className="text-base font-bold uppercase tracking-[0.35em] text-emerald-500">
              Тарифы
            </span>
            <h2 className="text-4xl font-bold text-slate-900 md:text-5xl">
              Модели под любую стоматологию
            </h2>
            <p className="mx-auto max-w-2xl text-xl text-slate-600">
              Выберите подходящий формат. Мы поможем перенести данные, обучим
              команду и включим офлайн-режим.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                name: "Start",
                accent: "bg-white",
                price: "Для соло-клиники",
                bullets: [
                  "1 клиника · 5 пользователей",
                  "Учет пациентов и оплат",
                  "Офлайн + веб-доступ",
                ],
              },
              {
                name: "Growth",
                accent:
                  "bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-500 text-white",
                price: "Для команд 10+ человек",
                bullets: [
                  "Безлимит врачи и кабинеты",
                  "Автоматизация процессов",
                  "Отчёты по выручке и KPI",
                ],
              },
              {
                name: "Network",
                accent: "bg-white",
                price: "Для сетей и франшиз",
                bullets: [
                  "Несколько филиалов",
                  "Единый финансовый контур",
                  "API и кастомные интеграции",
                ],
              },
            ].map((plan, index) => (
              <div
                key={plan.name}
                className={`relative rounded-[28px] border border-emerald-100 p-[1px] shadow-lg ${
                  index === 1
                    ? "shadow-emerald-200/60"
                    : "shadow-emerald-100/50"
                }`}
              >
                <div className={`h-full rounded-[26px] ${plan.accent} p-8`}>
                  <div className="flex flex-col gap-6 text-left">
                    <div>
                      <span className="text-sm uppercase tracking-[0.3em] opacity-70">
                        {plan.name}
                      </span>
                      <h3
                        className={`mt-2 text-2xl font-semibold ${index === 1 ? "text-white" : "text-slate-900"}`}
                      >
                        {plan.price}
                      </h3>
                    </div>
                    <ul className="space-y-3 text-sm">
                      {plan.bullets.map((bullet) => (
                        <li
                          key={bullet}
                          className={`flex items-start gap-3 ${
                            index === 1
                              ? "text-emerald-50/90"
                              : "text-slate-600"
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
              <span className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-500">
                FAQ
              </span>
              <h2 className="text-3xl font-semibold text-slate-900 md:text-4xl">
                Частые вопросы о Serkor
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-slate-600">
                Мы подготовим оргструктуру, загрузим пациентов и обучим
                администраторов. Все данные остаются только у вас.
              </p>
            </div>

            <div className="space-y-4">
              {faqItems.map((item) => {
                const isOpen = openFaqId === item.question;
                return (
                  <div
                    key={item.question}
                    className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm"
                  >
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
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl rounded-[32px] bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-500 px-8 py-16 text-center text-white shadow-2xl">
          <div className="space-y-6">
            <h2 className="text-3xl font-semibold md:text-4xl">
              Запустите новую стоматологию для вашей команды уже на этой неделе
            </h2>
            <p className="text-lg text-emerald-50/90">
              Мы лично проведём онбординг, настроим офлайн-режим и дадим
              инструкции по росту клиники.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/signup">
                <Button
                  size="lg"
                  variant="secondary"
                  className="px-8 text-emerald-700"
                >
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
