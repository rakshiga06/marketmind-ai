import sqlite3

db_path = "d:/marketmind-ai/backend/marketmind.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()
cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'")
schema = cursor.fetchone()
if schema:
    print(f"Schema for users table:\n{schema[0]}")
else:
    print("Table 'users' NOT FOUND!")
conn.close()
