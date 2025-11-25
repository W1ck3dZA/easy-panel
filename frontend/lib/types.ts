export interface LoginCredentials {
  username: string;
  password: string;
  domain: string;
  accountId: string;
  rememberMe?: boolean;
}

export interface User {
  username: string;
  domain: string;
  accountId: string;
  userId: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
}

export interface Contact {
  name: string;
  extension: string;
  email: string;
  tags: string[];
  isAgent: boolean;
}

export interface DirectoryResponse {
  success: boolean;
  contacts?: Contact[];
  total?: number;
  error?: string;
}

export interface CachedDirectory {
  data: Contact[];
  timestamp: number;
  username: string;
}

export interface CallStatus {
  presenceId: string;
  direction: 'inbound' | 'outbound';
  otherParty: string;
  duration: number;
  answered: boolean;
}

export interface CallsResponse {
  success: boolean;
  calls?: CallStatus[];
  error?: string;
}

export interface SipDevice {
  id: string;
  name: string;
  sipUri: string;
  username: string;
  password: string;
  domain: string;
  wssUrl: string;
}

export interface DevicesResponse {
  success: boolean;
  devices?: SipDevice[];
  error?: string;
}
