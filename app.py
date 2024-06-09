from fastapi import *
from fastapi.responses import FileResponse
from mysql.connector import pooling
from typing import Optional
import os
from dotenv import load_dotenv
from models import ResponseData, Attraction, AttractionResponse, MRTListResponse
from db_operations import get_attractions, get_attraction_by_id, get_mrts
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

app=FastAPI()

load_dotenv()

app.mount("/static", StaticFiles(directory="static"), name="static")

db_config = {
    'host': os.getenv('DB_HOST'),
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    'database': os.getenv('DB_NAME')
}

db_pool = pooling.MySQLConnectionPool(pool_name="mypool", pool_size=10, **db_config)

def get_db_connection():
    try:
        return db_pool.get_connection()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")

@app.get("/api/attractions", response_model=ResponseData)
def search_attractions(page: int = Query(0, ge=0), keyword: Optional[str] = None):
	limit = 12
	try:
		conn = get_db_connection()
		try:
			result = get_attractions(conn, keyword, page, limit)
			return result
		except Exception as e:
			return JSONResponse(status_code=500, content={"error": True, "message": str(e)})
		finally:
			if conn:
				conn.close()
	except Exception as e:
		return JSONResponse(status_code=500, content={"error": True, "message": str(e)})

@app.get("/api/attraction/{attractionId}", response_model=AttractionResponse)
def search_single_attraction(attractionId: int = Path(...)):
	try:
		conn = get_db_connection()
		try:
			attraction = get_attraction_by_id(conn, attractionId)
			if not attraction:
				return JSONResponse(status_code=400, content={"error": True, "message": "景點id不正確"})
			return {"data": attraction}
		except Exception as e:
			return JSONResponse(status_code=500, content={"error": True, "message": str(e)})
		finally:
			if conn:
				conn.close()
	except Exception as e:
		return JSONResponse(status_code=500, content={"error": True, "message": str(e)})

@app.get("/api/mrts", response_model=MRTListResponse)
def get_mrt_list():
    try:
        conn = get_db_connection()
        try:
            mrts = get_mrts(conn)
            return {"data": mrts}
        except Exception as e:
            return JSONResponse(status_code=500, content={"error": True, "message": str(e)})
        finally:
            if conn:
                conn.close()
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": True, "message": str(e)})

# Static Pages (Never Modify Code in this Block)
@app.get("/", include_in_schema=False)
async def index(request: Request):
	return FileResponse("./static/index.html", media_type="text/html")
@app.get("/attraction/{id}", include_in_schema=False)
async def attraction(request: Request, id: int):
	return FileResponse("./static/attraction.html", media_type="text/html")
@app.get("/booking", include_in_schema=False)
async def booking(request: Request):
	return FileResponse("./static/booking.html", media_type="text/html")
@app.get("/thankyou", include_in_schema=False)
async def thankyou(request: Request):
	return FileResponse("./static/thankyou.html", media_type="text/html")