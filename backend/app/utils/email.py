import os
import urllib.request
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

def send_via_brevo_api(to_email: str, username: str, otp_code: str) -> bool:
    """Send OTP code using Brevo's HTTPS REST API (bypassing blocked SMTP ports)."""
    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "api-key": settings.BREVO_API_KEY,
        "content-type": "application/json"
    }
    
    sender_email = settings.EMAILS_FROM_EMAIL or settings.SMTP_USER or "noreply@therapinc.com"
    
    payload = {
        "sender": {"name": settings.PROJECT_NAME, "email": sender_email},
        "to": [{"email": to_email, "name": username}],
        "subject": "Special School System - Password Reset Code",
        "htmlContent": f"""
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
        """,
        "textContent": f"Hello {username},\n\nYour 6-digit verification code to reset your password is: {otp_code}\n\nThis code will expire in 5 minutes.\n\nIf you did not request this, please ignore this email."
    }
    
    try:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=10) as response:
            res_body = response.read().decode("utf-8")
            print(f"[BREVO API SUCCESS] OTP sent successfully to {to_email}. Response: {res_body}", flush=True)
            return True
    except Exception as e:
        print(f"[BREVO API ERROR] Failed to send email via Brevo REST API: {e}", flush=True)
        return False

def send_otp_email(to_email: str, username: str, otp_code: str) -> bool:
    """Send OTP code to the user's email address using either Brevo HTTPS API or SMTP."""
    is_running_on_render = os.environ.get("RENDER") == "true"
    
    # 1. On Render, prioritize Brevo HTTPS REST API to bypass port blocks
    if is_running_on_render and settings.BREVO_API_KEY:
        print(f"[EMAIL DEBUG] Running on Render. Sending OTP via Brevo REST API to: {to_email}", flush=True)
        return send_via_brevo_api(to_email, username, otp_code)
        
    # 2. On Localhost, always use Gmail SMTP (since ports are not blocked locally)
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print("[EMAIL WARNING] SMTP credentials not set. Could not send email.", flush=True)
        # Fallback to Brevo if SMTP is not configured even locally
        if settings.BREVO_API_KEY:
            return send_via_brevo_api(to_email, username, otp_code)
        return False

    sender_email = settings.EMAILS_FROM_EMAIL or settings.SMTP_USER
    smtp_password = settings.SMTP_PASSWORD.replace(" ", "")

    print(f"[EMAIL DEBUG] Running locally. Sending OTP via SMTP to: {to_email}", flush=True)
    print(f"[EMAIL DEBUG] SMTP Host: {settings.SMTP_HOST}:{settings.SMTP_PORT}", flush=True)
    print(f"[EMAIL DEBUG] SMTP User: {settings.SMTP_USER}", flush=True)

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
        print(f"[EMAIL ERROR] Authentication failed — check SMTP_USER and SMTP_PASSWORD: {e}")
        return False
    except smtplib.SMTPConnectError as e:
        print(f"[EMAIL ERROR] Could not connect to SMTP server: {e}")
        return False
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send email via SMTP: {type(e).__name__}: {e}")
        return False

