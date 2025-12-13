/**
 * Popup script for the VTT browser extension
 */

import type { VTTBridgeConfig } from '../types/messages.js';

// DOM elements
const statusDot = document.getElementById('statusDot') as HTMLElement;
const statusText = document.getElementById('statusText') as HTMLElement;
const vttUrlInput = document.getElementById('vttUrl') as HTMLInputElement;
const autoSendCheckbox = document.getElementById('autoSend') as HTMLInputElement;
const saveConfigButton = document.getElementById('saveConfig') as HTMLButtonElement;
const storedCountElement = document.getElementById('storedCount') as HTMLElement;
const clearDataButton = document.getElementById('clearData') as HTMLButtonElement;
const messageArea = document.getElementById('messageArea') as HTMLElement;

/**
 * Show a message to the user
 */
function showMessage(text: string, type: 'success' | 'error'): void {
  const message = document.createElement('div');
  message.className = `message ${type}`;
  message.textContent = text;
  messageArea.appendChild(message);

  setTimeout(() => {
    message.remove();
  }, 5000);
}

/**
 * Update connection status display
 */
function updateConnectionStatus(connected: boolean, url: string): void {
  if (connected) {
    statusDot.classList.add('connected');
    statusText.textContent = `Connected to ${url}`;
  } else {
    statusDot.classList.remove('connected');
    statusText.textContent = url ? `Not connected to ${url}` : 'Not configured';
  }
}

/**
 * Update stored count display
 */
function updateStoredCount(count: number): void {
  storedCountElement.textContent = count.toString();
}

/**
 * Load configuration and status
 */
async function loadConfig(): Promise<void> {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_CONFIG' });

    if (response.success) {
      const { config, status } = response.data;

      // Update form
      vttUrlInput.value = config.vttUrl || '';
      autoSendCheckbox.checked = config.autoSend || false;

      // Update status
      updateConnectionStatus(status.connected, status.url);
    }
  } catch (error) {
    console.error('Error loading config:', error);
    showMessage('Failed to load configuration', 'error');
  }
}

/**
 * Load stored data count
 */
async function loadStoredCount(): Promise<void> {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_STORED_DATA' });

    if (response.success) {
      updateStoredCount(response.data.length);
    }
  } catch (error) {
    console.error('Error loading stored count:', error);
  }
}

/**
 * Save configuration
 */
async function saveConfig(): Promise<void> {
  try {
    saveConfigButton.disabled = true;
    saveConfigButton.textContent = 'Saving...';

    const config: VTTBridgeConfig = {
      vttUrl: vttUrlInput.value.trim(),
      autoSend: autoSendCheckbox.checked,
    };

    // Validate URL
    if (config.vttUrl && !isValidUrl(config.vttUrl)) {
      showMessage('Please enter a valid URL', 'error');
      return;
    }

    const response = await chrome.runtime.sendMessage({
      type: 'SET_CONFIG',
      config,
    });

    if (response.success) {
      showMessage('Configuration saved successfully', 'success');
      // Reload to update status
      await loadConfig();
    } else {
      showMessage(response.error || 'Failed to save configuration', 'error');
    }
  } catch (error) {
    console.error('Error saving config:', error);
    showMessage('Failed to save configuration', 'error');
  } finally {
    saveConfigButton.disabled = false;
    saveConfigButton.textContent = 'Save Configuration';
  }
}

/**
 * Clear all stored data
 */
async function clearData(): Promise<void> {
  if (!confirm('Are you sure you want to clear all stored data?')) {
    return;
  }

  try {
    clearDataButton.disabled = true;
    clearDataButton.textContent = 'Clearing...';

    const response = await chrome.runtime.sendMessage({ type: 'CLEAR_STORED_DATA' });

    if (response.success) {
      showMessage('All data cleared successfully', 'success');
      updateStoredCount(0);
    } else {
      showMessage(response.error || 'Failed to clear data', 'error');
    }
  } catch (error) {
    console.error('Error clearing data:', error);
    showMessage('Failed to clear data', 'error');
  } finally {
    clearDataButton.disabled = false;
    clearDataButton.textContent = 'Clear All Data';
  }
}

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Initialize the popup
 */
async function init(): Promise<void> {
  // Load initial data
  await Promise.all([loadConfig(), loadStoredCount()]);

  // Set up event listeners
  saveConfigButton.addEventListener('click', saveConfig);
  clearDataButton.addEventListener('click', clearData);

  // Auto-save on Enter key in URL input
  vttUrlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      saveConfig();
    }
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
