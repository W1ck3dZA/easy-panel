import axios from 'axios';
import { config } from '../config';
import { ActiveCall, CallStatus, CallsResponse } from '../types';

export class CallService {
  /**
   * Fetch active calls from external API
   */
  async fetchActiveCalls(externalToken: string, accountId: string): Promise<ActiveCall[]> {
    const url = `${config.api.baseUrl}status/calls`;
    
    const response = await axios.get<ActiveCall[]>(url, {
      headers: {
        'X-Account-Id': accountId,
        'Authorization': `Bearer ${externalToken}`,
      },
    });

    return response.data;
  }

  /**
   * Process active calls and extract relevant information
   */
  processActiveCalls(calls: ActiveCall[]): CallStatus[] {
    return calls.map(call => ({
      presenceId: call.user.presence_id,
      direction: call.direction,
      // For inbound calls, show who's calling (caller_id_number)
      // For outbound calls, show who they're calling (callee_id_number)
      otherParty: call.direction === 'inbound' 
        ? call.caller_id_number 
        : call.callee_id_number,
      duration: call.duration_in_seconds,
      answered: call.answered,
    }));
  }

  /**
   * Get active calls
   */
  async getActiveCalls(externalToken: string, accountId: string): Promise<CallsResponse> {
    try {
      const activeCalls = await this.fetchActiveCalls(externalToken, accountId);
      const processedCalls = this.processActiveCalls(activeCalls);

      return {
        success: true,
        calls: processedCalls,
      };
    } catch (error: any) {
      console.error('Calls fetch error:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch active calls',
      };
    }
  }
}

export const callService = new CallService();
