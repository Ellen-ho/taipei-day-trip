from sqlite3 import Date
from pydantic import BaseModel, Field, HttpUrl, EmailStr, field_validator
from typing import List, Optional
from datetime import date

class BaseResponse(BaseModel):
    ok: bool

class SignupResponse(BaseResponse):
    pass

class BookingResponse(BaseResponse):
    pass

class DeleteResponse(BaseResponse):
    pass

class User(BaseModel):
    id: int
    name: str
    email: EmailStr

class UserResponse(BaseModel):
    data: Optional[User] = None


class ErrorResponse(BaseModel):
    error: bool
    message: str

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

class Booking(BaseModel):
    attraction_id: int = Field(..., alias='attractionId')
    date: date
    time: str 
    price: int

class AttractionBooking(BaseModel):
    id: int
    name: str
    address: Optional[str]
    image: Optional[HttpUrl]

class Trip(BaseModel):
    booking_id: int
    

class Contact(BaseModel):
    name: str
    email: EmailStr
    phone: str 

class OrderInput(BaseModel):
    total_price: int = Field(..., alias="totalPrice")
    trip: List[Trip]
    contact: Contact

class OrderData(BaseModel):
    prime: str
    order: OrderInput 

