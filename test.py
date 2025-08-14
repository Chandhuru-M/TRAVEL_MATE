# 
# import requests

# url = "https://api.foursquare.com/v3/places/search"

# headers = {
#     "accept": "application/json",
#     "Authorization": "IZVC5N1FFMBJG1K45PWMYT1JZBVT2BBMPSSHBVXI2GLGQECS"
# }

# response = requests.get(url, headers=headers)

# print(response.text)
# import requests

# url = "https://api.foursquare.com/v3/places/search"

# params = {
#     "ll": "28.6139,77.2090",   # Example: New Delhi lat/long
#     "query": "hotel",
#     "radius": 5000,
#     "limit": 5
# }

# headers = {
#     "accept": "application/json",
#     "Authorization": "fsq38/guLJT4GZGWPjshOsd8KEKuqOz7tfn0aW+b5KvDLPI="
# }

# response = requests.get(url, headers=headers, params=params)

# print(response.json())
import requests

# Use your new Personal API Key here (from Foursquare Developer Console, under a "Places API" project)
API_KEY = "fsq38/guLJT4GZGWPjshOsd8KEKuqOz7tfn0aW+b5KvDLPI="

url = "https://api.foursquare.com/v3/places/search"  # Updated endpoint as per migration guide

params = {
    "ll": "28.6139,77.2090",   # Example coordinates (New Delhi)
    "query": "hotel",          # Search for hotels
    "radius": 5000,            # in meters
    "limit": 5                 # up to 5 results
}

headers = {
    "Accept": "application/json",
    "Authorization": API_KEY
}

response = requests.get(url, headers=headers, params=params)

print("Status Code:", response.status_code)
print("Response JSON:", response.json(), "\n")

# Optional: Print friendly output
if response.status_code == 200:
    results = response.json().get("results", [])
    for place in results:
        name = place.get("name", "—")
        location = place.get("location", {})
        address = location.get("formatted_address", "Address not available")
        dist = place.get("distance", "N/A")
        print(f"• {name}: {address} (Approx. {dist} m away)")
else:
    print("Failed to fetch. Check API key and project setup.")
