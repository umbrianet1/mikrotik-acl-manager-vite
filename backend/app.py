from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json

app = Flask(__name__)
CORS(app)  # Abilita CORS per tutte le route

def mikrotik_api_login(ip, user, password):
    """Effettua il login al router MikroTik"""
    session = requests.Session()
    login_url = f"http://{ip}:8728/login"
    
    try:
        # Prima richiesta per ottenere il cookie di sessione
        response = session.get(login_url, timeout=10)
        if response.status_code != 200:
            return None, "Impossibile connettersi al router"

        # Seconda richiesta con le credenziali
        post_data = {'username': user, 'password': password}
        login_response = session.post(login_url, data=post_data, timeout=10)
        
        if login_response.status_code == 200:
            return session, None
        else:
            return None, "Credenziali non valide"
    except requests.exceptions.RequestException as e:
        return None, f"Errore di connessione: {str(e)}"

def get_address_lists(session, ip):
    """Recupera le address list dal router"""
    try:
        url = f"http://{ip}:8728/rest/ip/firewall/address-list"
        response = session.get(url, timeout=10)
        if response.status_code == 200:
            return response.json()
        return []
    except:
        return []

def get_firewall_rules(session, ip):
    """Recupera le regole firewall dal router"""
    try:
        url = f"http://{ip}:8728/rest/ip/firewall/filter"
        response = session.get(url, timeout=10)
        if response.status_code == 200:
            return response.json()
        return []
    except:
        return []

@app.route('/api/connect', methods=['POST'])
def connect_router():
    """Endpoint per connettere al router MikroTik"""
    data = request.get_json()
    
    if not data or not all(key in data for key in ['host', 'username', 'password']):
        return jsonify({
            'success': False,
            'error': 'Parametri mancanti: host, username, password richiesti'
        }), 400
    
    host = data['host']
    username = data['username']
    password = data['password']
    
    # Tentativo di login
    session, error = mikrotik_api_login(host, username, password)
    
    if error:
        return jsonify({
            'success': False,
            'error': error
        })
    
    # Recupera i dati
    address_lists = get_address_lists(session, host)
    firewall_rules = get_firewall_rules(session, host)
    
    return jsonify({
        'success': True,
        'data': {
            'addressLists': address_lists,
            'firewallRules': firewall_rules
        }
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    """Endpoint per verificare che il server sia attivo"""
    return jsonify({'status': 'OK', 'message': 'MikroTik API Backend is running'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)