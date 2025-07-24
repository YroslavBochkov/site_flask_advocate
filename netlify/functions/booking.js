const RATE_LIMIT_SECONDS = 60; // 1 заявка в минуту с одного IP
let lastRequests = {};

exports.handler = async function(event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  const data = JSON.parse(event.body);

  // 1. Валидация обязательных полей
  if (
    !data.name ||
    !data.email ||
    !data.phone ||
    !data.datetime
  ) {
    return { statusCode: 400, body: "Все поля обязательны для заполнения." };
  }

  // 2. Валидация email
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(data.email)) {
    return { statusCode: 400, body: "Некорректный e-mail." };
  }

  // 3. Валидация телефона (только +7 и 10 цифр)
  const digits = data.phone.replace(/\D/g, "");
  if (!(data.phone.startsWith("+7") && digits.length === 11)) {
    return { statusCode: 400, body: "Некорректный телефон." };
  }

  // 4. Антифлуд: ограничение по IP (rate limit)
  const ip = event.headers["x-forwarded-for"] || event.headers["client-ip"] || "unknown";
  const now = Date.now() / 1000;
  if (lastRequests[ip] && now - lastRequests[ip] < RATE_LIMIT_SECONDS) {
    return { statusCode: 429, body: "Слишком часто. Попробуйте позже." };
  }
  lastRequests[ip] = now;

  // 5. Проверка на подозрительный текст (простая)
  const suspicious = [data.name, data.email, data.phone].some(val =>
    /https?:|<script|<\/|onerror|onload|<img|<a/i.test(val)
  );
  if (suspicious) {
    return { statusCode: 400, body: "Подозрительный ввод." };
  }

  // Формируем текст для Telegram
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
  const text = `📝 Новая заявка на онлайн-консультацию:
Имя: ${data.name || "-"}
E-mail: ${data.email || "-"}
Телефон: ${data.phone || "-"}
Дата и время: ${data.datetime || "-"}
Проверьте оплату и свяжитесь с клиентом для подтверждения и отправки ссылки на Zoom.`;

  // Отправляем в Telegram
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `chat_id=${TELEGRAM_CHAT_ID}&text=${encodeURIComponent(text)}`
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ status: "ok" })
  };
};
