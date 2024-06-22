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

def create_booking_to_db(conn, booking):
    cursor = conn.cursor(dictionary=True)
    sql_query = """
    INSERT INTO bookings (attraction_id, date, time, price)
    VALUES (%s, %s, %s, %s)
    """
    values = (booking.attraction_id, booking.date, booking.time, booking.price)
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
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT 
            b.date, b.time, b.price,
            a.id as 'attraction_id', a.name, a.address, JSON_UNQUOTE(JSON_EXTRACT(a.images, '$[0]')) as 'image'
        FROM bookings b
        INNER JOIN attractions a ON b.attraction_id = a.id
        WHERE b.user_id = %s
    """, (user_id,))
    booking_info = cursor.fetchone()
    cursor.close()
    return booking_info 

def delete_booking(conn, user_id):
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("DELETE FROM bookings WHERE user_id = %s", (user_id,))
        affected_rows = cursor.rowcount
        conn.commit()
        return affected_rows
    except Exception as e:
        conn.rollback()  
        raise 
    finally:
        cursor.close()