const RATE_LIMIT_SECONDS = 60; // 1 заявка в минуту с одного IP
let lastRequests = {};

exports.handler = async function(event, context) {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      },
      body: ""
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: "Method Not Allowed"
    };
  }

  // ТЕСТОВЫЕ ДАННЫЕ для отладки Telegram (раскомментируйте для теста)
  // const data = {
  //   name: "Тестовый клиент",
  //   email: "test@example.com",
  //   phone: "+79991234567",
  //   datetime: "2024-07-25T14:00"
  // };

  // Для реального использования:
  let data;
  try {
    data = JSON.parse(event.body);
  } catch (e) {
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: "Некорректный JSON."
    };
  }

  // Если хотите всегда тестировать — раскомментируйте строку ниже:
  // data = { name: "Тестовый клиент", email: "test@example.com", phone: "+79991234567", datetime: "2024-07-25T14:00" };

  // 1. Валидация обязательных полей
  if (
    !data.name ||
    !data.email ||
    !data.phone ||
    !data.datetime
  ) {
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: "Все поля обязательны для заполнения."
    };
  }

  // 2. Валидация email
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(data.email)) {
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: "Некорректный e-mail."
    };
  }

  // 3. Валидация телефона (только +7 и 10 цифр)
  const digits = data.phone.replace(/\D/g, "");
  if (!(data.phone.startsWith("+7") && digits.length === 11)) {
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: "Некорректный телефон."
    };
  }

  // 4. Антифлуд: ограничение по IP (rate limit)
  const ip = event.headers["x-forwarded-for"] || event.headers["client-ip"] || "unknown";
  const now = Date.now() / 1000;
  if (lastRequests[ip] && now - lastRequests[ip] < RATE_LIMIT_SECONDS) {
    return {
      statusCode: 429,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: "Слишком часто. Попробуйте позже."
    };
  }
  lastRequests[ip] = now;

  // 5. Проверка на подозрительный текст (простая)
  const suspicious = [data.name, data.email, data.phone].some(val =>
    /https?:|<script|<\/|onerror|onload|<img|<a/i.test(val)
  );
  if (suspicious) {
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: "Подозрительный ввод."
    };
  }

  // Формируем текст для Telegram
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
  const SECOND_TELEGRAM_CHAT_ID = process.env.SECOND_TELEGRAM_CHAT_ID; // второй chat_id из .env
  const text = `📝 Новая заявка на онлайн-консультацию:
Имя: ${data.name || "-"}
E-mail: ${data.email || "-"}
Телефон: ${data.phone || "-"}
Дата и время: ${data.datetime || "-"}
Проверьте оплату и свяжитесь с клиентом для подтверждения и отправки ссылки на Zoom.`;

  // Логируем для отладки
  console.log("Booking function called, отправляем в Telegram:", text);

  // Отправляем в Telegram двум получателям
  const sendToTelegram = async (chatId) => {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `chat_id=${chatId}&text=${encodeURIComponent(text)}`
    });
  };

  await sendToTelegram(TELEGRAM_CHAT_ID);
  if (SECOND_TELEGRAM_CHAT_ID) {
    await sendToTelegram(SECOND_TELEGRAM_CHAT_ID);
  }

  return {
    statusCode: 200,
    headers: { "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify({ status: "ok" })
  };
};
