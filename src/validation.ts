/**
 * @file Validators that turn raw browser capture inputs into typed results.
 */
import type { Result } from './types.js';

export const validateTab = (
  tab: chrome.tabs.Tab | undefined,
): Result<chrome.tabs.Tab & { id: number }> => {
  if (!tab) {
    return {
      success: false,
      error: {
        type: 'CAPTURE_FAILED',
        message: 'No active tab found',
      },
    };
  }

  if (tab.id === undefined) {
    return {
      success: false,
      error: {
        type: 'CAPTURE_FAILED',
        message: 'Tab ID is undefined',
      },
    };
  }

  return { success: true, value: { ...tab, id: tab.id } };
};

export const validateDataUrl = (
  dataUrl: string | undefined,
): Result<string> => {
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
    return {
      success: false,
      error: {
        type: 'CAPTURE_FAILED',
        message: 'Invalid data URL',
      },
    };
  }

  return { success: true, value: dataUrl };
};
