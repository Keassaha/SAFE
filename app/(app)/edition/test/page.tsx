"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export default function EditorTestPage() {
  const tx = useTranslations("appExtraUi");
  const [keyLog, setKeyLog] = useState<string[]>([]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit],
    content: `<p>${tx("editorTestContent")}</p>`,
    editorProps: {
      attributes: {
        class:
          "focus:outline-none min-h-[400px] p-8 text-base leading-relaxed",
      },
      handleKeyDown: (_view, event) => {
        setKeyLog((prev) => [
          `${new Date().toLocaleTimeString()} → key="${event.key}" code="${event.code}" defaultPrevented=${event.defaultPrevented}`,
          ...prev.slice(0, 9),
        ]);
        return false;
      },
    },
  });

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">{tx("editorTestHeading")}</h1>
      <p className="text-sm text-zinc-600 mb-4">{tx("editorTestIntro")}</p>

      <div className="bg-white border border-zinc-300 rounded-lg shadow-sm">
        <EditorContent editor={editor} />
      </div>

      <h2 className="text-sm font-semibold mt-6 mb-2">{tx("editorTestKeyLogTitle")}</h2>
      <pre className="text-xs bg-zinc-900 text-zinc-100 p-3 rounded-lg overflow-auto max-h-48">
        {keyLog.length === 0 ? tx("editorTestKeyLogEmpty") : keyLog.join("\n")}
      </pre>

      <div className="mt-4 text-xs text-zinc-500">
        {tx("editorTestVersions")}
      </div>
    </div>
  );
}
