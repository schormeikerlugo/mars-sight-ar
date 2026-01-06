
import os
import httpx
import asyncio

async def test():
    url = "http://localhost:54321/rest/v1/"
    print(f"Testing connection to {url}")
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url)
            print(f"Status: {resp.status_code}")
            print(f"Headers: {resp.headers}")
    except Exception as e:
        print(f"Error: {e}")

    # Try IPv4 Explicitly
    url_v4 = "http://127.0.0.1:54321/rest/v1/"
    print(f"Testing connection to {url_v4}")
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url_v4)
            print(f"Status: {resp.status_code}")
    except Exception as e:
        print(f"Error V4: {e}")

if __name__ == "__main__":
    asyncio.run(test())
