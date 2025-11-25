from flask import Flask, send_file, jsonify
from flask_cors import CORS
import os
import configparser
import requests
import json
from xml.etree.ElementTree import Element, SubElement, tostring

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load configuration
config = configparser.ConfigParser()
config.read('defaults.conf')

# Configuration
API_BASE_URL = config['API']['base_url']
LOGIN_ENDPOINT = config['API']['login_endpoint']
LIST_USERS = config['API']['list_users_endpoint']
ACCOUNT_ID = config['API']['account_id']

USERNAME = config['USER']['username']
PASSWORD = config['USER']['password']
DOMAIN = config['USER']['domain']

# Authentication
def get_auth_token():
    """Authenticate and return the authorization token."""
    url = f"{API_BASE_URL}{LOGIN_ENDPOINT}"
    headers = {
        'Content-Type': 'application/json'
    }
    payload = json.dumps({
        "username": USERNAME,
        "password": PASSWORD,
        "domain": DOMAIN
    })

    response = requests.post(url, headers=headers, data=payload)
    response.raise_for_status()

    # Extract access token
    token = response.json().get("access_token")

    if not token:
        raise ValueError("Access token not found in login response.")
    return token

# Fetch users
def fetch_users(auth_token):
    """Fetch user information and return all user details."""
    url = f"{API_BASE_URL}{LIST_USERS}"
    headers = {
        "X-Account-Id": ACCOUNT_ID,
        "Authorization": f"Bearer {auth_token}"
    }
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json()

# Parse user data
def parse_user_data(users):
    """Parse user data and extract name, extension, tags, email, and agent status."""
    contacts = []
    for user in users:
        first_name = user.get("first_name", "")
        last_name = user.get("last_name", "")
        presence_id = user.get("presence_id")
        email = user.get("email", "")
        raw_tags = user.get("tags", [])
        is_agent = user.get("isAgent", False)
        
        tags = []
        if raw_tags:
            for tag in raw_tags:
                if isinstance(tag, dict) and 'name' in tag:
                    tags.append(tag['name'])
        
        if presence_id:
            full_name = f"{first_name} {last_name}".strip()
            
            contacts.append({
                'name': full_name,
                'extension': presence_id,
                'email': email,
                'tags': tags,
                'isAgent': is_agent
            })
    
    return contacts

@app.route('/')
def index():
    """Serve the main dashboard page"""
    return send_file('index.html')

@app.route('/api/directory')
def api_directory():
    """API endpoint that returns directory data as JSON"""
    try:
        # Authenticate and fetch users
        auth_token = get_auth_token()
        users = fetch_users(auth_token)
        contacts = parse_user_data(users)
        
        return jsonify({
            'success': True,
            'contacts': contacts,
            'total': len(contacts)
        })
    except requests.RequestException as e:
        return jsonify({
            'success': False,
            'error': f'API request failed: {str(e)}'
        }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error: {str(e)}'
        }), 500

@app.route('/phonebook.xml')
def phonebook():
    """Dynamically generate phonebook XML data from API"""
    try:
        # Authenticate and fetch users
        auth_token = get_auth_token()
        users = fetch_users(auth_token)
        contacts = parse_user_data(users)
        
        # Generate XML
        root = Element('YealinkIPPhoneDirectory')
        
        for contact in contacts:
            entry = SubElement(root, 'DirectoryEntry')
            name = SubElement(entry, 'Name')
            name.text = contact['name']
            telephone = SubElement(entry, 'Telephone')
            telephone.text = contact['extension']
        
        xml_string = tostring(root, encoding='utf-8', method='xml')
        xml_declaration = b'<?xml version="1.0" encoding="UTF-8"?>\n'
        
        from flask import Response
        return Response(
            xml_declaration + xml_string,
            mimetype='application/xml'
        )
    except Exception as e:
        error_root = Element('Error')
        error_root.text = f'Failed to generate directory: {str(e)}'
        return Response(
            tostring(error_root, encoding='utf-8'),
            mimetype='application/xml',
            status=500
        )

@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'Company Phonebook Directory Server is running'
    })

if __name__ == '__main__':
    # Check if required files exist
    if not os.path.exists('index.html'):
        print("ERROR: index.html not found!")
        exit(1)
    
    app.run(host='0.0.0.0', port=5000, debug=True)
