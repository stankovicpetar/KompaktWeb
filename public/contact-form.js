// KompaktWeb kontakt forma
// Cloudflare Pages -> Notion + Telegram

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("contactForm");
  if (!form) return;

  const language = document.documentElement.lang || "sr";
  const translations = {
    sr: {
      security: "Sačekajte da se završi bezbednosna provera.",
      sending: "Slanje upita...",
      success: "Uspešno! Kontaktiraćemo vas uskoro.",
      error: "Došlo je do greške. Pokušajte ponovo."
    },
    en: {
      security: "Please wait for the security check to finish.",
      sending: "Sending your enquiry...",
      success: "Success! We will contact you soon.",
      error: "Your enquiry could not be sent. Please try again.",
      invalid: "Please check your details and enter a project description of 5–2000 characters.",
      tooLarge: "Your enquiry is too long. Please shorten it and try again.",
      securityFailed: "The security check failed. Please try again.",
      securityUnavailable: "The security check is unavailable. Please try again later."
    },
    ru: {
      security: "Дождитесь завершения проверки безопасности.",
      sending: "Отправка запроса...",
      success: "Готово! Мы скоро свяжемся с вами.",
      error: "Не удалось отправить запрос. Попробуйте ещё раз.",
      invalid: "Проверьте данные и добавьте описание проекта длиной от 5 до 2000 символов.",
      tooLarge: "Запрос слишком длинный. Сократите его и попробуйте ещё раз.",
      securityFailed: "Проверка безопасности не пройдена. Попробуйте ещё раз.",
      securityUnavailable: "Проверка безопасности недоступна. Попробуйте позже."
    }
  };
  const messages = translations[language] || translations.sr;

  const status = document.getElementById("formStatus");
  const button = form.querySelector('button[type="submit"]');

  if (!status || !button) {
    console.error("Nedostaje formStatus ili submit dugme.");
    return;
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const fields = new FormData(form);

    const turnstileToken = String(
      fields.get("cf-turnstile-response") || ""
    );

    if (!turnstileToken) {
      status.textContent = messages.security;
      return;
    }

    const data = {
      ime: String(fields.get("ime") || "").trim(),
      email: String(fields.get("email") || "").trim(),
      telefon: String(fields.get("telefon") || "").trim(),
      paket: String(fields.get("paket") || "").trim(),
      poruka: String(fields.get("poruka") || "").trim(),
      turnstileToken: turnstileToken
    };

    button.disabled = true;
    status.textContent = messages.sending;

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      const result = await response.json().catch(function () {
        return {};
      });

      if (!response.ok || result.success !== true) {
        const errors = {
          400: messages.invalid,
          403: messages.securityFailed,
          413: messages.tooLarge,
          503: messages.securityUnavailable
        };
        status.textContent = language === "sr"
          ? result.error || "Slanje nije uspelo. Pokušajte ponovo."
          : errors[response.status] || messages.error;
        return;
      }

      status.textContent = messages.success;

      form.reset();

      try {
        if (typeof window.fbq === "function") {
          window.fbq('track', 'Lead');
        }
      } catch (error) {
        console.warn("Meta Pixel Lead tracking failed.", error);
      }

    } catch (error) {
      status.textContent = language === "sr"
        ? error.message || messages.error
        : messages.error;

    } finally {
      button.disabled = false;

      if (
        window.turnstile &&
        typeof window.turnstile.reset === "function"
      ) {
        window.turnstile.reset();
      }
    }
  });
});
