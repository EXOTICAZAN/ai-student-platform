// Hand-off channel between the tutor landing composer and ChatInput:
// the opening message is stashed here so it survives the navigation
// without ending up in the URL (where a refresh would re-send it).
export const PENDING_PROMPT_KEY = "eduforge.tutor.pendingPrompt";

export function stashPendingPrompt(chatId: string, prompt: string): void {
  try {
    sessionStorage.setItem(PENDING_PROMPT_KEY, JSON.stringify({ chatId, prompt }));
  } catch {
    // Private-mode browsers can throw on sessionStorage; the user can retype.
  }
}

export function takePendingPrompt(chatId: string): string | null {
  try {
    const raw = sessionStorage.getItem(PENDING_PROMPT_KEY);
    if (!raw) return null;

    sessionStorage.removeItem(PENDING_PROMPT_KEY);

    const parsed = JSON.parse(raw) as { chatId?: string; prompt?: string };
    if (parsed.chatId !== chatId || !parsed.prompt) return null;

    return parsed.prompt;
  } catch {
    return null;
  }
}
