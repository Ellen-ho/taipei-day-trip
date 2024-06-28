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

def create_tables():
    db = mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME
    )
    cursor = db.cursor()
    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS attractions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(255),
                rate VARCHAR(50),
                description TEXT,
                memo_time TEXT,
                address VARCHAR(255) NOT NULL,
                latitude FLOAT,
                longitude FLOAT,
                mrt VARCHAR(255),
                date DATE,
                transport TEXT,
                images JSON
            );
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                password VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS bookings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            attraction_id INT NOT NULL,
            date DATE NOT NULL,
            time ENUM('morning', 'afternoon') NOT NULL,
            price INT CHECK(price IN (2000, 2500)),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_deleted TINYINT(1) DEFAULT 0,
            FOREIGN KEY (attraction_id) REFERENCES attractions(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        """)
        db.commit()
    except Error as e:
        db.rollback()
        print("Error while creating tables:", e)
    finally:
        cursor.close()
        db.close()

def convert_date(date_str):
    return datetime.strptime(date_str, '%Y/%m/%d').date()

def filter_images(file_str):
    images = file_str.split('https://')
    valid_images = []
    for image in images:
        if image and (image.lower().endswith('jpg') or image.lower().endswith('png')):
            url = 'https://' + image
            valid_images.append(url)
    return valid_images

def load_attractions_data():
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
                images = filter_images(attraction['file'])
                images_json = json.dumps(images)

                cursor.execute("""
                INSERT INTO attractions (
                    name, category, rate, description, memo_time, address,
                    latitude, longitude, mrt, date, transport, images
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    attraction['name'], attraction['CAT'], attraction['rate'],
                    attraction['description'], attraction['MEMO_TIME'], attraction['address'],
                    float(attraction['latitude']), float(attraction['longitude']),
                    attraction['MRT'], date_converted, attraction['direction'], images_json
                ))

            db.commit()
    except Error as e:
        if db:
            db.rollback()
        print("Error during database operation:", e)
    finally:
        if cursor:
            cursor.close()
        if db and db.is_connected():
            db.close()
            print("MySQL connection is closed")

def main():
    parser = argparse.ArgumentParser(description="Load data into the database.")
    parser.add_argument('--init-db', action='store_true', help='Initialize database tables')
    parser.add_argument('--load-data', action='store_true', help='Load attractions data into the database')
    args = parser.parse_args()
    if args.init_db:
        create_tables()
    if args.load_data:
        load_attractions_data()

if __name__ == '__main__':
    main()