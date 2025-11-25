import axios from 'axios';
import { config } from '../config';
import { Device, SipDevice, DevicesResponse } from '../types';

export class DeviceService {
  /**
   * Get devices for the authenticated user
   */
  async getDevices(
    externalToken: string,
    accountId: string,
    userId: string,
    domain: string
  ): Promise<DevicesResponse> {
    try {
      const url = `${config.api.baseUrl}${config.api.listDevicesEndpoint}`;

      const response = await axios.get<Record<string, Device>>(url, {
        headers: {
          'X-Account-Id': accountId,
          'Authorization': `Bearer ${externalToken}`,
        },
      });

      const devicesData = response.data;

      // Filter and transform devices
      const devices: SipDevice[] = Object.entries(devicesData)
        .filter(([_, device]) => {
          // Only return devices that:
          // 1. Belong to the authenticated user
          // 2. Are enabled
          // 3. Support WebRTC (required for SIP.js)
          return (
            device.owner_id === userId &&
            device.enabled === true &&
            device.media?.webrtc === true
          );
        })
        .map(([deviceId, device]) => {
          // Construct proper SIP domain: lowercase, remove spaces, append platform domain
          const normalizedDomain = domain.toLowerCase().replace(/\s+/g, '');
          const sipDomain = `${normalizedDomain}.${config.sip.platformDomain}`;
          
          return {
            id: deviceId,
            name: device.name,
            sipUri: `sip:${device.sip.username}@${sipDomain}`,
            username: device.sip.username,
            password: device.sip.password,
            domain: sipDomain,
            wssUrl: config.sip.wssUrl,
          };
        });

      return {
        success: true,
        devices,
      };
    } catch (error: any) {
      console.error('Get devices error:', error.response?.data || error.message);

      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch devices',
      };
    }
  }
}

export const deviceService = new DeviceService();
