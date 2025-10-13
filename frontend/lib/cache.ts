import { Contact, CachedDirectory } from './types';

const CACHE_KEY = 'directory_cache';
const CACHE_TTL = parseInt(process.env.NEXT_PUBLIC_CACHE_TTL || '300000', 10); // 5 minutes default

export class CacheManager {
  /**
   * Save directory data to cache
   */
  static saveToCache(contacts: Contact[], username: string): void {
    if (typeof window === 'undefined') return;

    const cacheData: CachedDirectory = {
      data: contacts,
      timestamp: Date.now(),
      username,
    };

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Failed to save to cache:', error);
    }
  }

  /**
   * Get directory data from cache
   */
  static getFromCache(username: string): Contact[] | null {
    if (typeof window === 'undefined') return null;

    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const cacheData: CachedDirectory = JSON.parse(cached);

      // Check if cache is for the same user
      if (cacheData.username !== username) {
        this.clearCache();
        return null;
      }

      // Check if cache is still valid
      const now = Date.now();
      const age = now - cacheData.timestamp;

      if (age > CACHE_TTL) {
        this.clearCache();
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.error('Failed to read from cache:', error);
      return null;
    }
  }

  /**
   * Check if cache exists and is valid
   */
  static isCacheValid(username: string): boolean {
    if (typeof window === 'undefined') return false;

    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return false;

      const cacheData: CachedDirectory = JSON.parse(cached);

      if (cacheData.username !== username) return false;

      const now = Date.now();
      const age = now - cacheData.timestamp;

      return age <= CACHE_TTL;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get cache age in milliseconds
   */
  static getCacheAge(username: string): number | null {
    if (typeof window === 'undefined') return null;

    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const cacheData: CachedDirectory = JSON.parse(cached);

      if (cacheData.username !== username) return null;

      return Date.now() - cacheData.timestamp;
    } catch (error) {
      return null;
    }
  }

  /**
   * Clear cache
   */
  static clearCache(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(CACHE_KEY);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Get cache TTL in milliseconds
   */
  static getCacheTTL(): number {
    return CACHE_TTL;
  }
}
