/**
 * Content script injected into D&D Beyond pages
 */

import { extractContent, detectPageType } from '../utils/domExtractor.js';
import type { DDBExtractedData } from '../types/messages.js';

let importButton: HTMLElement | null = null;
let notification: HTMLElement | null = null;

/**
 * Show a notification to the user
 */
function showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
  // Remove existing notification
  if (notification) {
    notification.remove();
  }

  // Create notification element
  notification = document.createElement('div');
  notification.className = `vtt-notification vtt-notification--${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification) {
      notification.classList.add('vtt-notification--fade');
      setTimeout(() => notification?.remove(), 300);
    }
  }, 5000);
}

/**
 * Create and inject the "Import to VTT" button
 */
function createImportButton(): void {
  // Don't create if already exists
  if (importButton) {
    return;
  }

  const pageType = detectPageType();
  if (!pageType) {
    return;
  }

  importButton = document.createElement('button');
  importButton.className = 'vtt-import-button';
  importButton.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 0L0 8h5v8h6V8h5L8 0z"/>
    </svg>
    <span>Import to VTT</span>
  `;

  importButton.addEventListener('click', handleImportClick);

  // Find appropriate location to inject button based on page type
  let targetElement: Element | null = null;

  switch (pageType) {
    case 'character':
      targetElement = document.querySelector('.ct-character-header-desktop, .ddbc-character-header');
      break;
    case 'monster':
      targetElement = document.querySelector('.mon-stat-block__name-link, .mon-stat-block');
      break;
    case 'spell':
      targetElement = document.querySelector('.spell-details__header, .page-heading');
      break;
    case 'item':
      targetElement = document.querySelector('.item-details__header, .page-heading');
      break;
  }

  if (targetElement) {
    // Create container for button
    const container = document.createElement('div');
    container.className = 'vtt-import-button-container';
    container.appendChild(importButton);

    // Insert after target element
    targetElement.parentElement?.insertBefore(container, targetElement.nextSibling);
  } else {
    // Fallback: Add to top-right of page
    importButton.style.position = 'fixed';
    importButton.style.top = '80px';
    importButton.style.right = '20px';
    importButton.style.zIndex = '10000';
    document.body.appendChild(importButton);
  }
}

/**
 * Handle import button click
 */
async function handleImportClick(): Promise<void> {
  if (!importButton) return;

  // Disable button during extraction
  importButton.classList.add('vtt-import-button--loading');
  (importButton.querySelector('span') as HTMLElement).textContent = 'Extracting...';

  try {
    // Extract content from page
    const extractedData = await extractContent();

    if (!extractedData) {
      throw new Error('Failed to extract content');
    }

    // Send to background script
    const response = await chrome.runtime.sendMessage({
      type: 'EXTRACTION_COMPLETE',
      data: extractedData,
    });

    if (response?.success) {
      showNotification(`Successfully imported ${extractedData.type}!`, 'success');
    } else {
      throw new Error(response?.error || 'Failed to import');
    }
  } catch (error) {
    console.error('Import error:', error);
    showNotification(
      `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'error'
    );
  } finally {
    // Re-enable button
    importButton.classList.remove('vtt-import-button--loading');
    (importButton.querySelector('span') as HTMLElement).textContent = 'Import to VTT';
  }
}

/**
 * Initialize the content script
 */
function init(): void {
  // Wait for page to load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createImportButton);
  } else {
    createImportButton();
  }

  // Re-create button on navigation (SPA support)
  const observer = new MutationObserver(() => {
    if (!document.querySelector('.vtt-import-button')) {
      importButton = null;
      createImportButton();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// Start the content script
init();

console.log('VTT Content Importer: Content script loaded');
