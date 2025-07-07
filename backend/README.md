# MikroTik API Backend

Backend Flask per gestire le connessioni alle API MikroTik.

## Installazione

1. Installa le dipendenze:
```bash
pip install -r requirements.txt
```

2. Avvia il server:
```bash
python app.py
```

Il server sarà disponibile su `http://localhost:5000`

## Endpoint

- `GET /api/health` - Verifica stato server
- `POST /api/connect` - Connette al router MikroTik

### POST /api/connect

Parametri richiesti:
```json
{
  "host": "192.168.1.1",
  "username": "admin", 
  "password": "password"
}
```

Risposta:
```json
{
  "success": true,
  "data": {
    "addressLists": [...],
    "firewallRules": [...]
  }
}
```

## Configurazione MikroTik

Assicurati che il router MikroTik abbia:
- API REST abilitata sulla porta 8728
- Utente con privilegi di lettura per `/ip/firewall`