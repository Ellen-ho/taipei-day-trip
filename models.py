from pydantic import BaseModel, HttpUrl
from typing import List, Optional

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

class ResponseData(BaseModel):
    nextPage: Optional[int]
    data: List[Attraction]