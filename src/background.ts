/* global chrome */
import type { ContextMenuInfo, Tab, Result } from './types.js';
import {
  MENU_ID,
  MENU_TITLE,
  FILE_PREFIX,
  FILE_EXTENSION,
  MIME_TYPE,
} from './constants.js';
import { validateSelectionText, validateFilename } from './validation.js';

/**
 * Formats a Date into a filesystem-safe timestamp string by replacing
 * colons and periods with hyphens.
 *
 * @param date - The date to format
 * @returns ISO 8601 string with special chars replaced
 */
export function formatTimestamp(date: Date): string {
  return date.toISOString().replace(/[:.]/g, '-');
}

/**
 * Creates a validated filename by combining prefix, timestamp, and
 * extension, then checking for filesystem safety.
 *
 * @param prefix - Filename prefix (e.g., "selection-")
 * @param timestamp - Formatted timestamp string
 * @returns Result with filename or validation error
 */
export function createFilename(
  prefix: string,
  timestamp: string,
): Result<string> {
  const filename = `${prefix}${timestamp}${FILE_EXTENSION}`;
  return validateFilename(filename);
}

/**
 * Initiates a download via Chrome downloads API using data URL.
 * Service workers don't support URL.createObjectURL, so we convert
 * the blob to a data URL via FileReader.
 *
 * @param text - Text content to download
 * @param filename - Name for the downloaded file
 * @returns Result with download ID or error details
 */
export async function downloadFile(
  text: string,
  filename: string,
): Promise<Result<number>> {
  try {
    const blob = new Blob([text], { type: MIME_TYPE });
    const reader = new FileReader();

    const dataUrl = await new Promise<string>((resolve, reject) => {
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    const downloadId = await chrome.downloads.download({
      url: dataUrl,
      filename,
      saveAs: false,
    });

    return { success: true, value: downloadId };
  } catch (error) {
    return {
      success: false,
      error: {
        type: 'DOWNLOAD_FAILED',
        message:
          error instanceof Error ? error.message : 'Unknown download error',
      },
    };
  }
}

/**
 * Handles context menu click events. Validates selected text, creates
 * a timestamped file, and downloads it. Logs errors but does not throw.
 *
 * @param info - Context menu click event data
 * @param _tab - Tab where click occurred (unused)
 */
export async function handleContextMenuClick(
  info: ContextMenuInfo,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _tab?: Tab,
): Promise<void> {
  if (info.menuItemId !== MENU_ID) {
    return;
  }

  const validationResult = validateSelectionText(info.selectionText);
  if (!validationResult.success) {
    console.error('Validation failed:', validationResult.error.message);
    return;
  }

  const text = validationResult.value;
  const timestamp = formatTimestamp(new Date());
  const filenameResult = createFilename(FILE_PREFIX, timestamp);

  if (!filenameResult.success) {
    console.error('Filename creation failed');
    return;
  }

  const downloadResult = await downloadFile(text, filenameResult.value);

  if (!downloadResult.success) {
    console.error('Download failed:', downloadResult.error.message);
  }
}

/**
 * Initializes the extension's context menu. Creates a menu item that
 * appears when text is selected. Logs errors without throwing.
 */
export function initializeContextMenu(): void {
  try {
    chrome.contextMenus.create({
      id: MENU_ID,
      title: MENU_TITLE,
      contexts: ['selection'],
    });
  } catch (error) {
    console.error(
      'Failed to create context menu:',
      error instanceof Error ? error.message : 'Unknown error',
    );
  }
}

chrome.runtime.onInstalled.addListener(initializeContextMenu);
chrome.contextMenus.onClicked.addListener((info, tab) => {
  void handleContextMenuClick(info, tab);
});
