import sqlite3
import os

db_path = "d:/marketmind-ai/backend/marketmind.db"
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT id, email FROM users;")
    rows = cursor.fetchall()
    print("Registered Users:")
    for row in rows:
        print(f"ID: {row[0]}, Email: {row[1]}")
    conn.close()
else:
    print(f"Database not found at {db_path}")
