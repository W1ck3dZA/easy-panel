export interface LoginRequest {
  username: string;
  password: string;
  domain: string;
  accountId: string;
  rememberMe?: boolean;
}

export interface ExternalApiLoginResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
}

export interface User {
  first_name: string;
  last_name: string;
  presence_id: string;
  email?: string;
  tags?: Array<{ name: string } | string>;
  isAgent?: boolean;
}

export interface Contact {
  name: string;
  extension: string;
  email: string;
  tags: string[];
  isAgent: boolean;
}

export interface JwtPayload {
  username: string;
  domain: string;
  accountId: string;
  externalToken: string;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: {
    username: string;
    domain: string;
    accountId: string;
  };
  error?: string;
}

export interface DirectoryResponse {
  success: boolean;
  contacts?: Contact[];
  total?: number;
  error?: string;
}

export interface ActiveCall {
  call_id: string;
  caller_id_number: string;
  caller_id_name: string;
  callee_id_number: string;
  user: {
    id: string;
    fullname: string;
    presence_id: string;
    email: string;
  };
  duration_in_seconds: number;
  answered: boolean;
  origination: string;
  direction: 'inbound' | 'outbound';
  tags: string[];
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
