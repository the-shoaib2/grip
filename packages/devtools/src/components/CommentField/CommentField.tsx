import { useEffect, useMemo, useRef } from "preact/hooks";
import {
  bindChipTooltipRoot,
  bindEditorClipboard,
  chipMetaFromElement,
  focusEditor,
  handleEditorKeydown,
  INLINE_EDITOR_CLASS,
  isEditorEmpty,
  selectChipElement,
  serializeEditor,
  setEditorFromComment,
  type InlineChipRef,
} from "../../lib";

interface CommentFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Full chip metadata — same shape as the extension picker composer. */
  chips?: InlineChipRef[];
  tagName?: string;
  role?: string;
  css?: string;
  xpath?: string;
  innerText?: string;
  name?: string;
  rect?: { top: number; left: number; width: number; height: number };
  shadowDOM?: boolean;
  iframe?: string;
  tags?: string[];
  maxHeight?: number;
  onChipActivate?: () => void;
  readOnly?: boolean;
  /** Focus the editor with the caret at the end when this key changes. */
  autoFocusKey?: string;
}

export function CommentField({
  value,
  onChange,
  placeholder = "Describe what you need…",
  chips,
  tagName,
  role,
  css,
  xpath,
  innerText,
  name,
  rect,
  shadowDOM,
  iframe,
  tags,
  maxHeight = 160,
  onChipActivate,
  readOnly = false,
  autoFocusKey,
}: CommentFieldProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastEmitted = useRef(value);

  const chipRefs = useMemo<InlineChipRef[]>(() => {
    if (chips?.length) return chips;
    if (tags?.length) {
      return tags.map((tag, index) => ({ id: `static-${index}`, tag }));
    }
    if (tagName) {
      const primary = tagName.toLowerCase();
      const refs: InlineChipRef[] = [
        {
          id: "static-0",
          tag: primary,
          role: role?.toLowerCase(),
          css,
          xpath,
          text: innerText,
          name,
          rect,
          shadowDOM,
          iframe,
        },
      ];
      if (role && role.toLowerCase() !== primary) {
        refs.push({ id: "static-1", tag: role.toLowerCase() });
      }
      return refs;
    }
    return [];
  }, [chips, tagName, role, css, xpath, innerText, name, rect, shadowDOM, iframe, tags]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || readOnly) return;

    const onInput = () => {
      const next = serializeEditor(editor);
      lastEmitted.current = next;
      onChange(next);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      handleEditorKeydown(editor, e, () => onInput());
    };

    editor.addEventListener("input", onInput);
    editor.addEventListener("keydown", onKeyDown);
    const unbindTooltip = bindChipTooltipRoot(editor, (chip) => chipMetaFromElement(chip));
    const unbindClipboard = bindEditorClipboard(editor);

    return () => {
      editor.removeEventListener("input", onInput);
      editor.removeEventListener("keydown", onKeyDown);
      unbindTooltip();
      unbindClipboard();
    };
  }, [onChange, readOnly]);

  useEffect(() => {
    if (!autoFocusKey || readOnly) return;
    const editor = editorRef.current;
    if (!editor) return;
    const frame = requestAnimationFrame(() => {
      focusEditor(editor, { caret: "end" });
    });
    return () => cancelAnimationFrame(frame);
  }, [autoFocusKey, readOnly]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (value === lastEmitted.current && !isEditorEmpty(editor)) return;
    setEditorFromComment(editor, value, chipRefs);
    lastEmitted.current = value;
  }, [value, chipRefs]);

  return (
    <div className={`grip-context-field${readOnly ? " grip-context-readonly" : ""}`}>
      <div
        className="grip-context-composer"
        style={{ maxHeight: `${maxHeight}px` }}
        onMouseDown={(e) => {
          const target = e.target as HTMLElement;
          const chip = target.closest<HTMLElement>(".grip-inline-chip");
          if (chip) {
            e.preventDefault();
            e.stopPropagation();
            if (!readOnly) selectChipElement(chip);
            onChipActivate?.();
            return;
          }
          if (readOnly) return;
          const editor = editorRef.current!;
          const clickedInEditor = editor.contains(target) && target !== editor;
          focusEditor(editor, { caret: clickedInEditor ? "preserve" : "end" });
        }}
      >
        <div
          ref={editorRef}
          className={INLINE_EDITOR_CLASS}
          contentEditable={!readOnly}
          role="textbox"
          aria-multiline="true"
          aria-readonly={readOnly ? "true" : undefined}
          data-placeholder={placeholder}
        />
      </div>
    </div>
  );
}
