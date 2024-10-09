from datetime import time
import json
from nanoid import generate

def clean_string(s):
    return s.replace(' ', '')

def generate_order_number():
    return generate(size=10)

def get_attractions(conn, keyword, page, limit=12):
    extra_item = 1  
    offset = page * limit
    fetch_limit = limit + extra_item 

    cursor = conn.cursor(dictionary=True)
    sql_query = """
        SELECT 
            id, name, category, description, address, transport, mrt, 
            latitude, longitude, images 
        FROM attractions
        WHERE (%s IS NULL OR name LIKE %s OR mrt = %s)
        LIMIT %s, %s
    """
    keyword_like = f'%{keyword}%' if keyword else None
    cursor.execute(sql_query, (keyword, keyword_like, keyword, offset, fetch_limit))
    results = cursor.fetchall()
    cursor.close()

    for result in results:
        for key in result:
            if isinstance(result[key], str):
                result[key] = clean_string(result[key])
        if result['images']:
            result['images'] = json.loads(result['images'])
        else:
            result['images'] = []

    has_next_page = len(results) > limit
    if has_next_page:
        results = results[:-1] 

    next_page = page + 1 if has_next_page else None

    return {
        "nextPage": next_page,
        "data": results
    }

def get_attractions_en(conn, keyword, page, limit=12):
    extra_item = 1  
    offset = page * limit
    fetch_limit = limit + extra_item 

    cursor = conn.cursor(dictionary=True)
    sql_query = """
        SELECT 
            id, name, category, description, address, transport, mrt, 
            latitude, longitude, images 
        FROM attractions_en
        WHERE (%s IS NULL OR name LIKE %s OR mrt = %s)
        LIMIT %s, %s
    """
    keyword_like = f'%{keyword}%' if keyword else None
    cursor.execute(sql_query, (keyword, keyword_like, keyword, offset, fetch_limit))
    results = cursor.fetchall()
    cursor.close()

    for result in results:
        if result['images']:
            result['images'] = json.loads(result['images']) 
        else:
            result['images'] = []

    has_next_page = len(results) > limit
    if has_next_page:
        results = results[:-1] 

    next_page = page + 1 if has_next_page else None

    return {
        "nextPage": next_page,
        "data": results
    }

def get_attraction_by_id(conn, attraction_id, table='attractions'):
    cursor = conn.cursor(dictionary=True)
    sql_query = f"""
        SELECT 
            id, name, category, description, address, transport, mrt, 
            latitude, longitude, images 
        FROM {table}
        WHERE id = %s
    """
    cursor.execute(sql_query, (attraction_id,))
    result = cursor.fetchone()

    if result:
        if table == 'attractions':
            for key in result:
                if isinstance(result[key], str):
                    result[key] = clean_string(result[key])  

        if result['images']:
            result['images'] = json.loads(result['images'])
        else:
            result['images'] = []

    cursor.close()
    return result

def get_mrts(conn, table):
    cursor = conn.cursor(dictionary=True)
    sql_query = f"""
        SELECT mrt, COUNT(*) as attraction_count
        FROM {table}
        WHERE mrt IS NOT NULL
        GROUP BY mrt
        ORDER BY attraction_count DESC
    """
    cursor.execute(sql_query)
    results = cursor.fetchall()
    print(results)
    cursor.close()
    return [result['mrt'] for result in results]

def check_existing_booking(conn, user_id, booking):
     cursor = conn.cursor(dictionary=True)
     sql_query = """
        SELECT id FROM bookings
        WHERE user_id = %s AND date = %s AND time = %s AND is_deleted = 0 AND order_id IS NULL
    """
     cursor.execute(sql_query, (user_id, booking.date, booking.time))
     existing_booking = cursor.fetchone()
     cursor.close()
     if existing_booking:
            return existing_booking['id']  
     else:
        return None 

def create_booking_to_db(conn, booking, user_id, attraction_id=None, attraction_en_id=None):
    cursor = conn.cursor(dictionary=True)
    
    if attraction_id:
        sql_query = """
        INSERT INTO bookings (user_id, attraction_id, date, time, price, is_deleted)
        VALUES (%s, %s, %s, %s, %s, %s)
        """
        values = (user_id, attraction_id, booking.date, booking.time, booking.price, 0)
    elif attraction_en_id:
        sql_query = """
        INSERT INTO bookings (user_id, attraction_en_id, date, time, price, is_deleted)
        VALUES (%s, %s, %s, %s, %s, %s)
        """
        values = (user_id, attraction_en_id, booking.date, booking.time, booking.price, 0)
    else:
        raise ValueError("Either attraction_id or attraction_en_id must be provided.")
    
    try:
        cursor.execute(sql_query, values)
        conn.commit()  
        return cursor.lastrowid  
    except Exception as e:
        conn.rollback()  
        raise
    finally:
        cursor.close()

def get_booking_details(conn, user_id, table):
    with conn.cursor(dictionary=True) as cursor:
        booking_query = """
            SELECT 
                b.id, b.date, b.time, b.price, 
                b.attraction_id, b.attraction_en_id
            FROM bookings b
            WHERE b.user_id = %s AND b.is_deleted = 0 AND b.order_id IS NULL
        """
        cursor.execute(booking_query, (user_id,))
        booking_info = cursor.fetchall()

        if not booking_info:  
            return None 
        
        attraction_ids = []
        for booking in booking_info:
            if booking['attraction_id']: 
                attraction_ids.append(booking['attraction_id'])
            elif booking['attraction_en_id']:  
                attraction_ids.append(booking['attraction_en_id'])

        if not attraction_ids: 
            return None

        format_strings = ','.join(['%s'] * len(attraction_ids))
        
        attraction_query = f"""
            SELECT 
                a.id, a.name, a.address, 
                JSON_UNQUOTE(JSON_EXTRACT(a.images, '$[0]')) as image
            FROM {table} a
            WHERE a.id IN ({format_strings})
        """
        cursor.execute(attraction_query, tuple(attraction_ids))
        attractions_info = cursor.fetchall()

        if not attractions_info:
            return None

        attractions_dict = {attraction['id']: attraction for attraction in attractions_info}

        bookings = []
        for booking in booking_info:
            attraction = None
            if booking['attraction_id']:
                attraction = attractions_dict.get(booking['attraction_id'])
            elif booking['attraction_en_id']:
                attraction = attractions_dict.get(booking['attraction_en_id'])
            
            if attraction is None:
                continue

            bookings.append({
                "attraction": {
                    "id": attraction['id'],
                    "name": attraction['name'],
                    "address": attraction['address'],
                    "image": attraction['image']
                },
                "id": booking['id'],
                "date": booking['date'].strftime('%Y-%m-%d'),  
                "time": booking['time'],
                "price": booking['price']
            })

        return {"data": bookings}

def delete_booking(conn, user_id, booking_id):
    cursor = conn.cursor(dictionary=True)
    try:
        sql = "UPDATE bookings SET is_deleted = 1 WHERE user_id = %s AND id = %s AND is_deleted = 0"
        cursor.execute(sql, (user_id, booking_id))
        affected_rows = cursor.rowcount  
        conn.commit() 
        return affected_rows
    except Exception as e:
        conn.rollback()  
        raise
    finally:
        cursor.close() 

def ensure_contact_exists(conn, contact_info):
    cursor = conn.cursor(dictionary=True)
    try:
        sql_check_contact = """
        SELECT id FROM contacts WHERE name = %s AND email = %s AND phone = %s
        """
        cursor.execute(sql_check_contact, (contact_info.name, contact_info.email, contact_info.phone))
        contact_id = cursor.fetchone()
        if contact_id:
            return contact_id['id']  
        else:
            sql_insert_contact = """
            INSERT INTO contacts (name, email, phone)
            VALUES (%s, %s, %s)
            """
            cursor.execute(sql_insert_contact, (contact_info.name, contact_info.email, contact_info.phone))
            conn.commit()
            contact_id = cursor.lastrowid
        return contact_id
    except Exception as e:
        conn.rollback()
        raise
    finally:
        cursor.close()  

def create_order_record(conn, user_id, order_data):
    cursor = conn.cursor(dictionary=True)
    contact_id = ensure_contact_exists(conn, order_data.order.contact)
    order_number = generate_order_number() 
    sql_order = """
    INSERT INTO orders (user_id, total_price, contact_id, number)
    VALUES (%s, %s, %s, %s)
    """
    try:
        cursor.execute(sql_order, (user_id, order_data.order.total_price, contact_id, order_number))
        order_id = cursor.lastrowid
        conn.commit() 

        sql_update_booking = """
        UPDATE bookings SET order_id = %s WHERE id = %s
        """

        for trip in order_data.order.trip:
            cursor.execute(sql_update_booking, (order_id, trip.booking_id))
        conn.commit()

        return order_id, order_number
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close() 

def update_order_status(conn, order_id, new_status):
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE orders SET status = %s WHERE id = %s", (new_status, order_id))
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()

def create_payment_record(conn, payment_data, order_id):
    cursor = conn.cursor()
    try:
        sql_insert_payment = """
        INSERT INTO payments (status, msg, rec_trade_id, bank_transaction_id, amount, currency, order_number, order_id)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(sql_insert_payment, (
            payment_data['status'],
            payment_data['msg'],
            payment_data['rec_trade_id'],
            payment_data['bank_transaction_id'],
            payment_data['amount'],
            payment_data['currency'],
            payment_data['order_number'],
            order_id
        ))
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise Exception(f"Failed to insert payment record: {str(e)}")
    finally:
        cursor.close()

def get_order_by_number(conn, order_number, user_id, accept_language):
    cursor = conn.cursor(dictionary=True)

    sql_query = """
        SELECT 
            o.id AS order_id,
            o.number,
            o.total_price,
            o.status,
            o.updated_at,
            c.name,
            c.email,
            c.phone
        FROM orders o
        INNER JOIN contacts c ON o.contact_id = c.id
        WHERE o.number = %s AND o.user_id = %s
    """
    cursor.execute(sql_query, (order_number, user_id))
    order_info = cursor.fetchone()

    if not order_info:
        return None

    sql_query_bookings = """
        SELECT 
            b.id AS booking_id,
            b.date,
            b.time,
            b.price,
            b.attraction_id,
            b.attraction_en_id
        FROM bookings b
        WHERE b.order_id = (SELECT id FROM orders WHERE number = %s)
    """
    cursor.execute(sql_query_bookings, (order_number,))
    bookings = cursor.fetchall()
    total_count = len(bookings)

    attraction_ids = []
    for booking in bookings:
        if booking['attraction_id'] or booking['attraction_en_id']:
            attraction_ids.append(booking['attraction_id'] or booking['attraction_en_id'])

    if not attraction_ids:  
        return None

    format_strings = ','.join(['%s'] * len(attraction_ids))

    table = 'attractions_en' if 'en' in accept_language else 'attractions'
    
    sql_query_attractions = f"""
        SELECT 
            a.id,
            a.name,
            a.address,
            JSON_UNQUOTE(JSON_EXTRACT(a.images, '$[0]')) AS image
        FROM {table} a
        WHERE a.id IN ({format_strings})
    """
    cursor.execute(sql_query_attractions, tuple(attraction_ids))
    attractions_info = cursor.fetchall()

    attractions_dict = {attraction['id']: attraction for attraction in attractions_info}

    result = {
        "data": {
            "id": order_info['order_id'],
            "number": order_info['number'],
            "totalPrice": order_info['total_price'],
            "status": order_info['status'],
            "updatedAt": order_info['updated_at'],
            "contact": {
                "name": order_info['name'],
                "email": order_info['email'],
                "phone": order_info['phone']
            },
            "totalBookings": total_count,
            "bookings": []
        }
    }

    for booking in bookings:
        attraction_id = booking['attraction_id'] or booking['attraction_en_id']
        attraction = attractions_dict.get(attraction_id)

        if not attraction:
            continue

        result['data']['bookings'].append({
            "attraction": {
                "id": attraction['id'],
                "name": attraction['name'],
                "address": attraction['address'],
                "image": attraction['image']
            },
            "id": booking['booking_id'],
            "date": booking['date'].strftime('%Y-%m-%d'),
            "time": booking['time'],
            "price": booking['price']
        })

    return result