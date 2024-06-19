from fastapi import *
from fastapi.responses import FileResponse
from typing import Optional
import os
from dotenv import load_dotenv
from models import ResponseData, ErrorResponse, SignupResponse, UserResponse, Attraction, AttractionResponse, MRTListResponse, TokenResponse, SignupData, SigninData
from db_operations import get_attractions, get_attraction_by_id, get_mrts
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from auth import create_access_token, check_existing_user, authenticate_user, create_user, get_current_user
from database import get_db_connection

app=FastAPI()

load_dotenv()

app.mount("/static", StaticFiles(directory="static"), name="static")

def handle_error(e):
    if isinstance(e, HTTPException):
        return JSONResponse(status_code=e.status_code, content={"error": True, "message": str(e)})
    else:
        return JSONResponse(status_code=500, content={"error": True, "message": str(e)})

@app.post("/api/user", response_model=SignupResponse, responses={
    400: {"model": ErrorResponse, "description": "註冊失敗，重複的 Email 或其他原因"},
    500: {"model": ErrorResponse, "description": "伺服器內部錯誤"}
})
async def signup(form_data: SignupData):
	conn = None
	try:
		conn = get_db_connection()
		if check_existing_user(conn, form_data.email):
			return JSONResponse(status_code=400, content={"error": True, "message": "Email 已經註冊帳戶"})
		user_id = create_user(conn, form_data.name, form_data.email, form_data.password)
		if not user_id:
			return JSONResponse(status_code=500, content={"error": True, "message":"註冊失敗"})
		return {"ok": True}
	except Exception as e:
		return handle_error(e)
	finally:
		if conn:
			conn.close()

@app.put("/api/user/auth", response_model=TokenResponse, responses={
    400: {"model": ErrorResponse, "description": "登入失敗，帳號或密碼錯誤或其他原因"},
    500: {"model": ErrorResponse, "description": "伺服器內部錯誤"}
})
async def signin(form_data: SigninData):
	conn = None  
	try:
		conn = get_db_connection()
		user = authenticate_user(conn, form_data.email, form_data.password)
		if not user:
			return JSONResponse(status_code=400, content={"error": True, "message": "電子郵件或密碼錯誤"})
		access_token = create_access_token({
			"sub": str(user['id']), 
			"name": user['name'],    
			"email": user['email']   
		})
		if not access_token:
			return JSONResponse(status_code=500, content={"error": True, "message": "Failed to create access token"})
		return {"token": access_token}
	except Exception as e:
		return handle_error(e)
	finally:
		if conn:  
			conn.close()
		
@app.get("/api/user/auth", response_model=UserResponse)
async def get_signin_user():
	conn = None  
	try:
		conn = get_db_connection()
		user = get_current_user()
		if not user:
			return UserResponse()
		return UserResponse(data=user)
	except Exception as e:
		return handle_error(e)
	finally:
		if conn:  
			conn.close()
    
@app.get("/api/attractions", response_model=ResponseData)
def search_attractions(page: int = Query(0, ge=0), keyword: Optional[str] = None):
	limit = 12
	conn = None 
	try:
		conn = get_db_connection()
		result = get_attractions(conn, keyword, page, limit)
		return result
	except Exception as e:
		return handle_error(e)
	finally:
		if conn:
			conn.close()

@app.get("/api/attraction/{attractionId}", response_model=AttractionResponse)
def search_single_attraction(attractionId: int = Path(...)):
	conn = None 
	try:
		conn = get_db_connection()
		attraction = get_attraction_by_id(conn, attractionId)
		if not attraction:
			return JSONResponse(status_code=400, content={"error": True, "message": "景點id不正確"})
		return {"data": attraction}
	except Exception as e:
		return handle_error(e)
	finally:
		if conn:
			conn.close()

@app.get("/api/mrts", response_model=MRTListResponse)
def get_mrt_list():
	conn = None
	try:
		conn = get_db_connection()
		mrts = get_mrts(conn)
		return {"data": mrts}
	except Exception as e:
		return handle_error(e)
	finally:
		if conn:
			conn.close()

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