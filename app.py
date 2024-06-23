from cmath import e
from fastapi import *
from fastapi.responses import FileResponse, JSONResponse
from typing import Optional
import os
from dotenv import load_dotenv
from models import (
    ResponseData, ErrorResponse, SignupResponse, UserResponse, DeleteResponse,AttractionResponse, MRTListResponse, TokenResponse,
    SignupData, SigninData, Booking, BookingResponse, BookingData
)
from db_operations import get_attractions, get_attraction_by_id, get_mrts, create_booking_to_db, get_booking_details, delete_booking
from fastapi.staticfiles import StaticFiles
from auth import create_access_token, check_existing_user, authenticate_user, create_user, get_current_user, validate_token
from database import get_db_connection
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

app=FastAPI()

load_dotenv()

app.mount("/static", StaticFiles(directory="static"), name="static")

bearer_scheme = HTTPBearer()

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
async def get_signin_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
	conn = None  
	try:
		conn = get_db_connection()
		token = credentials.credentials
		user = get_current_user(token)
		if not user:
			return UserResponse()
		return UserResponse(data=user)
	# except HTTPException as e:
	# 	return JSONResponse(status_code=e.status_code, content={"error": True, "message": e.detail})
	except Exception as e:
		return JSONResponse(status_code=500, content={"error": True, "message": str(e)})
	finally:
		if conn:  
			conn.close()
    
@app.get("/api/attractions", response_model=ResponseData)
async def search_attractions(page: int = Query(0, ge=0), keyword: Optional[str] = None):
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
async def search_single_attraction(attractionId: int = Path(...)):
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
async def get_mrt_list():
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

@app.post("/api/booking", response_model=BookingResponse, responses={
    400: {"model": ErrorResponse, "description": "建立失敗，輸入不正確或其他原因"},
	403: {"model": ErrorResponse, "description": "未登入系統，拒絕存取"},
    500: {"model": ErrorResponse, "description": "伺服器內部錯誤"}
})
async def create_booking(booking: Booking, credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
	conn = None
	try:
		payload = validate_token(credentials.credentials)
		user_id = payload.get('sub')
	except HTTPException as e:
		return JSONResponse(status_code=e.status_code, content={"error": True, "message": e.detail})
	
	try:
		conn = get_db_connection()
		booking_id = create_booking_to_db(conn, booking, user_id)
		if not booking_id:
			return JSONResponse(status_code=400, content={"error": True, "message": "建立失敗，輸入不正確或其他原因"})
		return {"ok": True}
	except Exception as e:
		return handle_error(e)
	finally:
		if conn:
			conn.close()

@app.get("/api/booking", response_model= BookingData, responses={
	403: {"model": ErrorResponse, "description": "未登入系統，拒絕存取"}
})
async def get_booking(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
	conn = None
	try:
		payload = validate_token(credentials.credentials)
		user_id = payload.get('sub')
		conn = get_db_connection()
		booking_info = get_booking_details(conn, user_id)
		if booking_info is None:
			return JSONResponse(status_code=404, content={"error": True, "message": "找不到預訂，無法取得"})
		return BookingData(**booking_info)
	except Exception as e:
		return handle_error(e)
	finally:
		if conn:
			conn.close()

@app.delete("/api/booking", response_model=DeleteResponse, responses={
	403: {"model": ErrorResponse, "description": "未登入系統，拒絕存取"}
})
async def cancel_booking(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
	conn = None
	try:
		payload = validate_token(credentials.credentials)
		user_id = payload.get('sub')
	except HTTPException as e:
		return JSONResponse(status_code=e.status_code, content={"error": True, "message": e.detail})
	try:
		conn = get_db_connection()
		affected_rows = delete_booking(conn, user_id)
		if affected_rows == 0:
			return JSONResponse(status_code=404, content={"error": True, "message": "找不到預訂，刪除失敗"})
		return {"ok": True}
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