from pydantic import BaseModel, HttpUrl
from typing import List, Optional

class Attraction(BaseModel):
    id: int
    name: str
    category: str
    description: str
    address: str
    transport: str
    mrt: str
    latitude: float
    longitude: float
    images: List[HttpUrl]

class ResponseData(BaseModel):
    nextPage: Optional[int]
    data: List[Attraction]