import requests

url = "http://localhost:8000/api/v1/auth/signup"
data = {
    "email": "test@example.com",
    "password": "testpassword"
}

try:
    response = requests.post(url, json=data)
    print(f"Signup Status Code: {response.status_code}")
    print(f"Signup Response: {response.json()}")
    
    if response.status_code == 200:
        token = response.json()["access_token"]
        # Now try login
        url_login = "http://localhost:8000/api/v1/auth/login"
        login_data = {"username": "test@example.com", "password": "testpassword"}
        res_login = requests.post(url_login, data=login_data)
        print(f"Login Status Code: {res_login.status_code}")
        print(f"Login Response: {res_login.json()}")
except Exception as e:
    print(f"Error: {e}")
