import json
from fastapi import *
from dotenv import load_dotenv
import os
import httpx
from fastapi.responses import JSONResponse

load_dotenv()

PARTNER_KEY = os.getenv("PARTNER_KEY")
MERCHANT_ID = os.getenv("MERCHANT_ID")

async def process_payment(payment_request) -> dict:
    url = "https://sandbox.tappaysdk.com/tpc/payment/pay-by-prime"
    headers = {
        "Content-Type": "application/json",
        "x-api-key": PARTNER_KEY  
    }

    post_data = {
        "prime": payment_request['prime'],
        "partner_key": PARTNER_KEY, 
        "merchant_id": MERCHANT_ID,  
        "amount": payment_request['amount'],
        "currency": "TWD",
        "order_number": payment_request['order_number'],
        "details": "Taipei Day Trip Tour Order",
        "cardholder": {
            "phone_number": payment_request['phone_number'],  
            "name": payment_request['name'],
            "email": payment_request['email']
        }
    }
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=post_data)
            data = response.json()
            if data['status'] == 0:
                payment_data = {
                    "status": data['status'],
                    "msg": data['msg'],
                    "rec_trade_id": data['rec_trade_id'],
                    "bank_transaction_id": data['bank_transaction_id'],
                    "amount": data['amount'],
                    "currency": data['currency'],
                    "order_number": data['order_number']
                }
            else:
                payment_data = {
                    "status": data['status'],
                    "msg": data['msg'],
                    "rec_trade_id": None,
                    "bank_transaction_id": None,
                    "amount": None,
                    "currency": None,
                    "order_number": None
                }
            return payment_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))