/**
 * @file Result and error types shared by the extension modules.
 */

type ExtensionError =
  | { readonly type: 'CAPTURE_FAILED'; readonly message: string }
  | { readonly type: 'CLIPBOARD_FAILED'; readonly message: string }
  | { readonly type: 'MENU_CREATION_FAILED'; readonly message: string };

export type Result<T, E = ExtensionError> =
  | { readonly success: true; readonly value: T }
  | { readonly success: false; readonly error: E };
