/** Matches `{{` optionally followed by partial variable name at end of text. */
export const QUILL_MERGE_TAG_TRIGGER_RE = /\{\{[a-z_]*$/i;

type QuillEditor = {
  getSelection: (focus?: boolean) => { index: number; length: number } | null;
  getText: (index?: number, length?: number) => string;
  deleteText: (
    index: number,
    length: number,
    source?: string,
  ) => void;
  insertText: (
    index: number,
    text: string,
    source?: string,
  ) => void;
  setSelection: (index: number, length: number) => void;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  off: (event: string, handler: (...args: unknown[]) => void) => void;
};

export type QuillMergeTagTriggerState = {
  active: boolean;
  filter: string;
};

export function getQuillMergeTagTriggerState(
  editor: QuillEditor,
): QuillMergeTagTriggerState {
  const sel = editor.getSelection(true);
  if (!sel) return { active: false, filter: "" };
  const textBefore = editor.getText(0, sel.index);
  const match = textBefore.match(/\{\{([a-z_]*)$/i);
  if (!match) return { active: false, filter: "" };
  return { active: true, filter: match[1] || "" };
}

export function isQuillMergeTagTriggerActive(editor: QuillEditor): boolean {
  return getQuillMergeTagTriggerState(editor).active;
}

/** Replace a partial `{{` trigger (or insert at cursor) with a full merge tag. */
export function insertMergeTagInQuill(editor: QuillEditor, tag: string): void {
  const sel = editor.getSelection(true);
  if (!sel) return;

  const cursorIndex = sel.index;
  const textBeforeCursor = editor.getText(0, cursorIndex);
  const match = textBeforeCursor.match(/\{\{([a-z_]*)$/i);

  if (match) {
    const deleteLen = match[0].length;
    const insertAt = cursorIndex - deleteLen;
    editor.deleteText(insertAt, deleteLen, "user");
    editor.insertText(insertAt, tag, "user");
    editor.setSelection(insertAt + tag.length, 0);
    return;
  }

  editor.insertText(cursorIndex, tag, "user");
  editor.setSelection(cursorIndex + tag.length, 0);
}

/**
 * Wire Quill native events for merge-tag autocomplete.
 * ReactQuill's onChange runs after selection is cleared — use text-change instead.
 */
export function bindQuillMergeTagListeners(
  editor: QuillEditor,
  onTriggerChange: (state: QuillMergeTagTriggerState) => void,
): () => void {
  let dismissTimer: ReturnType<typeof setTimeout> | null = null;

  const sync = () => {
    requestAnimationFrame(() => {
      onTriggerChange(getQuillMergeTagTriggerState(editor));
    });
  };

  const onSelectionChange = (range: { index: number; length: number } | null) => {
    if (dismissTimer) {
      clearTimeout(dismissTimer);
      dismissTimer = null;
    }
    if (!range) {
      dismissTimer = setTimeout(
        () => onTriggerChange({ active: false, filter: "" }),
        150,
      );
      return;
    }
    sync();
  };

  editor.on("text-change", sync);
  editor.on("selection-change", onSelectionChange);

  return () => {
    if (dismissTimer) clearTimeout(dismissTimer);
    editor.off("text-change", sync);
    editor.off("selection-change", onSelectionChange);
  };
}
