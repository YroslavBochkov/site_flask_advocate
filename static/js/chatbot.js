let chatbotSteps = [];
let chatbotState = 0;
let chatbotForm = {};

// Рендер одного шага сценария
function renderChatbotStep(stepIdx) {
  const step = chatbotSteps[stepIdx];
  const messages = document.getElementById('chatbot-messages');
  const buttons = document.getElementById('chatbot-buttons');
  if (!step) return;


  // 1. Календарь для выбора даты и времени
  if (step.calendar) {
    console.log('Календарь должен появиться!', stepIdx, step);
    messages.innerHTML = `<div style="margin-bottom:8px;">${step.text}</div>`;
    buttons.innerHTML = '';
    const input = document.createElement('input');
    input.type = 'datetime-local';
    input.autocomplete = 'off';
    input.style = "width: 90%; margin-top:8px; padding:6px; border-radius:4px; border:1px solid #ccc;";

    // Ограничения: только рабочие дни и время с 10:00 до 16:00
    // min/max для времени
    const now = new Date();
    // min: сегодня, 10:00
    let minDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0, 0);
    // Если сейчас после 16:00, minDate = завтра 10:00
    if (now.getHours() >= 16) {
      minDate.setDate(minDate.getDate() + 1);
    }
    // max: через 30 дней, 16:00
    let maxDate = new Date(minDate);
    maxDate.setDate(maxDate.getDate() + 30);
    maxDate.setHours(16, 0, 0, 0);

    function toDatetimeLocal(dt) {
      // YYYY-MM-DDTHH:MM
      return dt.toISOString().slice(0,16);
    }
    input.min = toDatetimeLocal(minDate);
    input.max = toDatetimeLocal(maxDate);

    // При изменении значения — запрещаем выходные и нерабочее время
    input.addEventListener('change', function() {
      if (!input.value) return;
      const dt = new Date(input.value);
      const day = dt.getDay(); // 0 - воскресенье, 6 - суббота
      const hour = dt.getHours();
      if (day === 0 || day === 6) {
        alert('Пожалуйста, выберите рабочий день (Пн-Пт).');
        input.value = '';
        return;
      }
      if (hour < 10 || hour >= 16) {
        alert('Пожалуйста, выберите время с 10:00 до 16:00.');
        input.value = '';
        return;
      }
    });

    buttons.appendChild(input);
    const sendBtn = document.createElement('button');
    sendBtn.textContent = 'Далее';
    sendBtn.style = "margin: 8px 0 0 0; display:block;";
    sendBtn.onclick = () => {
      if (!input.value) {
        alert('Пожалуйста, выберите дату и время.');
        return;
      }
      // Повторная проверка на всякий случай
      const dt = new Date(input.value);
      const day = dt.getDay();
      const hour = dt.getHours();
      if (day === 0 || day === 6) {
        alert('Пожалуйста, выберите рабочий день (Пн-Пт).');
        return;
      }
      if (hour < 10 || hour >= 16) {
        alert('Пожалуйста, выберите время с 10:00 до 16:00.');
        return;
      }
      chatbotForm['datetime'] = input.value;
      renderChatbotStep(stepIdx + 1);
      chatbotState = stepIdx + 1;
    };
    buttons.appendChild(sendBtn);
    return;
  }

  // 2. Форма для ввода данных (имя, email, телефон)
  if (step.input) {
    messages.innerHTML += `<div style="margin-bottom:8px;">${step.text}</div>`;
    buttons.innerHTML = '';
    const input = document.createElement('input');
    if (step.input === 'email') {
      input.type = 'email';
      input.placeholder = 'Ваш e-mail';
      input.autocomplete = 'email';
    } else if (step.input === 'name') {
      input.type = 'text';
      input.placeholder = 'Ваше имя';
      input.autocomplete = 'name';
    } else if (step.input === 'phone') {
      input.type = 'tel';
      input.placeholder = '+7 (___) ___-__-__';
      input.autocomplete = 'tel';
    } else {
      input.type = 'text';
      input.placeholder = '';
      input.autocomplete = 'off';
    }
    buttons.appendChild(input);
    const sendBtn = document.createElement('button');
    sendBtn.textContent = 'Далее';
    sendBtn.style = "margin: 8px 0 0 0; display:block;";
    sendBtn.onclick = () => {
      const value = input.value.trim();
      // Валидация по типу поля
      if (!value) {
        alert('Пожалуйста, заполните поле.');
        return;
      }
      if (step.input === 'email') {
        // Простая email-валидация
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(value)) {
          alert('Пожалуйста, введите корректный e-mail.');
          return;
        }
      }
      if (step.input === 'phone') {
        // Валидация российского номера: +7 и 10 цифр
        const digits = value.replace(/\D/g, '');
        if (!(value.startsWith('+7') && digits.length === 11)) {
          alert('Пожалуйста, введите телефон в формате +7XXXXXXXXXX.');
          return;
        }
      }
      if (step.input === 'name') {
        // Имя не менее 2 символов, только буквы и пробелы
        if (value.length < 2 || !/^[А-Яа-яA-Za-z\s\-]+$/.test(value)) {
          alert('Пожалуйста, введите корректное имя.');
          return;
        }
      }
      chatbotForm[step.input] = value;

      // Если это последний шаг формы (например, телефон), отправляем заявку через Netlify Function
      if (step.input === 'phone') {
        fetch('/api/booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(chatbotForm)
        });
        renderChatbotStep(stepIdx + 1);
        chatbotState = stepIdx + 1;
        chatbotForm = {};
      } else {
        renderChatbotStep(stepIdx + 1);
        chatbotState = stepIdx + 1;
      }
    };
    buttons.appendChild(sendBtn);
    return;
  }

  // 3. Картинка (например, QR-код)
  if (step.image) {
    messages.innerHTML += `<div style="margin-bottom:8px;">${step.text}</div>
      <img src="${step.image}" alt="QR-код для оплаты" style="max-width:100%;margin:12px 0;border-radius:8px;box-shadow:0 2px 8px #000a;">`;
  }

  // 4. Кнопки
  if (step.buttons && step.buttons.length > 0) {
    // Если уже есть текст (например, после картинки), не дублируем
    if (!step.image) {
      messages.innerHTML += `<div style="margin-bottom:8px;">${step.text}</div>`;
    }
    buttons.innerHTML = '';
    step.buttons.forEach(btn => {
      if (btn.url) {
        // Ссылка-кнопка (телефон, WhatsApp, Telegram, оплата)
        const a = document.createElement('a');
        a.textContent = btn.label;
        a.href = btn.url;
        if (btn.url.startsWith('http')) {
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
        }
        a.style = "margin: 4px 4px 0 0; background:#1e90ff; color:#fff; border:none; border-radius:4px; padding:6px 12px; cursor:pointer; display:inline-block; text-align:center; text-decoration:none;";
        buttons.appendChild(a);
      } else {
        // Обычная кнопка (переход по сценарию)
        const b = document.createElement('button');
        b.textContent = btn.label;
        b.onclick = () => {
          if (btn.next === null) {
            // Закрыть чат
            document.getElementById('chatbot-window').style.display = 'none';
            messages.innerHTML = '';
            chatbotState = 0;
            chatbotForm = {};
          } else if (
            chatbotSteps[btn.next] &&
            !chatbotSteps[btn.next].calendar &&
            !chatbotSteps[btn.next].input &&
            (!chatbotSteps[btn.next].buttons || chatbotSteps[btn.next].buttons.length === 0)
          ) {
            // Если это кнопка "Нет, спасибо" (ведёт на прощальный шаг), показываем только прощание на чистом экране
            messages.innerHTML = `<div style="margin-bottom:8px;">${chatbotSteps[btn.next].text}</div>`;
            document.getElementById('chatbot-buttons').innerHTML = '';
            setTimeout(() => {
              document.getElementById('chatbot-window').style.display = 'none';
              messages.innerHTML = '';
              chatbotState = 0;
              chatbotForm = {};
            }, 2000);
          } else {
            renderChatbotStep(btn.next);
            chatbotState = btn.next;
          }
        };
        buttons.appendChild(b);
      }
    });
    return;
  }

  // 4. Если ничего нет — прощальный шаг
  messages.innerHTML = `<div style="margin-bottom:8px;">${step.text}</div>`;
  buttons.innerHTML = '';
  setTimeout(() => {
    document.getElementById('chatbot-window').style.display = 'none';
    messages.innerHTML = '';
    chatbotState = 0;
    chatbotForm = {};
  }, 10000);
}

// Загрузка сценария и инициализация кнопки открытия
window.addEventListener('DOMContentLoaded', function() {
  fetch('/chatbot_scenario')
    .then(response => response.json())
    .then(data => {
      chatbotSteps = data;
      // Обработчик кнопки "💬"
      const toggle = document.getElementById('chatbot-toggle');
      if (!toggle) return;
      toggle.onclick = function() {
        const win = document.getElementById('chatbot-window');
        if (win.style.display === 'none' || win.style.display === '') {
          win.style.display = 'block';
          document.getElementById('chatbot-messages').innerHTML = '';
          document.getElementById('chatbot-buttons').innerHTML = '';
          renderChatbotStep(0);
          chatbotState = 0;
          chatbotForm = {};
        } else {
          win.style.display = 'none';
          document.getElementById('chatbot-messages').innerHTML = '';
          document.getElementById('chatbot-buttons').innerHTML = '';
          chatbotState = 0;
          chatbotForm = {};
        }
      };
    });
});
