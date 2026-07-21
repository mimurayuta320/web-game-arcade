const DEFAULT_BACK_TO_MENU_MESSAGE = "ゲーム一覧に戻りますか？";

export function bindBackToMenuButton(button, onConfirmed, message = DEFAULT_BACK_TO_MENU_MESSAGE) {
  button?.addEventListener("click", () => {
    const confirmed = window.confirm(message);
    if (!confirmed) return;
    onConfirmed?.();
  });
}
