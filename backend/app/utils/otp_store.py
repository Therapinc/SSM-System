import random
from datetime import datetime, timedelta
from typing import Dict

# OTP store: {email_or_username: {"code": "123456", "expires_at": datetime}}
OTP_CODES: Dict[str, Dict] = {}

def generate_otp(key: str) -> str:
    """Generate a 6-digit OTP code valid for 5 minutes."""
    normalized_key = key.strip().lower()
    code = f"{random.randint(100000, 999999)}"
    expires_at = datetime.utcnow() + timedelta(minutes=5)
    OTP_CODES[normalized_key] = {
        "code": code,
        "expires_at": expires_at
    }
    return code

def verify_otp(key: str, code: str) -> bool:
    """Verify that the OTP code matches and is not expired."""
    normalized_key = key.strip().lower()
    if normalized_key not in OTP_CODES:
        return False
    
    stored = OTP_CODES[normalized_key]
    if stored["code"] != code.strip():
        return False
        
    if datetime.utcnow() > stored["expires_at"]:
        # Expired - clean it up
        del OTP_CODES[normalized_key]
        return False
        
    # Valid - remove it so it cannot be used twice
    del OTP_CODES[normalized_key]
    return True
