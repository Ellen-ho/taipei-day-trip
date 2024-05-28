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