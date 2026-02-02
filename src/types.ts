/* global chrome */

export type ContextMenuInfo = chrome.contextMenus.OnClickData;

export type Tab = chrome.tabs.Tab;

type ExtensionError =
  | { readonly type: 'INVALID_SELECTION'; readonly message: string }
  | { readonly type: 'DOWNLOAD_FAILED'; readonly message: string }
  | { readonly type: 'MENU_CREATION_FAILED'; readonly message: string };

export type Result<T, E = ExtensionError> =
  | { readonly success: true; readonly value: T }
  | { readonly success: false; readonly error: E };
