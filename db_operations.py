import json

def clean_string(s):
    return s.replace(' ', '')

def get_attractions(conn, keyword, page, limit=12):
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
    cursor.execute(sql_query, (keyword, keyword_like, keyword, page * limit, limit))
    results = cursor.fetchall()
    for result in results:
        for key in result:
            if isinstance(result[key], str):
                result[key] = clean_string(result[key])
        if result['images']:
            result['images'] = json.loads(result['images'])
        else:
            result['images'] = []
    cursor.close()
    return results

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