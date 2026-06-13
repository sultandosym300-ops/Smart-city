import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Lang = "ru" | "kk";

const dict = {
  ru: {
    "app.name": "Smart City AI Dispatcher",
    "app.tagline": "Городской ИИ-диспетчер обращений граждан",
    "nav.home": "Главная",
    "nav.map": "Карта города",
    "nav.new": "Создать обращение",
    "nav.myReports": "Мои обращения",
    "nav.worker": "Кабинет службы",
    "nav.admin": "Акимат",
    "nav.signIn": "Войти",
    "nav.signOut": "Выйти",

    "home.title": "Город слышит вас",
    "home.subtitle": "Сообщите о проблеме за 30 секунд. Искусственный интеллект сам определит категорию, приоритет и направит заявку нужной службе.",
    "home.cta.report": "Сообщить о проблеме",
    "home.cta.map": "Открыть карту города",
    "home.feature.ai.title": "ИИ-анализ обращений",
    "home.feature.ai.desc": "Gemini автоматически классифицирует проблему, определяет срочность и рекомендует решение.",
    "home.feature.map.title": "Прозрачность и карта",
    "home.feature.map.desc": "Все обращения видны на карте города. Жители видят, что делает власть.",
    "home.feature.workflow.title": "Сквозной процесс",
    "home.feature.workflow.desc": "Житель → ИИ → служба → акимат. Каждый этап фиксируется.",
    "home.stats.title": "Город в цифрах",

    "auth.signIn": "Вход",
    "auth.signUp": "Регистрация",
    "auth.email": "Email",
    "auth.password": "Пароль",
    "auth.fullName": "Полное имя",
    "auth.phone": "Телефон",
    "auth.submit.signIn": "Войти",
    "auth.submit.signUp": "Создать аккаунт",
    "auth.switch.toSignUp": "Нет аккаунта? Зарегистрироваться",
    "auth.switch.toSignIn": "Уже есть аккаунт? Войти",
    "auth.success.signIn": "Добро пожаловать!",
    "auth.success.signUp": "Аккаунт создан",

    "report.new.title": "Новое обращение",
    "report.new.subtitle": "Расскажите о проблеме — ИИ определит куда направить",
    "report.new.location": "Место на карте",
    "report.new.locationHint": "Кликните на карту, чтобы поставить точку",
    "report.new.photo": "Фотография",
    "report.new.description": "Описание проблемы",
    "report.new.descriptionPh": "Например: яма на дороге глубиной около 30 см, мешает движению...",
    "report.new.anonName": "Ваше имя (необязательно)",
    "report.new.anonPhone": "Телефон (необязательно)",
    "report.new.address": "Адрес или ориентир",
    "report.new.submit": "Отправить обращение",
    "report.new.submitting": "Отправка и ИИ-анализ...",
    "report.new.success": "Спасибо! Обращение принято",
    "report.new.successDesc": "ИИ проанализировал и направил заявку в службу.",

    "report.status.new": "Новая",
    "report.status.approved": "Одобрено акиматом",
    "report.status.in_progress": "В работе",
    "report.status.awaiting_confirmation": "Ожидает подтверждения",
    "report.status.completed": "Завершена",
    "report.status.returned": "Возвращена",

    "report.priority.low": "Низкий",
    "report.priority.medium": "Средний",
    "report.priority.high": "Высокий",

    "cat.roads": "Дороги",
    "cat.water": "Вода",
    "cat.electricity": "Электричество",
    "cat.sanitation": "Санитария",
    "cat.transport": "Транспорт",
    "cat.emergency": "ЧС",
    "cat.other": "Прочее",

    "ai.title": "Анализ ИИ",
    "ai.category": "Категория",
    "ai.priority": "Приоритет",
    "ai.service": "Служба",
    "ai.reason": "Обоснование",
    "ai.solution": "Рекомендация",

    "worker.title": "Кабинет сотрудника",
    "worker.tabs.assigned": "Назначенные",
    "worker.tabs.inProgress": "В работе",
    "worker.tabs.awaiting": "На проверке",
    "worker.tabs.done": "Завершённые",
    "worker.take": "Взять в работу",
    "worker.sendCheck": "Отправить на проверку",
    "worker.completionPhoto": "Фото после выполнения",
    "worker.completionComment": "Комментарий о работе",

    "admin.title": "Кабинет акимата",
    "admin.stats.total": "Всего обращений",
    "admin.stats.high": "Критических",
    "admin.stats.inProgress": "В работе",
    "admin.stats.done": "Завершено",
    "admin.byService": "По службам",
    "admin.byDistrict": "По районам",
    "admin.confirm": "Подтвердить выполнение",
    "admin.return": "Вернуть на доработку",
    "admin.returnReason": "Причина возврата",

    "my.title": "Мои обращения",
    "my.empty": "У вас пока нет обращений",

    "common.loading": "Загрузка...",
    "common.before": "До",
    "common.after": "После",
    "common.allCategories": "Все категории",
    "common.allStatuses": "Все статусы",
    "common.viewOnMap": "Показать на карте",
    "common.back": "Назад",
    "common.cancel": "Отмена",
    "common.save": "Сохранить",
    "common.required": "Обязательное поле",
  },
  kk: {
    "app.name": "Smart City AI Dispatcher",
    "app.tagline": "Қалалық AI өтініш диспетчері",
    "nav.home": "Басты бет",
    "nav.map": "Қала картасы",
    "nav.new": "Өтініш құру",
    "nav.myReports": "Менің өтініштерім",
    "nav.worker": "Қызмет кабинеті",
    "nav.admin": "Әкімдік",
    "nav.signIn": "Кіру",
    "nav.signOut": "Шығу",

    "home.title": "Қала сізді естиді",
    "home.subtitle": "30 секундта мәселе туралы хабарлаңыз. Жасанды интеллект санатын, басымдылығын анықтап, қажетті қызметке жібереді.",
    "home.cta.report": "Мәселе туралы хабарлау",
    "home.cta.map": "Қала картасын ашу",
    "home.feature.ai.title": "AI өтініш талдауы",
    "home.feature.ai.desc": "Gemini автоматты түрде мәселені жіктеп, шұғылдығын анықтайды.",
    "home.feature.map.title": "Ашықтық және карта",
    "home.feature.map.desc": "Барлық өтініштер картада көрінеді. Тұрғындар билік не істеп жатқанын көреді.",
    "home.feature.workflow.title": "Толық процесс",
    "home.feature.workflow.desc": "Тұрғын → AI → қызмет → әкімдік. Әр кезең тіркеледі.",
    "home.stats.title": "Қала сандарда",

    "auth.signIn": "Кіру",
    "auth.signUp": "Тіркелу",
    "auth.email": "Email",
    "auth.password": "Құпиясөз",
    "auth.fullName": "Толық аты-жөні",
    "auth.phone": "Телефон",
    "auth.submit.signIn": "Кіру",
    "auth.submit.signUp": "Аккаунт жасау",
    "auth.switch.toSignUp": "Аккаунт жоқ па? Тіркелу",
    "auth.switch.toSignIn": "Аккаунт бар ма? Кіру",
    "auth.success.signIn": "Қош келдіңіз!",
    "auth.success.signUp": "Аккаунт жасалды",

    "report.new.title": "Жаңа өтініш",
    "report.new.subtitle": "Мәселе туралы айтыңыз — AI қайда жіберу керектігін анықтайды",
    "report.new.location": "Картадағы орын",
    "report.new.locationHint": "Картаға басып, нүкте қойыңыз",
    "report.new.photo": "Фотосурет",
    "report.new.description": "Мәселенің сипаттамасы",
    "report.new.descriptionPh": "Мысалы: жолдағы 30 см тереңдіктегі шұңқыр...",
    "report.new.anonName": "Атыңыз (міндетті емес)",
    "report.new.anonPhone": "Телефон (міндетті емес)",
    "report.new.address": "Мекенжай немесе бағдар",
    "report.new.submit": "Өтінішті жіберу",
    "report.new.submitting": "Жіберілуде және AI талдауы...",
    "report.new.success": "Рахмет! Өтініш қабылданды",
    "report.new.successDesc": "AI талдап, қызметке бағыттады.",

    "report.status.new": "Жаңа",
    "report.status.approved": "Әкімдік мақұлдады",
    "report.status.in_progress": "Жұмыста",
    "report.status.awaiting_confirmation": "Растауды күтуде",
    "report.status.completed": "Аяқталды",
    "report.status.returned": "Қайтарылды",

    "report.priority.low": "Төмен",
    "report.priority.medium": "Орташа",
    "report.priority.high": "Жоғары",

    "cat.roads": "Жолдар",
    "cat.water": "Су",
    "cat.electricity": "Электр",
    "cat.sanitation": "Санитария",
    "cat.transport": "Көлік",
    "cat.emergency": "ТЖ",
    "cat.other": "Басқа",

    "ai.title": "AI талдауы",
    "ai.category": "Санат",
    "ai.priority": "Басымдық",
    "ai.service": "Қызмет",
    "ai.reason": "Негіздеме",
    "ai.solution": "Ұсыныс",

    "worker.title": "Қызметкер кабинеті",
    "worker.tabs.assigned": "Тағайындалған",
    "worker.tabs.inProgress": "Жұмыста",
    "worker.tabs.awaiting": "Тексеруде",
    "worker.tabs.done": "Аяқталған",
    "worker.take": "Жұмысқа алу",
    "worker.sendCheck": "Тексеруге жіберу",
    "worker.completionPhoto": "Орындау фотосы",
    "worker.completionComment": "Жұмыс туралы пікір",

    "admin.title": "Әкімдік кабинеті",
    "admin.stats.total": "Барлығы",
    "admin.stats.high": "Сын-қатерлі",
    "admin.stats.inProgress": "Жұмыста",
    "admin.stats.done": "Аяқталды",
    "admin.byService": "Қызмет бойынша",
    "admin.byDistrict": "Аудан бойынша",
    "admin.confirm": "Орындауды растау",
    "admin.return": "Қайта өңдеуге қайтару",
    "admin.returnReason": "Қайтару себебі",

    "my.title": "Менің өтініштерім",
    "my.empty": "Сізде әлі өтініш жоқ",

    "common.loading": "Жүктелуде...",
    "common.before": "Дейін",
    "common.after": "Кейін",
    "common.allCategories": "Барлық санаттар",
    "common.allStatuses": "Барлық мәртебелер",
    "common.viewOnMap": "Картадан көру",
    "common.back": "Артқа",
    "common.cancel": "Болдырмау",
    "common.save": "Сақтау",
    "common.required": "Міндетті өріс",
  },
} as const;

type Key = keyof typeof dict.ru;

const I18nCtx = createContext<{ lang: Lang; t: (k: Key) => string; setLang: (l: Lang) => void }>({
  lang: "ru",
  t: (k) => k,
  setLang: () => {},
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ru");
  useEffect(() => {
    const saved = typeof window !== "undefined" ? (localStorage.getItem("lang") as Lang | null) : null;
    if (saved === "ru" || saved === "kk") setLangState(saved);
  }, []);
  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("lang", l);
  };
  const t = (k: Key) => dict[lang][k] ?? k;
  return <I18nCtx.Provider value={{ lang, t, setLang }}>{children}</I18nCtx.Provider>;
}

export const useI18n = () => useContext(I18nCtx);