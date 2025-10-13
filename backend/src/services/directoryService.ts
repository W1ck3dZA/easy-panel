import axios from 'axios';
import { Builder } from 'xml2js';
import { config } from '../config';
import { User, Contact, DirectoryResponse } from '../types';

export class DirectoryService {
  /**
   * Fetch users from external API
   */
  async fetchUsers(externalToken: string, accountId: string): Promise<User[]> {
    const url = `${config.api.baseUrl}${config.api.listUsersEndpoint}`;
    
    const response = await axios.get<User[]>(url, {
      headers: {
        'X-Account-Id': accountId,
        'Authorization': `Bearer ${externalToken}`,
      },
    });

    return response.data;
  }

  /**
   * Parse user data and extract contact information
   */
  parseUserData(users: User[]): Contact[] {
    const contacts: Contact[] = [];

    for (const user of users) {
      const firstName = user.first_name || '';
      const lastName = user.last_name || '';
      const presenceId = user.presence_id;
      const email = user.email || '';
      const rawTags = user.tags || [];
      const isAgent = user.isAgent || false;

      const tags: string[] = [];
      if (rawTags) {
        for (const tag of rawTags) {
          if (typeof tag === 'object' && 'name' in tag) {
            tags.push(tag.name);
          } else if (typeof tag === 'string') {
            tags.push(tag);
          }
        }
      }

      if (presenceId) {
        const fullName = `${firstName} ${lastName}`.trim();

        contacts.push({
          name: fullName,
          extension: presenceId,
          email,
          tags,
          isAgent,
        });
      }
    }

    return contacts;
  }

  /**
   * Get directory data
   */
  async getDirectory(externalToken: string, accountId: string): Promise<DirectoryResponse> {
    try {
      const users = await this.fetchUsers(externalToken, accountId);
      const contacts = this.parseUserData(users);

      return {
        success: true,
        contacts,
        total: contacts.length,
      };
    } catch (error: any) {
      console.error('Directory fetch error:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch directory',
      };
    }
  }

  /**
   * Generate XML phonebook for Yealink phones
   */
  async generatePhonebookXml(externalToken: string, accountId: string): Promise<string> {
    const users = await this.fetchUsers(externalToken, accountId);
    const contacts = this.parseUserData(users);

    const builder = new Builder({
      xmldec: { version: '1.0', encoding: 'UTF-8' },
      renderOpts: { pretty: true },
    });

    const directoryEntries = contacts.map(contact => ({
      DirectoryEntry: {
        Name: contact.name,
        Telephone: contact.extension,
      },
    }));

    const xmlObject = {
      YealinkIPPhoneDirectory: directoryEntries,
    };

    return builder.buildObject(xmlObject);
  }
}

export const directoryService = new DirectoryService();
