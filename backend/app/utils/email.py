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
    
    sender_email = settings.EMAILS_FROM_EMAIL or "noreply@therapinc.in"
    if "@gmail.com" in sender_email.lower():
        sender_email = "noreply@therapinc.in"
    
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

def send_smtp_email(to_email: str, username: str, otp_code: str) -> bool:
    """Send OTP code using Gmail SMTP directly (guarantees instant inbox delivery)."""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        return False

    sender_email = settings.EMAILS_FROM_EMAIL or settings.SMTP_USER
    smtp_password = settings.SMTP_PASSWORD.replace(" ", "")

    print(f"[EMAIL DEBUG] Sending OTP via Direct SMTP to: {to_email}", flush=True)

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
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
        server.ehlo()
        if settings.SMTP_TLS:
            server.starttls()
            server.ehlo()
        server.login(settings.SMTP_USER, smtp_password)
        server.sendmail(sender_email, to_email, message.as_string())
        server.quit()
        print(f"[EMAIL SUCCESS] Direct SMTP OTP delivered successfully to {to_email}", flush=True)
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] Direct SMTP failed ({type(e).__name__}: {e})", flush=True)
        return False


def send_otp_email(to_email: str, username: str, otp_code: str) -> bool:
    """Send OTP code to user email. Tries Direct SMTP first for instant inbox delivery, with Brevo HTTPS API as fallback."""
    # 1. Try Direct SMTP first (delivers directly from Google's servers to Gmail inbox in seconds without DMARC flags)
    if settings.SMTP_USER and settings.SMTP_PASSWORD:
        success = send_smtp_email(to_email, username, otp_code)
        if success:
            return True
        print("[EMAIL WARNING] SMTP delivery failed or port blocked, switching to Brevo HTTPS REST API fallback...", flush=True)
        
    # 2. Fallback to Brevo HTTPS REST API (useful when cloud host blocks SMTP ports)
    if settings.BREVO_API_KEY:
        print(f"[EMAIL DEBUG] Sending OTP via Brevo REST API fallback to: {to_email}", flush=True)
        return send_via_brevo_api(to_email, username, otp_code)

    print("[EMAIL WARNING] Neither SMTP nor Brevo API configured. Email not sent.", flush=True)
    return False

