import json

def clean_string(s):
    return s.replace(' ', '')

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

def get_attraction_by_id(conn, attraction_id):
    cursor = conn.cursor(dictionary=True)
    sql_query = """
        SELECT 
            id, name, category, description, address, transport, mrt, 
            latitude, longitude, images 
        FROM attractions
        WHERE id = %s
    """
    cursor.execute(sql_query, (attraction_id,))
    result = cursor.fetchone()
    if result:
        for key in result:
            if isinstance(result[key], str):
                result[key] = clean_string(result[key])
        if result['images']:
            result['images'] = json.loads(result['images'])
        else:
            result['images'] = []
    cursor.close()
    return result

def get_mrts(conn):
    cursor = conn.cursor(dictionary=True)
    sql_query = """
        SELECT mrt, COUNT(*) as attraction_count
        FROM attractions
        WHERE mrt IS NOT NULL
        GROUP BY mrt
        ORDER BY attraction_count DESC
    """
    cursor.execute(sql_query)
    results = cursor.fetchall()
    cursor.close()
    return [result['mrt'] for result in results]

def check_existing_booking(conn, user_id, booking):
     cursor = conn.cursor(dictionary=True)
     sql_query = """
        SELECT id FROM bookings
        WHERE user_id = %s AND date = %s AND time = %s AND is_deleted = 0
    """
     cursor.execute(sql_query, (user_id, booking.date, booking.time))
     existing_booking = cursor.fetchone()
     cursor.close()
     if existing_booking:
            return existing_booking['id']  
     else:
        return None 

def create_booking_to_db(conn, booking, user_id):
    cursor = conn.cursor(dictionary=True)
    sql_query = """
    INSERT INTO bookings (user_id, attraction_id, date, time, price, is_deleted)
    VALUES (%s, %s, %s, %s, %s, %s)
    """
    values = (user_id, booking.attraction_id, booking.date, booking.time, booking.price, 0)
    try:
        cursor.execute(sql_query, values)
        conn.commit()  
        return cursor.lastrowid  
    except Exception as e:
        conn.rollback()  
        raise
    finally:
        cursor.close() 

def get_booking_details(conn, user_id):
    with conn.cursor(dictionary=True) as cursor:
        sql_query = """
            SELECT 
                b.id, b.date, b.time, b.price,
                a.id as attraction_id, a.name, a.address, 
                JSON_UNQUOTE(JSON_EXTRACT(a.images, '$[0]')) as image
            FROM bookings b
            INNER JOIN attractions a ON b.attraction_id = a.id
            WHERE b.user_id = %s AND b.is_deleted = 0
        """
        cursor.execute(sql_query, (user_id,))
        booking_info = cursor.fetchall()

        if len(booking_info) == 0:
            return None 
        
        bookings = []
        for booking in booking_info:
            bookings.append({
                "attraction": {
                    "id": booking['attraction_id'],
                    "name": booking['name'],
                    "address": booking['address'],
                    "image": booking['image']
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