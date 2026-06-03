"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import {
  Bold, Italic, Strikethrough, List, ListOrdered,
  Heading2, Heading3, Quote, Undo, Redo, Minus,
} from "lucide-react";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  maxChars?: number;
  minHeight?: number;
  readOnly?: boolean;
}

function ToolBtn({ onClick, active, title, children }: {
  onClick: () => void; active?: boolean; title: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      title={title}
      className={`p-1.5 rounded-md transition-colors ${active
        ? "bg-green-100 text-green-700"
        : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({ value, onChange, placeholder, maxChars = 10_000, minHeight = 200, readOnly = false }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: placeholder ?? "Start typing…" }),
      CharacterCount.configure({ limit: maxChars }),
    ],
    content: value,
    editable: !readOnly,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) return null;

  const charCount = editor.storage.characterCount?.characters() ?? 0;
  const pct       = Math.round((charCount / maxChars) * 100);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500 transition-all">
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-slate-100 bg-slate-50">
          <ToolBtn title="Undo"      onClick={() => editor.chain().focus().undo().run()}><Undo className="h-3.5 w-3.5" /></ToolBtn>
          <ToolBtn title="Redo"      onClick={() => editor.chain().focus().redo().run()}><Redo className="h-3.5 w-3.5" /></ToolBtn>
          <span className="w-px h-4 bg-slate-200 mx-1" />
          <ToolBtn title="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            <Heading2 className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
            <Heading3 className="h-3.5 w-3.5" />
          </ToolBtn>
          <span className="w-px h-4 bg-slate-200 mx-1" />
          <ToolBtn title="Bold"      active={editor.isActive("bold")}          onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-3.5 w-3.5" /></ToolBtn>
          <ToolBtn title="Italic"    active={editor.isActive("italic")}        onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-3.5 w-3.5" /></ToolBtn>
          <ToolBtn title="Strike"    active={editor.isActive("strike")}        onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="h-3.5 w-3.5" /></ToolBtn>
          <span className="w-px h-4 bg-slate-200 mx-1" />
          <ToolBtn title="Bullet list"   active={editor.isActive("bulletList")}   onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="h-3.5 w-3.5" /></ToolBtn>
          <ToolBtn title="Ordered list"  active={editor.isActive("orderedList")}  onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-3.5 w-3.5" /></ToolBtn>
          <ToolBtn title="Blockquote"    active={editor.isActive("blockquote")}   onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="h-3.5 w-3.5" /></ToolBtn>
          <ToolBtn title="Divider"       onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus className="h-3.5 w-3.5" /></ToolBtn>
        </div>
      )}

      {/* Editor area */}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none px-3 py-2.5 focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-slate-400 [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0"
        style={{ minHeight }}
      />

      {/* Character count */}
      {!readOnly && (
        <div className="px-3 py-1.5 border-t border-slate-100 bg-slate-50 flex justify-end">
          <span className={`text-[10px] font-medium tabular-nums ${pct > 90 ? "text-red-500" : pct > 75 ? "text-amber-500" : "text-slate-400"}`}>
            {charCount.toLocaleString()} / {maxChars.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}
