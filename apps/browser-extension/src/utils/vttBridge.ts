/**
 * VTT Bridge - Handles communication between extension and VTT application
 */

import type { DDBExtractedData, VTTBridgeConfig } from '../types/messages.js';

const DEFAULT_CONFIG: VTTBridgeConfig = {
  vttUrl: 'http://localhost:3000',
  autoSend: false,
};

const CONFIG_KEY = 'vtt_bridge_config';
const STORED_DATA_KEY = 'vtt_stored_data';

/**
 * VTT Bridge class for managing communication with the VTT application
 */
export class VTTBridge {
  /**
   * Get the current configuration
   */
  async getConfig(): Promise<VTTBridgeConfig> {
    try {
      const result = await chrome.storage.local.get(CONFIG_KEY);
      return result[CONFIG_KEY] || DEFAULT_CONFIG;
    } catch (error) {
      console.error('Error getting config:', error);
      return DEFAULT_CONFIG;
    }
  }

  /**
   * Set the configuration
   */
  async setConfig(config: VTTBridgeConfig): Promise<void> {
    try {
      await chrome.storage.local.set({ [CONFIG_KEY]: config });
    } catch (error) {
      console.error('Error setting config:', error);
      throw error;
    }
  }

  /**
   * Send extracted data to the VTT application
   */
  async sendToVTT(data: DDBExtractedData): Promise<boolean> {
    try {
      const config = await this.getConfig();

      // Validate VTT URL
      if (!config.vttUrl) {
        throw new Error('VTT URL not configured');
      }

      // Send to VTT via HTTP POST
      const response = await fetch(`${config.vttUrl}/api/import/dndbeyond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send to VTT: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('Successfully sent to VTT:', result);
      return true;
    } catch (error) {
      console.error('Error sending to VTT:', error);
      throw error;
    }
  }

  /**
   * Store extracted data locally in extension storage
   */
  async storeExtracted(data: DDBExtractedData): Promise<void> {
    try {
      const stored = await this.getStoredData();
      stored.push(data);

      // Keep only the last 50 items
      const trimmed = stored.slice(-50);

      await chrome.storage.local.set({ [STORED_DATA_KEY]: trimmed });
    } catch (error) {
      console.error('Error storing data:', error);
      throw error;
    }
  }

  /**
   * Get all stored extracted data
   */
  async getStoredData(): Promise<DDBExtractedData[]> {
    try {
      const result = await chrome.storage.local.get(STORED_DATA_KEY);
      return result[STORED_DATA_KEY] || [];
    } catch (error) {
      console.error('Error getting stored data:', error);
      return [];
    }
  }

  /**
   * Clear all stored data
   */
  async clearStoredData(): Promise<void> {
    try {
      await chrome.storage.local.remove(STORED_DATA_KEY);
    } catch (error) {
      console.error('Error clearing stored data:', error);
      throw error;
    }
  }

  /**
   * Get the status of the VTT connection
   */
  async getConnectionStatus(): Promise<{ connected: boolean; url: string }> {
    try {
      const config = await this.getConfig();

      if (!config.vttUrl) {
        return { connected: false, url: '' };
      }

      // Try to ping the VTT server
      const response = await fetch(`${config.vttUrl}/api/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      return {
        connected: response.ok,
        url: config.vttUrl,
      };
    } catch (error) {
      const config = await this.getConfig();
      return {
        connected: false,
        url: config.vttUrl,
      };
    }
  }
}

// Export singleton instance
export const vttBridge = new VTTBridge();
