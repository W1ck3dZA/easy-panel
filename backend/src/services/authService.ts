import axios from 'axios';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { LoginRequest, ExternalApiLoginResponse, JwtPayload, AuthResponse } from '../types';

export class AuthService {
  /**
   * Authenticate user with external API
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const url = `${config.api.baseUrl}${config.api.loginEndpoint}`;
      
      const response = await axios.post<ExternalApiLoginResponse>(
        url,
        {
          username: credentials.username,
          password: credentials.password,
          domain: credentials.domain,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const externalToken = response.data.access_token;
      const userId = response.data.user?._id;

      if (!externalToken) {
        throw new Error('Access token not found in login response');
      }

      if (!userId) {
        throw new Error('User ID not found in login response');
      }

      // Generate JWT with embedded external token, account ID, and user ID
      const payload: JwtPayload = {
        username: credentials.username,
        domain: credentials.domain,
        accountId: credentials.accountId,
        userId,
        externalToken,
      };

      // Use extended expiry if rememberMe is true
      const expiresIn = credentials.rememberMe 
        ? config.jwt.rememberMeExpiry 
        : config.jwt.expiry;

      const token = jwt.sign(
        payload,
        config.jwt.secret,
        { expiresIn } as jwt.SignOptions
      );

      return {
        success: true,
        token,
        user: {
          username: credentials.username,
          domain: credentials.domain,
          accountId: credentials.accountId,
          userId,
        },
      };
    } catch (error: any) {
      console.error('Login error:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.message || 'Authentication failed',
      };
    }
  }

  /**
   * Verify JWT token and extract payload
   */
  verifyToken(token: string): JwtPayload | null {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
      return decoded;
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  }

  /**
   * Extract token from Authorization header
   */
  extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }
}

export const authService = new AuthService();
