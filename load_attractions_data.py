import json
import os
import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv
import argparse
from datetime import datetime

load_dotenv()

DB_HOST = os.getenv('DB_HOST')
DB_USER = os.getenv('DB_USER')
DB_PASSWORD = os.getenv('DB_PASSWORD')
DB_NAME = os.getenv('DB_NAME')

def convert_date(date_str):
    """Convert date from 'YYYY/MM/DD' format to 'YYYY-MM-DD'."""
    return datetime.strptime(date_str, '%Y/%m/%d').date()

def load_data():
    db = None
    cursor = None
    try:
        db = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME
        )
        cursor = db.cursor()
        file_path = os.path.join('data', 'taipei-attractions.json')

        with open(file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)
            attractions = data['result']['results']

            for attraction in attractions:
                date_converted = convert_date(attraction['date']) if 'date' in attraction and attraction['date'] else None

                cursor.execute("""
                INSERT INTO attractions (
                    name, category, rate, description, memo_time, address,
                    latitude, longitude, mrt, date, direction
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    attraction['name'], attraction['CAT'], attraction['rate'],
                    attraction['description'], attraction['MEMO_TIME'], attraction['address'],
                    float(attraction['latitude']), float(attraction['longitude']),
                    attraction['MRT'], date_converted, attraction['direction']
                ))
                attraction_id = cursor.lastrowid

                images = attraction['file'].split('https://')
                for image in images:
                    if image and (image.lower().endswith('jpg') or image.lower().endswith('png')):
                        url = 'https://' + image
                        cursor.execute("INSERT INTO images (attraction_id, url) VALUES (%s, %s)", (attraction_id, url))

            db.commit()

    except Error as e:
        if db:
            db.rollback()
        print("Error while connecting to MySQL", e)
    finally:
        if cursor:
            cursor.close()
        if db and db.is_connected():
            db.close()
            print("MySQL connection is closed")

def main():
    parser = argparse.ArgumentParser(description="Load data into the database.")
    parser.add_argument('--load', action='store_true', help='Load data into the database')
    args = parser.parse_args()
    if args.load:
        load_data()

if __name__ == '__main__':
    main()