"use client";

import { useState, useRef, useEffect } from "react";

interface QueryResult {
  answer: string;
  cypher: string;
  results: Record<string, unknown>[];
  resultCount: number;
  error?: string;
}

interface HistoryEntry {
  question: string;
  result: QueryResult | null;
  error: string | null;
  loading: boolean;
}

const EXAMPLE_QUESTIONS = [
  "Which suppliers have the highest defect rates?",
  "What products are stored in the West Coast Depot?",
  "How many orders are currently in transit?",
  "Which warehouse fulfills the most orders?",
  "What is the average order value for critical priority orders?",
  "Which suppliers provide electronics products?",
];

export default function QueryPage() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  async function handleSubmit(question?: string) {
    const q = (question || input).trim();
    if (!q) return;

    setInput("");
    const entry: HistoryEntry = {
      question: q,
      result: null,
      error: null,
      loading: true,
    };
    setHistory((prev) => [...prev, entry]);
    const idx = history.length;

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });

      const data = await res.json();

      if (!res.ok) {
        setHistory((prev) => {
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            error: data.error || "Request failed",
            result: data.cypher ? { answer: "", cypher: data.cypher, results: [], resultCount: 0 } : null,
            loading: false,
          };
          return updated;
        });
        return;
      }

      setHistory((prev) => {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], result: data, loading: false };
        return updated;
      });
    } catch (err) {
      setHistory((prev) => {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          error: err instanceof Error ? err.message : "Network error",
          loading: false,
        };
        return updated;
      });
    }
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="border-b border-zinc-800/60 px-8 py-6">
        <h1 className="text-lg font-semibold text-zinc-100">AI Query</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Ask questions about your supply chain in natural language
        </p>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {history.length === 0 && (
          <div className="mx-auto max-w-2xl">
            <p className="mb-4 text-sm text-zinc-500">
              Try one of these questions to get started:
            </p>
            <div className="grid gap-2">
              {EXAMPLE_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSubmit(q)}
                  className="rounded border border-zinc-800/60 bg-zinc-900/50 px-4 py-3 text-left text-sm text-zinc-400 transition-colors hover:border-zinc-700/60 hover:bg-zinc-900/80 hover:text-zinc-300"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mx-auto max-w-2xl space-y-6">
          {history.map((entry, i) => (
            <div key={i} className="space-y-3">
              {/* Question */}
              <div className="flex justify-end">
                <div className="rounded border border-zinc-700/40 bg-zinc-800/60 px-4 py-2.5 text-sm text-zinc-200">
                  {entry.question}
                </div>
              </div>

              {/* Loading */}
              {entry.loading && (
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <Spinner />
                  <span>Generating query and fetching results...</span>
                </div>
              )}

              {/* Error */}
              {entry.error && (
                <div className="rounded border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-400">
                  {entry.error}
                </div>
              )}

              {/* Result */}
              {entry.result && (
                <div className="space-y-3">
                  {entry.result.answer && (
                    <div className="rounded border border-zinc-800/60 bg-zinc-900/50 px-4 py-3 text-sm leading-relaxed text-zinc-300">
                      {entry.result.answer}
                    </div>
                  )}

                  {entry.result.cypher && (
                    <CypherBlock cypher={entry.result.cypher} />
                  )}

                  {entry.result.resultCount > 0 && (
                    <p className="text-[11px] text-zinc-600">
                      {entry.result.resultCount} row{entry.result.resultCount !== 1 ? "s" : ""} returned
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-zinc-800/60 px-8 py-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="mx-auto flex max-w-2xl gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your supply chain..."
            className="flex-1 rounded border border-zinc-800/60 bg-zinc-900/50 px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-colors focus:border-zinc-600"
            disabled={history.some((h) => h.loading)}
          />
          <button
            type="submit"
            disabled={!input.trim() || history.some((h) => h.loading)}
            className="rounded border border-zinc-700/60 bg-zinc-800 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Query
          </button>
        </form>
      </div>
    </div>
  );
}

function CypherBlock({ cypher }: { cypher: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded border border-zinc-800/60 bg-zinc-950/50">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500 transition-colors hover:text-zinc-400"
      >
        <span>Generated Cypher</span>
        <span className="text-[10px]">{open ? "Hide" : "Show"}</span>
      </button>
      {open && (
        <pre className="border-t border-zinc-800/40 px-4 py-3 text-[12px] leading-relaxed text-emerald-400/80 overflow-x-auto">
          <code>{cypher}</code>
        </pre>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin text-zinc-500"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        className="opacity-20"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
