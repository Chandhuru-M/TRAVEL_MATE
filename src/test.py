import os
import requests
#from dotenv import load_dotenv



SERVICE_KEY ="B2OG40USAJDJ2MUEAI1RCGWATEVJCXLJA5UMLLURMOKY3URS"

def get_places_nearby(lat, lon, query, limit=5, radius=1000):
    url = "https://places-api.foursquare.com/places/search"
    headers = {
        "accept": "application/json",
        "Authorization": f"Bearer {SERVICE_KEY}",
        "X-Places-Api-Version": "2025-06-17"  # Use this as a version header
    }
    params = {
        "ll": f"{lat},{lon}",
        "query": query,
        "limit": limit,
        "radius": radius
    }

    resp = requests.get(url, headers=headers, params=params)
    if resp.status_code == 200:
        results = resp.json().get("results", [])
        return [
            f"{place.get('name')} — {place.get('location', {}).get('formatted_address','No address')}"
            for place in results
        ]
    else:
        print("Error:", resp.status_code, resp.text)
        return []

if __name__== "__main__":
    # Example coordinates—use actual location data in real cases
    places = get_places_nearby(13.0827, 80.2707, "gym")
    print("Nearby Cafés:")
    for p in places:
        print("-", p)