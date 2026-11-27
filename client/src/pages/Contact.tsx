import AuthCard from "../components/AuthCard";
import { useTranslation } from "../components/LanguageProvider";

export default function Contact() {
    const { language, t } = useTranslation();

    return (
        <AuthCard title={t("contact")} width="fit-content">
            <dl className="contact-details mb-0">
                <dt>{t("phone")}</dt>
                <dd>
                    <a href="tel:0534201812" dir="ltr">
                        0534201812
                    </a>
                </dd>
                <dt>{t("email")}</dt>
                <dd>
                    <a href="mailto:dan0krumkop@gmail.com" dir="ltr">
                        dan0krumkop@gmail.com
                    </a>
                </dd>
                <dt>{t("name")}</dt>
                <dd>
                    <span
                        className="contact-name"
                        dir={
                            language === "he" || language === "ar"
                                ? "rtl"
                                : "ltr"
                        }
                    >
                        <span
                            lang={language}
                            dir={
                                language === "he" || language === "ar"
                                    ? "rtl"
                                    : "ltr"
                            }
                        >
                            {t("localizedName")}
                        </span>
                        {language !== "he" && (
                            <span lang="he" dir="rtl">
                                ({t("hebrewName")})
                            </span>
                        )}
                    </span>
                </dd>
            </dl>
        </AuthCard>
    );
}
