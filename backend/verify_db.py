import sqlite3

db_path = "d:/marketmind-ai/backend/marketmind.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()
cursor.execute("SELECT id, email, hashed_password FROM users;")
rows = cursor.fetchall()
for row in rows:
    print(f"ID: {row[0]}, Email: {row[1]}, Hash: {row[2][:10]}...") # Just show the start
conn.close()
