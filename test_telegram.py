from dotenv import load_dotenv
load_dotenv()

import os
import requests

TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID")

text = "📝 Тестовое уведомление: заявка на консультацию (локальный тест)"

if TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID:
    resp = requests.post(
        f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage",
        data={"chat_id": TELEGRAM_CHAT_ID, "text": text}
    )
    print("Ответ Telegram:", resp.text)
else:
    print("Не найден TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID")
