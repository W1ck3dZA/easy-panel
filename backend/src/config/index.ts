import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  api: {
    baseUrl: process.env.API_BASE_URL || '',
    loginEndpoint: process.env.LOGIN_ENDPOINT || '',
    listUsersEndpoint: process.env.LIST_USERS_ENDPOINT || '',
    listDevicesEndpoint: process.env.LIST_DEVICES_ENDPOINT || '',
    accountId: process.env.ACCOUNT_ID || '',
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-this',
    expiry: process.env.JWT_EXPIRY || '24h',
    rememberMeExpiry: process.env.JWT_REMEMBER_ME_EXPIRY || '30d',
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
  
  sip: {
    platformDomain: process.env.PLATFORM_DOMAIN || 'mobileuc.co.za',
    wssUrl: process.env.WSS_URL || 'wss://mobileuc.co.za:5065',
  },
};
