/**
 * Service for managing shared token across all users
 * Uses Cloudflare Pages Functions API for storage
 */

const API_BASE = '/api/token';

export interface TokenData {
  token: string;
  timestamp: number | null;
}

export const TokenService = {
  /**
   * Fetch the shared token from the API
   */
  async getToken(): Promise<TokenData> {
    try {
      const response = await fetch(API_BASE);
      const data = await response.json();

      if (data.success) {
        return {
          token: data.token || '',
          timestamp: data.timestamp || null,
        };
      }

      console.error('Failed to get token:', data.error);
      return { token: '', timestamp: null };
    } catch (error) {
      console.error('Error fetching token:', error);
      // Fallback to localStorage if API fails
      return {
        token: localStorage.getItem('graph_token') || '',
        timestamp: parseInt(localStorage.getItem('graph_token_timestamp') || '0') || null,
      };
    }
  },

  /**
   * Update the shared token via API
   */
  async setToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (data.success) {
        // Also update localStorage as backup
        localStorage.setItem('graph_token', token);
        localStorage.setItem('graph_token_timestamp', data.timestamp.toString());
        return true;
      }

      console.error('Failed to set token:', data.error);
      return false;
    } catch (error) {
      console.error('Error setting token:', error);
      // Fallback: save to localStorage if API fails
      localStorage.setItem('graph_token', token);
      localStorage.setItem('graph_token_timestamp', Date.now().toString());
      return false;
    }
  },

  /**
   * Check if the token is expired (older than 45 minutes)
   */
  isTokenExpired(timestamp: number | null): boolean {
    if (!timestamp) return true;
    const elapsed = Date.now() - timestamp;
    const expiryTime = 45 * 60 * 1000; // 45 minutes
    return elapsed > expiryTime;
  },

  /**
   * Get time remaining in minutes
   */
  getTimeRemaining(timestamp: number | null): number {
    if (!timestamp) return 0;
    const elapsed = Date.now() - timestamp;
    const remaining = (60 * 60 * 1000) - elapsed; // 60 minutes total
    return Math.max(0, Math.floor(remaining / 1000 / 60));
  },
};
