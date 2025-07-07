export interface RouterCredentials {
  id: string;
  name: string;
  host: string;
  username: string;
  password: string;
}

export interface AddressListItem {
  '.id': string;
  list: string;
  address: string;
  comment?: string;
  timeout?: string;
  dynamic?: boolean;
  disabled?: boolean;
}

export interface FirewallRule {
  '.id': string;
  chain: string;
  action: string;
  'src-address'?: string;
  'dst-address'?: string;
  'src-port'?: string;
  'dst-port'?: string;
  protocol?: string;
  comment?: string;
  disabled?: boolean;
  'address-list'?: string;
  'src-address-list'?: string;
  'dst-address-list'?: string;
}

export interface RouterData {
  credentials: RouterCredentials;
  addressLists: AddressListItem[];
  firewallRules: FirewallRule[];
  isConnected: boolean;
  error?: string;
  loading: boolean;
}

export interface ConnectionResult {
  success: boolean;
  error?: string;
  data?: {
    addressLists: AddressListItem[];
    firewallRules: FirewallRule[];
  };
}