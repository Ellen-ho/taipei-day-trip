from fastapi import *
from datetime import datetime, timedelta, timezone
from typing import Optional
from dotenv import load_dotenv
import os
import jwt
from fastapi.security import HTTPBearer
from passlib.context import CryptContext
from jwt import PyJWTError, ExpiredSignatureError


load_dotenv()

SECRET_KEY = os.getenv('SECRET_KEY')
ALGORITHM = "HS256" 

bearer_scheme = HTTPBearer()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def validate_token(token: str):
    if not token:
        raise HTTPException(status_code=403, detail="未登入系统，拒絕訪問")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token 已經過期")
    except PyJWTError:
        raise HTTPException(status_code=403, detail="未登入系统，拒絕訪問")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"伺服器內部錯誤: {str(e)}")

def check_existing_user(conn, email: str):
    with conn.cursor(dictionary=True) as cursor:
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        return bool(cursor.fetchone())
    

def create_user(conn, name: str, email: str, password: str):
    cursor = conn.cursor(dictionary=True)
    try:
        hashed_password = get_password_hash(password)
        cursor.execute("INSERT INTO users (name, email, password) VALUES (%s, %s, %s)", (name, email, hashed_password))
        conn.commit()
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        new_user = cursor.fetchone()
        return new_user['id'] if new_user else None
    except Exception as e:
        conn.rollback()
        raise
    finally:
        cursor.close()

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def authenticate_user(conn, email: str, password: str):
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
    user = cursor.fetchone()
    cursor.close()
    if user and verify_password(password, user['password']):
        return user
    return None

def create_access_token(user_data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = user_data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=7)
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str):
    payload = validate_token(token)  
    if not payload:
        return None
    
    user_id = payload.get("sub")  
    user_name = payload.get("name") 
    user_email = payload.get("email")  
    if not user_id or not user_name or not user_email:
        return None
    user_info = {
        "id": user_id,
        "name": user_name,
        "email": user_email
    }
    return user_info

    
