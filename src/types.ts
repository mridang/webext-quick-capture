/**
 * @file Shared types for the background worker, including the extension's result and error shapes.
 */

// eslint-disable-next-line @typescript-eslint/no-deprecated -- the chrome namespace in @types/chrome is flagged as Chrome Apps platform, but extensions use it; the preset's allow entry does not cover namespace references
export type ContextMenuInfo = chrome.contextMenus.OnClickData;

// eslint-disable-next-line @typescript-eslint/no-deprecated -- the chrome namespace in @types/chrome is flagged as Chrome Apps platform, but extensions use it; the preset's allow entry does not cover namespace references
export type Tab = chrome.tabs.Tab;

type ExtensionError =
  | { readonly type: 'CAPTURE_FAILED'; readonly message: string }
  | { readonly type: 'CLIPBOARD_FAILED'; readonly message: string }
  | { readonly type: 'MENU_CREATION_FAILED'; readonly message: string };

export type Result<T, E = ExtensionError> =
  | { readonly success: true; readonly value: T }
  | { readonly success: false; readonly error: E };
