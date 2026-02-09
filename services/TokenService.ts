// Cloudflare Token Sync Service
import { CLOUDFLARE_CONFIG } from '../constants/config';

export const TokenService = {
  /**
   * Fetch the global graph token from Cloudflare Worker
   */
  async fetchRemoteToken(): Promise<string | null> {
    try {
      const response = await fetch(CLOUDFLARE_CONFIG.tokenSyncEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          console.log('✅ Remote token fetched successfully');
          return data.token;
        }
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to fetch remote token:', error);
      return null;
    }
  },

  /**
   * Broadcast a new token to Cloudflare Worker to sync with other users
   */
  async broadcastToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(CLOUDFLARE_CONFIG.tokenSyncEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        console.log('✅ Token broadcasted to cloud successfully');
        return true;
      } else {
        console.error('❌ Failed to broadcast token, status:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Error broadcasting token:', error);
      return false;
    }
  }
};
