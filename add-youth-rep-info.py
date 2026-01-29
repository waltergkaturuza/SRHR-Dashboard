"""
Script to add/update youth representative information for districts
This script uses the API to update district information with youth representatives and health platforms
"""

import requests
import json

# API Configuration
API_BASE_URL = 'http://localhost:5000/api'  # Change to your API URL
# For production: API_BASE_URL = 'https://your-app.onrender.com/api'

# Authentication - You need to login first
def get_auth_token(username, password):
    """Login and get authentication token"""
    response = requests.post(f'{API_BASE_URL}/auth/login', json={
        'username': username,
        'password': password
    })
    
    if response.status_code == 200:
        return response.json()['token']
    else:
        print(f"Login failed: {response.json()}")
        return None

# District youth representative data (from the table provided)
DISTRICT_YOUTH_DATA = {
    'Glen View': {
        'youth_rep_name': 'Tinotenda Craig Marimo',
        'youth_rep_title': 'YPNHW District Facilitator',
        'health_platforms': [
            'District Health Committee',
            'District Aids Committee',
            'District Health stakeholders taskforce',
            'Child Protection Committee'
        ]
    },
    'Mufakose': {
        'health_platforms': [
            'District Health Committee',
            'District Aids Committee',
            'District Health stakeholders taskforce',
            'Child Protection Committee'
        ]
    },
    'Budiriro': {
        'health_platforms': [
            'District Health Committee',
            'District Aids Committee',
            'District Health stakeholders taskforce',
            'Child Protection Committee'
        ]
    },
    'Chitungwiza': {
        'youth_rep_name': 'Leroy Ndambi',
        'youth_rep_title': 'YPNHW District Facilitator',
        'health_platforms': [
            'District Health Committee',
            'District Aids Committee',
            'District stakeholders taskforce'
        ]
    },
    'Mbare': {
        'youth_rep_name': 'Nokutenda Mukorera',
        'youth_rep_title': 'YPNHW District Facilitator',
        'health_platforms': [
            'District Health Committee',
            'District Aids Committee',
            'District stakeholders taskforce'
        ]
    },
    'Dzivarasekwa': {
        'youth_rep_name': 'Munashe Kawanje',
        'youth_rep_title': 'YPNHW District Facilitator',
        'health_platforms': [
            'District Aids Committee',
            'District stakeholders',
            'District health taskforce'
        ]
    },
    'Glaudina': {
        'health_platforms': [
            'District Aids Committee',
            'District stakeholders',
            'District health taskforce'
        ]
    },
    'Belvedere': {
        'health_platforms': [
            'District Aids Committee',
            'District stakeholders',
            'District health taskforce'
        ]
    }
}


def update_district_youth_info(district_name, data, token):
    """Update youth representative information for a district"""
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    url = f'{API_BASE_URL}/districts/name/{district_name}/youth-info'
    
    response = requests.put(url, json=data, headers=headers)
    
    if response.status_code == 200:
        print(f"✅ Successfully updated {district_name}")
        return True
    else:
        print(f"❌ Failed to update {district_name}: {response.json()}")
        return False


def main():
    print("=" * 60)
    print("District Youth Representative Information Update Script")
    print("=" * 60)
    print()
    
    # Login
    print("Please enter your admin credentials:")
    username = input("Username: ").strip()
    password = input("Password: ").strip()
    
    print("\nLogging in...")
    token = get_auth_token(username, password)
    
    if not token:
        print("❌ Authentication failed. Please check your credentials.")
        return
    
    print("✅ Authentication successful!")
    print()
    
    # Update districts
    print("Updating district youth representative information...")
    print("-" * 60)
    
    success_count = 0
    for district_name, data in DISTRICT_YOUTH_DATA.items():
        if update_district_youth_info(district_name, data, token):
            success_count += 1
    
    print("-" * 60)
    print(f"\nCompleted: {success_count}/{len(DISTRICT_YOUTH_DATA)} districts updated successfully")
    
    # Display summary
    print("\n" + "=" * 60)
    print("Summary of Youth Representatives:")
    print("=" * 60)
    for district_name, data in DISTRICT_YOUTH_DATA.items():
        rep_name = data.get('youth_rep_name', 'Not assigned')
        rep_title = data.get('youth_rep_title', '')
        platforms = len(data.get('health_platforms', []))
        
        print(f"\n{district_name}:")
        print(f"  Representative: {rep_name}")
        if rep_title:
            print(f"  Title: {rep_title}")
        print(f"  Health Platforms: {platforms}")


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nOperation cancelled by user.")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
