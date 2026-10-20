import urllib.request
import urllib.error
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def test_endpoint(method, path, data=None):
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url, method=method)
    if data:
        req.add_header('Content-Type', 'application/json')
        data = json.dumps(data).encode('utf-8')
    try:
        with urllib.request.urlopen(req, data=data) as response:
            res_data = response.read().decode('utf-8')
            print(f"[{method}] {path} - {response.status}")
            return json.loads(res_data) if res_data else None
    except urllib.error.HTTPError as e:
        print(f"[{method}] {path} - FAILED {e.code}: {e.read().decode('utf-8')}")
        return None
    except Exception as e:
        print(f"[{method}] {path} - ERROR {e}")
        return None

def run_tests():
    print("--- Testing Buildings ---")
    
    # Create a building
    building_data = {
        "building_id": "Building-Test-1",
        "building_name": "Test Building",
        "total_floors": 5,
        "location": "Test City",
        "description": "Test building description"
    }
    print("Creating building...")
    res = test_endpoint('POST', '/buildings/', data=building_data)
    
    buildings = test_endpoint('GET', '/buildings/')
    
    if buildings and buildings.get('data'):
        building_id = buildings['data'][-1]['building_id']
        print(f"Fetching specific building (ID: {building_id})...")
        test_endpoint('GET', f'/buildings/{building_id}')
        
        print(f"Updating building (ID: {building_id})...")
        test_endpoint('PUT', f'/buildings/{building_id}', data={"building_name": "Updated Test Building"})
        
        print(f"Deleting building (ID: {building_id})...")
        test_endpoint('DELETE', f'/buildings/{building_id}')

    print("\n--- Testing Rooms ---")
    
    # Create a room
    room_data = {
        "building_id": "Building-A",
        "floor_number": 1,
        "room_id": "Room-Test-1",
        "room_name": "Test Room",
        "room_type": "Test",
        "x_coordinate": 0,
        "y_coordinate": 0,
        "width": 100,
        "height": 100
    }
    print("Creating room...")
    res = test_endpoint('POST', '/rooms/', data=room_data)
    
    rooms = test_endpoint('GET', '/rooms/')
    
    if rooms and rooms.get('data'):
        room_id = rooms['data'][-1]['room_id']
        print(f"Fetching specific room (ID: {room_id})...")
        test_endpoint('GET', f'/rooms/{room_id}')
        
        print(f"Updating room (ID: {room_id})...")
        test_endpoint('PUT', f'/rooms/{room_id}', data={"room_name": "Updated Room Name"})
        
        print(f"Deleting room (ID: {room_id})...")
        test_endpoint('DELETE', f'/rooms/{room_id}')

    print("\n--- Testing Sensors ---")
    # Create sensor data
    from datetime import datetime
    sensor_data = {
        "room_id": "Room-Test-1",
        "temperature": 25.5,
        "humidity": 45.0,
        "co2_level": 400.0,
        "gas_level": 0.0,
        "occupancy": 5,
        "motion_detected": False,
        "timestamp": datetime.utcnow().isoformat()
    }
    print("Creating sensor data...")
    test_endpoint('POST', '/sensor-data/', data=sensor_data)
    
    print("Fetching latest sensor data...")
    test_endpoint('GET', '/sensor-data/latest')
    
    print("Fetching sensor data history...")
    test_endpoint('GET', '/sensor-data/history?limit=5')
    
    print("Fetching sensor data for a specific room...")
    test_endpoint('GET', '/sensor-data/Room-Test-1')

if __name__ == "__main__":
    run_tests()
