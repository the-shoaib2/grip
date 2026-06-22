import { useEffect, useMemo, useRef } from "preact/hooks";
import {
  bindChipTooltipRoot,
  chipMetaFromElement,
  focusEditor,
  handleEditorKeydown,
  INLINE_EDITOR_CLASS,
  isEditorEmpty,
  serializeEditor,
  setEditorFromComment,
  type InlineChipRef,
} from "@/lib";

interface CommentFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  tagName?: string;
  role?: string;
  css?: string;
  innerText?: string;
  name?: string;
  tags?: string[];
  maxHeight?: number;
}

export function CommentField({
  value,
  onChange,
  placeholder = "Describe what you need…",
  tagName,
  role,
  css,
  innerText,
  name,
  tags,
  maxHeight = 160,
}: CommentFieldProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastEmitted = useRef(value);

  const chipRefs = useMemo<InlineChipRef[]>(() => {
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
          text: innerText,
          name,
        },
      ];
      if (role && role.toLowerCase() !== primary) {
        refs.push({ id: "static-1", tag: role.toLowerCase() });
      }
      return refs;
    }
    return [];
  }, [tagName, role, css, innerText, name, tags]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

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

    return () => {
      editor.removeEventListener("input", onInput);
      editor.removeEventListener("keydown", onKeyDown);
      unbindTooltip();
    };
  }, [onChange]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (value === lastEmitted.current && !isEditorEmpty(editor)) return;
    setEditorFromComment(editor, value, chipRefs);
    lastEmitted.current = value;
  }, [value, chipRefs]);

  return (
    <div className="grip-context-field">
      <div
        className="grip-context-composer"
        style={{ maxHeight: `${maxHeight}px` }}
        onMouseDown={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest(".grip-inline-chip")) {
            e.preventDefault();
            return;
          }
          focusEditor(editorRef.current!);
        }}
      >
        <div
          ref={editorRef}
          className={INLINE_EDITOR_CLASS}
          contentEditable
          role="textbox"
          aria-multiline="true"
          data-placeholder={placeholder}
        />
      </div>
    </div>
  );
}
