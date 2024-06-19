from fastapi import *
from datetime import datetime, timedelta
from typing import Optional
from dotenv import load_dotenv
import os
import jwt
from fastapi.security import OAuth2PasswordBearer, HTTPBearer
from passlib.context import CryptContext
from jwt import decode, ExpiredSignatureError, InvalidTokenError


load_dotenv()

SECRET_KEY = os.getenv('SECRET_KEY')
ALGORITHM = "HS256" 

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
bearer_scheme = HTTPBearer()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def check_existing_user(conn, email: str):
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
    if cursor.fetchone():
        return True
    return False

    cursor.close()
    

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
    expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire})
    try:
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    except Exception as e:
        raise ValueError("Failed to create access token") from e

def get_current_user(conn, token: str):
    if not token:
        return None 
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    user_id = payload.get("sub")
    if user_id is None:
        return None
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id, name, email FROM users WHERE id = %s", (user_id,))
    user = cursor.fetchone()
    cursor.close()
    if not user:
        return None
    return user
    
