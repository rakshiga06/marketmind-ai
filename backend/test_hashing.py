from passlib.context import CryptContext
import traceback

try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    pw = "testpassword"
    print(f"Hashing '{pw}'...")
    h = pwd_context.hash(pw)
    print(f"Result: {h}")
    print(f"Verifying...")
    v = pwd_context.verify(pw, h)
    print(f"Verify result: {v}")
except Exception as e:
    print(f"Error: {e}")
    traceback.print_exc()
