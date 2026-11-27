import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";

const LANGUAGE_STORAGE_KEY = "rt-radio-language";

const english = {
    language: "Language",
    menu: "Menu",
    guide: "Guide",
    contact: "Contact",
    contactPrompt: "If the issue persists, ",
    contactAdministrator: "contact the site administrator.",
    downloads: "Downloads",
    name: "Name",
    localizedName: "Dan Krumkop",
    hebrewName: "דן קרומקופ",
    phone: "Phone",
    switchToLight: "Switch to light mode",
    switchToDark: "Switch to dark mode",
    login: "Login",
    signUp: "Sign Up",
    email: "Email",
    emailAddress: "Email address",
    password: "Password",
    enterPassword: "Enter password",
    forgotYourPassword: "Forgot your password?",
    loggingIn: "Logging in…",
    forgotPassword: "Forgot password",
    sendResetLink: "Send reset link",
    sending: "Sending…",
    backToLogin: "Back to Login",
    enterEmailForReset: "Enter your email and we'll send you a link to choose a new password.",
    checkYourEmail: "Check your email",
    confirmationSent: "If an account exists for {email}, we sent a link to reset your password. Check your inbox (and spam folder).",
    signUpTitle: "Sign Up",
    emailAddressLabel: "Email Address",
    confirmPassword: "Confirm password",
    passwordsDoNotMatch: "Passwords do not match.",
    atLeastCharacters: "At least {count} characters.",
    phoneNumberOptional: "Phone Number (optional)",
    enterPhoneNumber: "Enter phone number",
    repeatPassword: "Repeat password",
    creatingAccount: "Creating account…",
    accountAlreadyExists: "An account with this email already exists.",
    confirmationLinkSent: "We sent a confirmation link to {email}. Open it to activate your account, then log in.",
    yourHeaders: "Your headers",
    downloadAssignedHeaders: "Download the header files assigned to your account.",
    signInFailed: "We couldn't sign you in. Check your details and try again.",
    requestFailed: "We couldn't complete that request. Please try again.",
    headersLoadFailed: "We couldn't load your files.",
    downloadFailed: "We couldn't prepare this download.",
    loadingHeaders: "Loading headers…",
    noHeadersAssigned: "No downloadable headers are assigned to your account yet. Ask an administrator to add them to your user_headers list.",
    preparingDownload: "Preparing download…",
    download: "Download",
    accountSettings: "Account settings",
    emailChangeHelp: "Supabase may require you to confirm the new address by email before it takes effect.",
    alreadyAccountEmail: "That is already the email on your account.",
    confirmEmailChange: "Check your inbox to confirm the email address change.",
    saving: "Saving…",
    updateEmail: "Update email",
    newPassword: "New password",
    confirmNewPassword: "Confirm new password",
    passwordUpdated: "Your password has been updated.",
    updatePassword: "Update password",
    resetPassword: "Reset password",
    invalidResetLink: "This reset link is invalid or expired. Request a new one.",
    requestNewLink: "Request a new link",
    enterNewPassword: "Enter new password",
    repeatNewPassword: "Repeat new password",
    setNewPassword: "Set new password",
};

type TranslationKey = keyof typeof english;
export type Language = "en" | "he" | "ru" | "ar";

const translations: Record<Language, Record<TranslationKey, string>> = {
    en: english,
    he: {
        language: "שפה",
        menu: "תפריט",
        guide: "מדריך",
        contact: "יצירת קשר",
        contactPrompt: "אם הבעיה נמשכת, ",
        contactAdministrator: "פנו למנהל המערכת.",
        downloads: "הורדות",
        name: "שם",
        localizedName: "דן קרומקופ",
        hebrewName: "דן קרומקופ",
        phone: "טלפון",
        switchToLight: "מעבר למצב בהיר",
        switchToDark: "מעבר למצב כהה",
        login: "התחברות",
        signUp: "הרשמה",
        email: "אימייל",
        emailAddress: "כתובת אימייל",
        password: "סיסמה",
        enterPassword: "יש להזין סיסמה",
        forgotYourPassword: "שכחת את הסיסמה?",
        loggingIn: "מתחבר…",
        forgotPassword: "שכחתי סיסמה",
        sendResetLink: "שליחת קישור לאיפוס",
        sending: "שולח…",
        backToLogin: "חזרה להתחברות",
        enterEmailForReset: "הזינו את כתובת האימייל ונשלח קישור לבחירת סיסמה חדשה.",
        checkYourEmail: "בדקו את האימייל",
        confirmationSent: "אם קיים חשבון עבור {email}, שלחנו קישור לאיפוס הסיסמה. בדקו את תיבת הדואר ואת תיקיית הספאם.",
        signUpTitle: "הרשמה",
        emailAddressLabel: "כתובת אימייל",
        confirmPassword: "אימות סיסמה",
        passwordsDoNotMatch: "הסיסמאות אינן תואמות.",
        atLeastCharacters: "יש להזין לפחות {count} תווים.",
        phoneNumberOptional: "מספר טלפון (לא חובה)",
        enterPhoneNumber: "הזינו מספר טלפון",
        repeatPassword: "הזינו את הסיסמה שוב",
        creatingAccount: "יוצר חשבון…",
        accountAlreadyExists: "כבר קיים חשבון עם כתובת אימייל זו.",
        confirmationLinkSent: "שלחנו קישור אימות אל {email}. פתחו אותו כדי להפעיל את החשבון ואז התחברו.",
        yourHeaders: "הכותרות שלך",
        downloadAssignedHeaders: "הורידו את קובצי הכותרת שהוקצו לחשבון שלכם.",
        signInFailed: "לא ניתן להתחבר. בדקו את הפרטים ונסו שוב.",
        requestFailed: "לא ניתן להשלים את הבקשה. נסו שוב.",
        headersLoadFailed: "לא ניתן לטעון את הקבצים.",
        downloadFailed: "לא ניתן להכין את ההורדה.",
        loadingHeaders: "הכותרות נטענות…",
        noHeadersAssigned: "עדיין לא הוקצו לחשבון קובצי כותרת להורדה. בקשו ממנהל מערכת להוסיף אותם לרשימת user_headers שלכם.",
        preparingDownload: "מכין את ההורדה…",
        download: "הורדה",
        accountSettings: "הגדרות חשבון",
        emailChangeHelp: "ייתכן ש-Supabase ידרוש אישור של הכתובת החדשה באימייל לפני שהשינוי ייכנס לתוקף.",
        alreadyAccountEmail: "זו כבר כתובת האימייל בחשבון שלכם.",
        confirmEmailChange: "בדקו את תיבת הדואר כדי לאשר את שינוי כתובת האימייל.",
        saving: "שומר…",
        updateEmail: "עדכון אימייל",
        newPassword: "סיסמה חדשה",
        confirmNewPassword: "אימות סיסמה חדשה",
        passwordUpdated: "הסיסמה עודכנה.",
        updatePassword: "עדכון סיסמה",
        resetPassword: "איפוס סיסמה",
        invalidResetLink: "קישור איפוס הסיסמה אינו תקף או שפג תוקפו. בקשו קישור חדש.",
        requestNewLink: "בקשת קישור חדש",
        enterNewPassword: "הזינו סיסמה חדשה",
        repeatNewPassword: "הזינו את הסיסמה החדשה שוב",
        setNewPassword: "שמירת סיסמה חדשה",
    },
    ru: {
        language: "Язык",
        menu: "Меню",
        guide: "Руководство",
        contact: "Контакты",
        contactPrompt: "Если проблема не исчезнет, ",
        contactAdministrator: "свяжитесь с администратором.",
        downloads: "Загрузки",
        name: "Имя",
        localizedName: "Дан Крумкоп",
        hebrewName: "דן קרומקופ",
        phone: "Телефон",
        switchToLight: "Включить светлую тему",
        switchToDark: "Включить тёмную тему",
        login: "Войти",
        signUp: "Регистрация",
        email: "Электронная почта",
        emailAddress: "Адрес электронной почты",
        password: "Пароль",
        enterPassword: "Введите пароль",
        forgotYourPassword: "Забыли пароль?",
        loggingIn: "Вход…",
        forgotPassword: "Забыли пароль",
        sendResetLink: "Отправить ссылку для сброса",
        sending: "Отправка…",
        backToLogin: "Вернуться ко входу",
        enterEmailForReset: "Введите адрес электронной почты, и мы отправим ссылку для создания нового пароля.",
        checkYourEmail: "Проверьте почту",
        confirmationSent: "Если учётная запись для {email} существует, мы отправили ссылку для сброса пароля. Проверьте входящие и папку со спамом.",
        signUpTitle: "Регистрация",
        emailAddressLabel: "Адрес электронной почты",
        confirmPassword: "Подтвердите пароль",
        passwordsDoNotMatch: "Пароли не совпадают.",
        atLeastCharacters: "Не менее {count} символов.",
        phoneNumberOptional: "Номер телефона (необязательно)",
        enterPhoneNumber: "Введите номер телефона",
        repeatPassword: "Повторите пароль",
        creatingAccount: "Создание учётной записи…",
        accountAlreadyExists: "Учётная запись с таким адресом уже существует.",
        confirmationLinkSent: "Мы отправили ссылку для подтверждения на {email}. Откройте её, чтобы активировать учётную запись, затем войдите.",
        yourHeaders: "Ваши заголовки",
        downloadAssignedHeaders: "Скачайте файлы заголовков, назначенные вашей учётной записи.",
        signInFailed: "Не удалось войти. Проверьте данные и попробуйте ещё раз.",
        requestFailed: "Не удалось выполнить запрос. Попробуйте ещё раз.",
        headersLoadFailed: "Не удалось загрузить файлы.",
        downloadFailed: "Не удалось подготовить загрузку.",
        loadingHeaders: "Загрузка заголовков…",
        noHeadersAssigned: "Пока нет заголовков, назначенных вашей учётной записи. Попросите администратора добавить их в список user_headers.",
        preparingDownload: "Подготовка загрузки…",
        download: "Скачать",
        accountSettings: "Настройки учётной записи",
        emailChangeHelp: "Supabase может потребовать подтверждение нового адреса по электронной почте.",
        alreadyAccountEmail: "Этот адрес уже указан в вашей учётной записи.",
        confirmEmailChange: "Проверьте почту, чтобы подтвердить изменение адреса.",
        saving: "Сохранение…",
        updateEmail: "Изменить электронную почту",
        newPassword: "Новый пароль",
        confirmNewPassword: "Подтвердите новый пароль",
        passwordUpdated: "Пароль обновлён.",
        updatePassword: "Изменить пароль",
        resetPassword: "Сброс пароля",
        invalidResetLink: "Ссылка для сброса пароля недействительна или устарела. Запросите новую ссылку.",
        requestNewLink: "Запросить новую ссылку",
        enterNewPassword: "Введите новый пароль",
        repeatNewPassword: "Повторите новый пароль",
        setNewPassword: "Сохранить новый пароль",
    },
    ar: {
        language: "اللغة",
        menu: "القائمة",
        guide: "الدليل",
        contact: "اتصل بنا",
        contactPrompt: "إذا استمرت المشكلة، ",
        contactAdministrator: "تواصل مع مسؤول الموقع.",
        downloads: "التنزيلات",
        name: "الاسم",
        localizedName: "دان كرومكوب",
        hebrewName: "דן קרומקופ",
        phone: "الهاتف",
        switchToLight: "التبديل إلى الوضع الفاتح",
        switchToDark: "التبديل إلى الوضع الداكن",
        login: "تسجيل الدخول",
        signUp: "إنشاء حساب",
        email: "البريد الإلكتروني",
        emailAddress: "عنوان البريد الإلكتروني",
        password: "كلمة المرور",
        enterPassword: "أدخل كلمة المرور",
        forgotYourPassword: "هل نسيت كلمة المرور؟",
        loggingIn: "جارٍ تسجيل الدخول…",
        forgotPassword: "نسيت كلمة المرور",
        sendResetLink: "إرسال رابط إعادة التعيين",
        sending: "جارٍ الإرسال…",
        backToLogin: "العودة إلى تسجيل الدخول",
        enterEmailForReset: "أدخل بريدك الإلكتروني وسنرسل إليك رابطًا لاختيار كلمة مرور جديدة.",
        checkYourEmail: "تحقق من بريدك الإلكتروني",
        confirmationSent: "إذا كان هناك حساب مرتبط بـ {email}، فقد أرسلنا رابطًا لإعادة تعيين كلمة المرور. تحقق من البريد الوارد ومجلد الرسائل غير المرغوب فيها.",
        signUpTitle: "إنشاء حساب",
        emailAddressLabel: "عنوان البريد الإلكتروني",
        confirmPassword: "تأكيد كلمة المرور",
        passwordsDoNotMatch: "كلمتا المرور غير متطابقتين.",
        atLeastCharacters: "أدخل {count} أحرف على الأقل.",
        phoneNumberOptional: "رقم الهاتف (اختياري)",
        enterPhoneNumber: "أدخل رقم الهاتف",
        repeatPassword: "أعد إدخال كلمة المرور",
        creatingAccount: "جارٍ إنشاء الحساب…",
        accountAlreadyExists: "يوجد حساب بهذا البريد الإلكتروني بالفعل.",
        confirmationLinkSent: "أرسلنا رابط تأكيد إلى {email}. افتحه لتفعيل حسابك، ثم سجّل الدخول.",
        yourHeaders: "ملفات الترويسة الخاصة بك",
        downloadAssignedHeaders: "نزّل ملفات الترويسة المعيّنة لحسابك.",
        signInFailed: "تعذّر تسجيل الدخول. تحقق من بياناتك وحاول مرة أخرى.",
        requestFailed: "تعذّر إكمال الطلب. حاول مرة أخرى.",
        headersLoadFailed: "تعذّر تحميل ملفاتك.",
        downloadFailed: "تعذّر تجهيز التنزيل.",
        loadingHeaders: "جارٍ تحميل الملفات…",
        noHeadersAssigned: "لا توجد ملفات ترويسة معيّنة لحسابك بعد. اطلب من المسؤول إضافتها إلى قائمة user_headers.",
        preparingDownload: "جارٍ تجهيز التنزيل…",
        download: "تنزيل",
        accountSettings: "إعدادات الحساب",
        emailChangeHelp: "قد يطلب Supabase تأكيد العنوان الجديد عبر البريد الإلكتروني قبل تطبيقه.",
        alreadyAccountEmail: "هذا هو عنوان البريد الإلكتروني المسجّل في حسابك بالفعل.",
        confirmEmailChange: "تحقق من بريدك الإلكتروني لتأكيد تغيير العنوان.",
        saving: "جارٍ الحفظ…",
        updateEmail: "تحديث البريد الإلكتروني",
        newPassword: "كلمة المرور الجديدة",
        confirmNewPassword: "تأكيد كلمة المرور الجديدة",
        passwordUpdated: "تم تحديث كلمة المرور.",
        updatePassword: "تحديث كلمة المرور",
        resetPassword: "إعادة تعيين كلمة المرور",
        invalidResetLink: "رابط إعادة تعيين كلمة المرور غير صالح أو انتهت صلاحيته. اطلب رابطًا جديدًا.",
        requestNewLink: "طلب رابط جديد",
        enterNewPassword: "أدخل كلمة مرور جديدة",
        repeatNewPassword: "أعد إدخال كلمة المرور الجديدة",
        setNewPassword: "حفظ كلمة المرور الجديدة",
    },
};

const languageNames: Record<Language, string> = {
    en: "English",
    he: "עברית",
    ru: "Русский",
    ar: "العربية",
};

function isLanguage(value: string | null): value is Language {
    return value !== null && Object.hasOwn(translations, value);
}

function getSystemLanguage(): Language {
    const preferences =
        typeof navigator === "undefined"
            ? []
            : [...(navigator.languages ?? []), navigator.language];

    for (const preference of preferences) {
        const code = preference.toLowerCase().split("-")[0];
        if (isLanguage(code)) return code;
    }

    return "en";
}

function getInitialLanguage(): Language {
    if (typeof localStorage !== "undefined") {
        const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (isLanguage(savedLanguage)) return savedLanguage;
    }

    return getSystemLanguage();
}

type LanguageContextValue = {
    language: Language;
    languageNames: Record<Language, string>;
    setLanguage: (language: Language) => void;
    t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextValue>({
    language: "en",
    languageNames,
    setLanguage: () => {},
    t: (key) => english[key],
});

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState(getInitialLanguage);

    useEffect(() => {
        document.documentElement.lang = language;
        document.documentElement.dir =
            language === "he" || language === "ar" ? "rtl" : "ltr";
    }, [language]);

    useEffect(() => {
        function followSystemLanguage() {
            if (localStorage.getItem(LANGUAGE_STORAGE_KEY) === null) {
                setLanguageState(getSystemLanguage());
            }
        }

        window.addEventListener("languagechange", followSystemLanguage);
        return () =>
            window.removeEventListener("languagechange", followSystemLanguage);
    }, []);

    const setLanguage = useCallback((nextLanguage: Language) => {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
        setLanguageState(nextLanguage);
    }, []);

    const contextValue = useMemo(
        () => ({
            language,
            languageNames,
            setLanguage,
            t: (key: TranslationKey) => translations[language][key],
        }),
        [language, setLanguage],
    );

    return (
        <LanguageContext.Provider value={contextValue}>
            {children}
        </LanguageContext.Provider>
    );
}

// oxlint-disable-next-line react/only-export-components
export function useTranslation() {
    return useContext(LanguageContext);
}
