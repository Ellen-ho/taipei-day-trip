from pydantic import BaseModel, HttpUrl, EmailStr 
from typing import List, Optional

class User(BaseModel):
    id: int
    name: str
    email: EmailStr

class UserResponse(BaseModel):
    data: Optional[User] = None


class ErrorResponse(BaseModel):
    error: bool
    message: str

class SignupResponse(BaseModel):
    ok: bool

class SignupData(BaseModel):
    name: str
    email: EmailStr  
    password: str

class SigninData(BaseModel):
    email: EmailStr  
    password: str

class TokenResponse(BaseModel):
    token: str

class Attraction(BaseModel):
    id: int
    name: str
    category: Optional[str]
    description: Optional[str]
    address: Optional[str]
    transport: Optional[str]
    mrt: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    images: List[HttpUrl]

class AttractionResponse(BaseModel):
    data: Attraction

class ResponseData(BaseModel):
    nextPage: Optional[int]
    data: List[Attraction]

class MRTListResponse(BaseModel):
    data: List[str]