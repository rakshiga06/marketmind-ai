import requests

url = "http://localhost:8000/api/v1/auth/login"
data = {
    "username": "rakshiga06@gmail.com",
    "password": "some_password"
}

try:
    response = requests.post(url, data=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
except Exception as e:
    print(f"Error: {e}")
