/**
 * Background service worker for the VTT browser extension
 */

import { vttBridge } from '../utils/vttBridge.js';
import type { ExtensionMessage, ExtensionResponse, DDBExtractedData } from '../types/messages.js';

/**
 * Handle messages from content scripts and popup
 */
chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  console.log('Background received message:', message.type);

  // Handle async operations
  handleMessage(message, sender)
    .then((response) => sendResponse(response))
    .catch((error) => {
      console.error('Error handling message:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    });

  // Return true to indicate async response
  return true;
});

/**
 * Handle extension messages
 */
async function handleMessage(
  message: ExtensionMessage,
  sender: chrome.runtime.MessageSender
): Promise<ExtensionResponse> {
  switch (message.type) {
    case 'EXTRACTION_COMPLETE':
      return handleExtractionComplete(message.data);

    case 'SEND_TO_VTT':
      return handleSendToVTT(message.data);

    case 'GET_CONFIG':
      return handleGetConfig();

    case 'SET_CONFIG':
      return handleSetConfig(message.config);

    case 'GET_STORED_DATA':
      return handleGetStoredData();

    case 'CLEAR_STORED_DATA':
      return handleClearStoredData();

    default:
      return {
        success: false,
        error: 'Unknown message type',
      };
  }
}

/**
 * Handle extraction complete from content script
 */
async function handleExtractionComplete(data: DDBExtractedData): Promise<ExtensionResponse> {
  try {
    // Store the extracted data
    await vttBridge.storeExtracted(data);

    // Check if auto-send is enabled
    const config = await vttBridge.getConfig();

    if (config.autoSend) {
      // Automatically send to VTT
      await vttBridge.sendToVTT(data);
    }

    // Show badge to indicate new extraction
    await updateBadge();

    return {
      success: true,
      data: {
        stored: true,
        sent: config.autoSend,
      },
    };
  } catch (error) {
    console.error('Error handling extraction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process extraction',
    };
  }
}

/**
 * Handle send to VTT request
 */
async function handleSendToVTT(data: DDBExtractedData): Promise<ExtensionResponse> {
  try {
    await vttBridge.sendToVTT(data);
    return {
      success: true,
    };
  } catch (error) {
    console.error('Error sending to VTT:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send to VTT',
    };
  }
}

/**
 * Handle get config request
 */
async function handleGetConfig(): Promise<ExtensionResponse> {
  try {
    const config = await vttBridge.getConfig();
    const status = await vttBridge.getConnectionStatus();

    return {
      success: true,
      data: {
        config,
        status,
      },
    };
  } catch (error) {
    console.error('Error getting config:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get config',
    };
  }
}

/**
 * Handle set config request
 */
async function handleSetConfig(config: any): Promise<ExtensionResponse> {
  try {
    await vttBridge.setConfig(config);
    return {
      success: true,
    };
  } catch (error) {
    console.error('Error setting config:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to set config',
    };
  }
}

/**
 * Handle get stored data request
 */
async function handleGetStoredData(): Promise<ExtensionResponse> {
  try {
    const data = await vttBridge.getStoredData();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Error getting stored data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get stored data',
    };
  }
}

/**
 * Handle clear stored data request
 */
async function handleClearStoredData(): Promise<ExtensionResponse> {
  try {
    await vttBridge.clearStoredData();
    await updateBadge();
    return {
      success: true,
    };
  } catch (error) {
    console.error('Error clearing stored data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear stored data',
    };
  }
}

/**
 * Update extension badge with stored item count
 */
async function updateBadge(): Promise<void> {
  try {
    const stored = await vttBridge.getStoredData();
    const count = stored.length;

    if (count > 0) {
      await chrome.action.setBadgeText({ text: count.toString() });
      await chrome.action.setBadgeBackgroundColor({ color: '#667eea' });
    } else {
      await chrome.action.setBadgeText({ text: '' });
    }
  } catch (error) {
    console.error('Error updating badge:', error);
  }
}

/**
 * Initialize the background service worker
 */
async function init(): Promise<void> {
  console.log('VTT Content Importer: Background service worker initialized');

  // Update badge on startup
  await updateBadge();

  // Check connection status periodically
  setInterval(async () => {
    const status = await vttBridge.getConnectionStatus();
    console.log('VTT connection status:', status);
  }, 60000); // Check every minute
}

// Initialize
init();
