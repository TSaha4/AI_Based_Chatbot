import logging
import smtplib
from email.message import EmailMessage

from app.config.settings import Settings

logger = logging.getLogger(__name__)


class EmailService:
    """Sends admin resolutions to users when SMTP is configured."""

    def __init__(self, settings: Settings):
        self.settings = settings

    def send_resolution(self, to_email: str | None, question: str, answer: str, ticket_id: str) -> bool:
        if not to_email or not self.settings.smtp_host or not self.settings.smtp_from_email:
            logger.warning("SMTP not configured or recipient missing; resolution email skipped")
            return False

        message = EmailMessage()
        message["Subject"] = f"Support ticket resolved: {ticket_id}"
        message["From"] = self.settings.smtp_from_email
        message["To"] = to_email
        message.set_content(
            f"Your support ticket has been resolved.\n\n"
            f"Ticket: {ticket_id}\n\n"
            f"Question:\n{question}\n\n"
            f"Answer:\n{answer}\n"
        )

        # Temporarily disabled for testing — re-enable smtp.send_message when going live.
        logger.info("Email send disabled for testing; would notify %s for ticket %s", to_email, ticket_id)
        # with smtplib.SMTP(self.settings.smtp_host, self.settings.smtp_port, timeout=15) as smtp:
        #     if self.settings.smtp_use_tls:
        #         smtp.starttls()
        #     if self.settings.smtp_username:
        #         smtp.login(self.settings.smtp_username, self.settings.smtp_password)
        #     smtp.send_message(message)
        return False
