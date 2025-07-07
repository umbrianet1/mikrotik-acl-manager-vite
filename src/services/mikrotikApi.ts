import { RouterCredentials, AddressListItem, FirewallRule, ConnectionResult } from '@/types/mikrotik';

/**
 * MikroTik API Service
 * Utilizza il backend Flask per connettersi ai router MikroTik
 */
export class MikroTikApiService {
  private backendUrl: string;
  private credentials: RouterCredentials;

  constructor(credentials: RouterCredentials) {
    this.credentials = credentials;
    this.backendUrl = 'http://localhost:5000/api';
  }

  /**
   * Connette al router tramite il backend e recupera tutti i dati
   */
  async connect(): Promise<ConnectionResult> {
    try {
      const response = await fetch(`${this.backendUrl}/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: this.credentials.host,
          username: this.credentials.username,
          password: this.credentials.password,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Errore di connessione al backend'
        };
      }

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      return {
        success: false,
        error: `Errore di connessione al backend: ${errorMessage}`
      };
    }
  }
}

/**
 * Funzione helper per creare un'istanza del servizio API
 */
export const createMikroTikApi = (credentials: RouterCredentials) => {
  return new MikroTikApiService(credentials);
};

/**
 * Mock service per demo/testing quando i router non sono disponibili
 */
export const createMockData = (): ConnectionResult => {
  return {
    success: true,
    data: {
      addressLists: [
        {
          '.id': '*1',
          list: 'whitelist',
          address: '192.168.1.100',
          comment: 'Server principale'
        },
        {
          '.id': '*2',
          list: 'blacklist',
          address: '10.0.0.50',
          comment: 'IP bloccato'
        }
      ],
      firewallRules: [
        {
          '.id': '*1',
          chain: 'input',
          action: 'accept',
          'src-address-list': 'whitelist',
          comment: 'Accetta whitelist'
        },
        {
          '.id': '*2',
          chain: 'input',
          action: 'drop',
          'src-address-list': 'blacklist',
          comment: 'Blocca blacklist'
        }
      ]
    }
  };
};