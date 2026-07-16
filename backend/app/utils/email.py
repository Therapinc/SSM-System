import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

def send_otp_email(to_email: str, username: str, otp_code: str) -> bool:
    """Send OTP code to the user's email address using SMTP."""
    # Check if SMTP configuration is provided
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print("[EMAIL WARNING] SMTP credentials not set. Could not send email.")
        return False

    sender_email = settings.EMAILS_FROM_EMAIL or settings.SMTP_USER
    # Strip spaces from app password (Google App Passwords sometimes have spaces)
    smtp_password = settings.SMTP_PASSWORD.replace(" ", "")

    print(f"[EMAIL DEBUG] Sending OTP to: {to_email}")
    print(f"[EMAIL DEBUG] SMTP Host: {settings.SMTP_HOST}:{settings.SMTP_PORT}")
    print(f"[EMAIL DEBUG] SMTP User: {settings.SMTP_USER}")

    # Create email headers and content
    message = MIMEMultipart("alternative")
    message["Subject"] = "Special School System - Password Reset Code"
    message["From"] = f"{settings.PROJECT_NAME} <{sender_email}>"
    message["To"] = to_email

    text_content = f"Hello {username},\n\nYour 6-digit verification code to reset your password is: {otp_code}\n\nThis code will expire in 5 minutes.\n\nIf you did not request this, please ignore this email."

    html_content = f"""
    <html>
      <body>
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0d6cd; border-radius: 12px; background: #faf8f5;">
          <h2 style="color: #B3541E; text-align: center;">Reset Your Password</h2>
          <p>Hello <strong>{username}</strong>,</p>
          <p>You requested to reset your password. Use the verification code below to proceed:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #170F49; background: #f4f1ee; padding: 10px 24px; border-radius: 8px; border: 1px solid #B6A89B; display: inline-block;">
              {otp_code}
            </span>
          </div>
          <p style="color: #666; font-size: 12px; text-align: center; margin-top: 40px;">
            This code is valid for 5 minutes. If you did not make this request, please ignore this message.
          </p>
        </div>
      </body>
    </html>
    """

    message.attach(MIMEText(text_content, "plain"))
    message.attach(MIMEText(html_content, "html"))

    try:
        # Establish connection with 15s timeout to avoid hanging on blocked ports
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15)
        server.ehlo()
        if settings.SMTP_TLS:
            server.starttls()
            server.ehlo()
        server.login(settings.SMTP_USER, smtp_password)
        server.sendmail(sender_email, to_email, message.as_string())
        server.quit()
        print(f"[EMAIL SUCCESS] OTP sent successfully to {to_email}")
        return True
    except smtplib.SMTPAuthenticationError as e:
        print(f"[EMAIL ERROR] Authentication failed — check SMTP_USER and SMTP_PASSWORD in .env: {e}")
        return False
    except smtplib.SMTPConnectError as e:
        print(f"[EMAIL ERROR] Could not connect to SMTP server {settings.SMTP_HOST}:{settings.SMTP_PORT}: {e}")
        return False
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send email to {to_email}: {type(e).__name__}: {e}")
        return False

