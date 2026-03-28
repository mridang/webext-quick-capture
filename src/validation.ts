import type { Tab, Result } from './types.js';

export const validateTab = (
  tab: Tab | undefined,
): Result<Tab & { id: number }> => {
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

  return { success: true, value: tab as Tab & { id: number } };
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
