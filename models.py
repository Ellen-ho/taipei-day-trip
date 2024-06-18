from pydantic import BaseModel, HttpUrl, EmailStr 
from typing import List, Optional

# class User(BaseModel):
#     id: int = Field(..., description="Primary key, uniquely identifying the user")
#     username: str
#     email: str = Field(..., description="Unique email address")
#     hashed_password: str

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