"use client";

export default function TypingCursor() {
  return (
    <div className="flex items-center gap-2 px-5 py-4">
      <div className="flex gap-1">
        <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400"></span>

        <span
          className="h-2 w-2 animate-bounce rounded-full bg-indigo-400"
          style={{
            animationDelay: "0.15s",
          }}
        ></span>

        <span
          className="h-2 w-2 animate-bounce rounded-full bg-indigo-400"
          style={{
            animationDelay: "0.3s",
          }}
        ></span>
      </div>

      <span className="text-sm text-slate-400">
        EduForge AI is thinking...
      </span>
    </div>
  );
}