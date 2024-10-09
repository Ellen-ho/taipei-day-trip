from cmath import e
from fastapi import *
from fastapi.responses import FileResponse, JSONResponse
from typing import Optional
import os
from dotenv import load_dotenv
from models import (
    ResponseData, ErrorResponse, SignupResponse, UserResponse, DeleteResponse,AttractionResponse, MRTListResponse, TokenResponse,
    SignupData, SigninData, BookingResponse, Booking, OrderData
)
from db_operations import get_attractions, get_attraction_by_id, get_mrts, create_booking_to_db, get_booking_details, delete_booking, check_existing_booking, create_order_record, update_order_status, create_payment_record, get_order_by_number, get_attractions_en
from fastapi.staticfiles import StaticFiles
from auth import create_access_token, check_existing_user, authenticate_user, create_user, get_current_user, validate_token
from database import get_db_connection
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from payment import process_payment

app=FastAPI()

load_dotenv()

app.mount("/static", StaticFiles(directory="static"), name="static")

bearer_scheme = HTTPBearer()

def handle_error(e):
    if isinstance(e, HTTPException):
        return JSONResponse(status_code=e.status_code, content={"error": True, "message": str(e)})
    else:
        return JSONResponse(status_code=500, content={"error": True, "message": str(e)})
	
async def get_language_preference(request: Request):
    accept_language = request.headers.get('accept-language')
    if accept_language and 'zh' in accept_language:
        return 'zh'
    else:
        return 'en'

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

@app.get("/api/attractions_en", response_model=ResponseData)
async def search_attractions_en(page: int = Query(0, ge=0), keyword: Optional[str] = None):
	limit = 12
	conn = None 
	try:
		conn = get_db_connection()
		result = get_attractions_en(conn, keyword, page, limit)  
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

@app.get("/api/attraction_en/{attractionId}", response_model=AttractionResponse)
async def search_single_attraction_en(attractionId: int = Path(...)):
    conn = None
    try:
        conn = get_db_connection()
        attraction = get_attraction_by_id(conn, attractionId, table='attractions_en') 
        if not attraction:
            return JSONResponse(status_code=400, content={"error": True, "message": "景點id不正確"})
        return {"data": attraction}
    except Exception as e:
        return handle_error(e)
    finally:
        if conn:
            conn.close()

@app.get("/api/mrts", response_model=MRTListResponse)
async def get_mrt_list(request: Request):
	conn = None
	try:
		accept_language = request.headers.get('accept-language', 'zh')
		table = 'attractions_en' if 'en' in accept_language else 'attractions'
		conn = get_db_connection()
		mrts = get_mrts(conn, table)
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
        if check_existing_booking(conn, user_id, booking):
            return JSONResponse(status_code=409, content={"error": True, "message": "日期跟時段重複預約"})

        attraction_id = booking.attraction_id if booking.attraction_id else None
        attraction_en_id = booking.attraction_en_id if booking.attraction_en_id else None

        if not attraction_id and not attraction_en_id:
            return JSONResponse(status_code=400, content={"error": True, "message": "Either attraction_id or attraction_en_id must be provided."})

        booking_id = create_booking_to_db(conn, booking, user_id, attraction_id, attraction_en_id)
        if not booking_id:
            return JSONResponse(status_code=400, content={"error": True, "message": "建立失敗，輸入不正確或其他原因"})

        return {"ok": True}
    except Exception as e:
        return handle_error(e)
    finally:
        if conn:
            conn.close()

@app.get("/api/booking", response_model=Optional[dict], responses={
	403: {"model": ErrorResponse, "description": "未登入系統，拒絕存取"}
})
async def get_booking(request: Request,credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
	conn = None
	try:
		payload = validate_token(credentials.credentials)
		user_id = payload.get('sub')
		conn = get_db_connection()

		accept_language = request.headers.get('accept-language', 'zh')
		table = 'attractions_en' if 'en' in accept_language else 'attractions'

		result = get_booking_details(conn, user_id, table)
		print(result)
		if result is None:
			return None 
		return result
	except Exception as e:
		return handle_error(e)
	finally:
		if conn:
			conn.close()

@app.delete("/api/booking/{bookingId}", response_model=DeleteResponse, responses={
	403: {"model": ErrorResponse, "description": "未登入系統，拒絕存取"}
})
async def cancel_booking(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),bookingId:int = Path(...)):
	conn = None
	try:
		payload = validate_token(credentials.credentials)
		user_id = payload.get('sub')
	except HTTPException as e:
		return JSONResponse(status_code=e.status_code, content={"error": True, "message": e.detail})
	try:
		conn = get_db_connection()
		affected_rows = delete_booking(conn, user_id, bookingId)
		if affected_rows == 0:
			return JSONResponse(status_code=404, content={"error": True, "message": "找不到預訂，刪除失敗"})
		return {"ok": True}
	except Exception as e:
		return handle_error(e)
	finally:
		if conn:
			conn.close()

@app.post("/api/orders", response_model= dict, responses={
    400: {"model": ErrorResponse, "description": "訂單建立失敗，輸入不正確或其他原因"},
	403: {"model": ErrorResponse, "description": "未登入系統，拒絕存取"},
    500: {"model": ErrorResponse, "description": "伺服器內部錯誤"}
})
async def create_order(order_data: OrderData, credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
	conn = None
	try:
		payload = validate_token(credentials.credentials)
		user_id = payload.get('sub')
	except HTTPException as e:
		return JSONResponse(status_code=e.status_code, content={"error": True, "message": e.detail})
	try:
		conn = get_db_connection()
		order_id, order_number = create_order_record(conn, user_id, order_data)
		if not order_id:
			return JSONResponse(status_code=400, content={"error": True, "message": "訂單建立失敗，輸入不正確或其他原因"})
		payment_request = {
            "prime": order_data.prime,
            "amount": order_data.order.total_price,
            "order_number": order_number,
            "phone_number": order_data.order.contact.phone,
            "name": order_data.order.contact.name,
            "email": order_data.order.contact.email
        }
		payment_data = await process_payment(payment_request)
		create_payment_record(conn, payment_data, order_id)
		if payment_data.get("status") == 0:
			update_order_status(conn, order_id, 'PAID')
		return {
			"data": {
				"number": order_number,
				"payment": {
					"status": payment_data.get("status"),
                    "message": payment_data.get("message")
				}
			}
		}
	except Exception as e:
		return handle_error(e)
	finally:
		if conn:
			conn.close()

@app.get("/api/order/{orderNumber}", response_model=Optional[dict], responses={
	403: {"model": ErrorResponse, "description": "未登入系統，拒絕存取"},
    500: {"model": ErrorResponse, "description": "伺服器內部錯誤"}
})
async def get_order(request: Request,orderNumber: str = Path(...), credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
	order_number = orderNumber
	conn = None
	try:
		payload = validate_token(credentials.credentials)
		user_id = payload.get('sub')
	except HTTPException as e:
		return JSONResponse(status_code=e.status_code, content={"error": True, "message": e.detail})
	try:
		conn = get_db_connection()
		accept_language = request.headers.get('accept-language', 'zh')
		if not order_number:
			raise HTTPException(status_code=400, detail="Order number is required.")
		result = get_order_by_number(conn, order_number, user_id, accept_language)
		if result is None:
			return None 
		return result
	except Exception as e:
		return handle_error(e)
	finally:
		if conn:
			conn.close()

@app.put("/api/order/{orderNumber}", response_model= dict, responses={
    400: {"model": ErrorResponse, "description": "訂單更新失敗，輸入不正確或其他原因"},
	403: {"model": ErrorResponse, "description": "未登入系統，拒絕存取"},
    500: {"model": ErrorResponse, "description": "伺服器內部錯誤"}
})
async def update_order(request: Request, orderNumber: str = Path(...), credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
	order_number = orderNumber
	conn = None
	try:
		payload = validate_token(credentials.credentials)
		user_id = payload.get('sub')
		request_data = await request.json() 
		prime = request_data.get("prime") 
	except HTTPException as e:
		return JSONResponse(status_code=e.status_code, content={"error": True, "message": e.detail})
	try:
		conn = get_db_connection()
		accept_language = request.headers.get('accept-language', 'zh')
		order_data = get_order_by_number(conn, order_number, user_id, accept_language)
		payment_request = {
			"prime": prime, 
			"amount": order_data['data']['totalPrice'], 
			"order_number": order_data['data']['number'],  
			"phone_number": order_data['data']['contact']['phone'], 
			"name": order_data['data']['contact']['name'],  
			"email": order_data['data']['contact']['email']  
		}
		payment_data = await process_payment(payment_request)
		create_payment_record(conn, payment_data, order_data['data']['id'])
		if payment_data.get("status") == 0:
			update_order_status(conn, order_data['data']['id'], 'PAID')
		return {
			"data": {
				"number": order_number,
				"payment": {
					"status": payment_data.get("status"),
                    "message": payment_data.get("message")
				}
			}
		}
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
@app.get("/search", include_in_schema=False)
async def booking(request: Request):
	return FileResponse("./static/search.html", media_type="text/html")
@app.get("/thankyou", include_in_schema=False)
async def thankyou(request: Request):
	return FileResponse("./static/thankyou.html", media_type="text/html")

@app.get("/health", include_in_schema=False)
async def health_check():
    return JSONResponse(status_code=200, content="Application is running")