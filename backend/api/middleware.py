# middleware stubs
from fastapi import Request

async def logging_middleware(request: Request, call_next):
    # Setup basic logging here
    response = await call_next(request)
    return response
