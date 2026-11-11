/**
 * @file Background service worker that captures the visible tab and copies the screenshot to the clipboard.
 */
import type { ContextMenuInfo, Tab, Result } from './types.js';
import {
  MENU_ID,
  MENU_TITLE,
  SOUND_PATH,
  OFFSCREEN_PATH,
  CAPTURE_FORMAT,
} from './constants.js';
import { validateTab, validateDataUrl } from './validation.js';

/**
 * A shared promise that stops concurrent calls from creating the offscreen document twice.
 */
let creating: Promise<void> | null;

/**
 * Sets up an offscreen document if one doesn't already exist.
 * @param path - The path to the offscreen document HTML file.
 * @example
 * ```ts
 * await setupOffscreenDocument('offscreen.html');
 * ```
 */
async function setupOffscreenDocument(path: string): Promise<void> {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
  });
  const hasOffscreenDocument = existingContexts.some((c) =>
    c.documentUrl?.endsWith(path),
  );

  if (hasOffscreenDocument) {
    return;
  }

  if (creating) {
    await creating;
  } else {
    creating = chrome.offscreen.createDocument({
      url: path,
      reasons: [chrome.offscreen.Reason.AUDIO_PLAYBACK],
      justification: 'To play a sound when a screenshot is taken',
    });
    await creating;
    creating = null;
  }
}

/**
 * Plays a sound using an offscreen document.
 * @param src - The path to the audio file.
 * @example
 * ```ts
 * await playSound('assets/camera-shutter-click-03.mp3');
 * ```
 */
async function playSound(src: string): Promise<void> {
  await setupOffscreenDocument(OFFSCREEN_PATH);
  void chrome.runtime.sendMessage({ type: 'PLAY_SOUND', src });
}

/**
 * Captures the visible tab as a PNG screenshot.
 * @param windowId - The window ID to capture.
 * @returns Result with the data URL or capture error.
 * @example
 * ```ts
 * const result = await captureScreenshot(windowId);
 * if (result.success) {
 *   console.log(result.value);
 * }
 * ```
 */
export async function captureScreenshot(
  windowId: number,
): Promise<Result<string>> {
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab(windowId, {
      format: CAPTURE_FORMAT,
    });
    return validateDataUrl(dataUrl);
  } catch (error) {
    return {
      success: false,
      error: {
        type: 'CAPTURE_FAILED',
        message:
          error instanceof Error ? error.message : 'Unknown capture error',
      },
    };
  }
}

/**
 * Injects and executes a script in the active tab to copy the image
 * data from a data URL to the clipboard.
 * @param tabId - The ID of the active tab.
 * @param dataUrl - The image to copy, encoded as a data URL.
 * @returns Result indicating success or clipboard error.
 * @example
 * ```ts
 * const result = await copyImageToClipboard(tabId, dataUrl);
 * if (!result.success) {
 *   console.error(result.error.message);
 * }
 * ```
 */
export async function copyImageToClipboard(
  tabId: number,
  dataUrl: string,
): Promise<Result<null>> {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: async (url: string) => {
        try {
          const response = await fetch(url);
          const blob = await response.blob();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any, n/no-unsupported-features/node-builtins -- navigator is a browser global in the injected page function.
          await (navigator as any).clipboard.write([
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ClipboardItem is a page global missing from the Node typings.
            new (globalThis as any).ClipboardItem({
              [blob.type]: blob,
            }),
          ]);
        } catch (error) {
          console.error('Failed to copy image:', error);
          throw error;
        }
      },
      args: [dataUrl],
    });
    return { success: true, value: null };
  } catch (error) {
    return {
      success: false,
      error: {
        type: 'CLIPBOARD_FAILED',
        message:
          error instanceof Error ? error.message : 'Unknown clipboard error',
      },
    };
  }
}

/**
 * Handles context menu click events. Captures the visible tab as a screenshot
 * and copies it to the clipboard.
 * @param info - Context menu click event data.
 * @param tab - The tab where the click occurred.
 * @example
 * ```ts
 * chrome.contextMenus.onClicked.addListener((info, tab) => {
 *   void handleContextMenuClick(info, tab);
 * });
 * ```
 */
export async function handleContextMenuClick(
  info: ContextMenuInfo,
  tab?: Tab,
): Promise<void> {
  if (info.menuItemId !== MENU_ID) {
    return;
  }

  const tabResult = validateTab(tab);
  if (!tabResult.success) {
    console.error('Validation failed:', tabResult.error.message);
    return;
  }

  const validTab = tabResult.value;
  const captureResult = await captureScreenshot(validTab.windowId);

  if (!captureResult.success) {
    console.error('Capture failed:', captureResult.error.message);
    return;
  }

  const clipboardResult = await copyImageToClipboard(
    validTab.id,
    captureResult.value,
  );

  if (!clipboardResult.success) {
    console.error('Clipboard failed:', clipboardResult.error.message);
  }

  await playSound(SOUND_PATH);
}

/**
 * Initializes the extension's context menu. Creates a menu item that
 * appears for any page. Logs errors without throwing.
 * @example
 * ```ts
 * chrome.runtime.onInstalled.addListener(initializeContextMenu);
 * ```
 */
export function initializeContextMenu(): void {
  try {
    chrome.contextMenus.create({
      id: MENU_ID,
      title: MENU_TITLE,
      contexts: ['all'],
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
