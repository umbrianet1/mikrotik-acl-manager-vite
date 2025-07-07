from flask import Flask, request, jsonify
from flask_cors import CORS
from mikrotik_api import MikroTikAPI

app = Flask(__name__)
CORS(app)  # Abilita CORS per tutte le route

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
    
    # Inizializza API MikroTik
    api = MikroTikAPI()
    
    # Tentativo di connessione e login
    success, message = api.connect(host, username, password)
    
    if not success:
        return jsonify({
            'success': False,
            'error': message
        })
    
    try:
        # Recupera i dati
        address_lists = api.get_address_lists()
        firewall_rules = api.get_firewall_rules()
        
        return jsonify({
            'success': True,
            'data': {
                'addressLists': address_lists,
                'firewallRules': firewall_rules
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Errore durante il recupero dati: {str(e)}'
        })
    finally:
        # Chiudi connessione
        api.disconnect()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Endpoint per verificare che il server sia attivo"""
    return jsonify({'status': 'OK', 'message': 'MikroTik API Backend is running'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)