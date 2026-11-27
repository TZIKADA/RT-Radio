import { Button } from "react-bootstrap";
import { useNavigate } from "react-router";
import AuthCard from "../components/AuthCard";
import { useTranslation } from "../components/LanguageProvider";

export default function Contact() {
    const { language, t } = useTranslation();
    const navigate = useNavigate();

    function returnToApp() {
        const historyIndex = window.history.state?.idx;
        if (typeof historyIndex === "number" && historyIndex > 0) {
            navigate(-1);
            return;
        }
        navigate("/");
    }

    return (
        <AuthCard title={t("contact")} width="fit-content" showContact={false}>
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
            <div className="text-end mt-3">
                <Button
                    variant="outline-secondary"
                    className="d-inline-flex align-items-center gap-1"
                    onClick={returnToApp}
                >
                    <i className="bi bi-arrow-left" aria-hidden="true" />
                    {t("returnToApp")}
                </Button>
            </div>
        </AuthCard>
    );
}
