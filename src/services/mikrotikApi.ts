import { RouterCredentials, AddressListItem, FirewallRule, ConnectionResult } from '@/types/mikrotik';

/**
 * MikroTik API Service
 * Note: Questo servizio funziona solo se il router MikroTik ha CORS abilitato
 * o se viene utilizzato un proxy/backend intermedio
 */
export class MikroTikApiService {
  private baseUrl: string;
  private credentials: RouterCredentials;

  constructor(credentials: RouterCredentials) {
    this.credentials = credentials;
    this.baseUrl = `http://${credentials.host}:8728`;
  }

  /**
   * Effettua il login al router MikroTik
   * Nota: Per motivi di sicurezza, in produzione dovresti usare HTTPS
   */
  private async login(): Promise<Response> {
    const loginUrl = `${this.baseUrl}/login`;
    
    // Prima richiesta per ottenere il cookie di sessione
    const response = await fetch(loginUrl, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Impossibile connettersi al router');
    }

    // Seconda richiesta con le credenziali
    const formData = new FormData();
    formData.append('username', this.credentials.username);
    formData.append('password', this.credentials.password);

    const loginResponse = await fetch(loginUrl, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!loginResponse.ok) {
      throw new Error('Credenziali non valide');
    }

    return loginResponse;
  }

  /**
   * Recupera le address list dal router
   */
  async getAddressLists(): Promise<AddressListItem[]> {
    try {
      await this.login();
      
      const response = await fetch(`${this.baseUrl}/rest/ip/firewall/address-list`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Errore nel recupero delle address list');
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Errore getAddressLists:', error);
      throw error;
    }
  }

  /**
   * Recupera le regole firewall dal router
   */
  async getFirewallRules(): Promise<FirewallRule[]> {
    try {
      await this.login();
      
      const response = await fetch(`${this.baseUrl}/rest/ip/firewall/filter`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Errore nel recupero delle regole firewall');
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Errore getFirewallRules:', error);
      throw error;
    }
  }

  /**
   * Connette al router e recupera tutti i dati
   */
  async connect(): Promise<ConnectionResult> {
    try {
      const [addressLists, firewallRules] = await Promise.all([
        this.getAddressLists(),
        this.getFirewallRules()
      ]);

      return {
        success: true,
        data: {
          addressLists,
          firewallRules
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      return {
        success: false,
        error: errorMessage
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