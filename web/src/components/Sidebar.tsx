"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/graph", label: "Graph Explorer" },
  { href: "/query", label: "AI Query" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-56 border-r border-zinc-800/60 bg-zinc-950 flex flex-col">
      <div className="px-5 py-6 border-b border-zinc-800/60">
        <h1 className="text-sm font-semibold tracking-widest uppercase text-zinc-100">
          ContextCore
        </h1>
        <p className="mt-1 text-[11px] tracking-wide text-zinc-500">
          Supply Chain Intelligence
        </p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                block px-3 py-2 text-[13px] font-medium rounded transition-colors
                ${
                  active
                    ? "bg-zinc-800 text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
                }
              `}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-zinc-800/60">
        <p className="text-[10px] tracking-wide text-zinc-600 uppercase">
          Neo4j AuraDB
        </p>
        <div className="mt-1 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="text-[11px] text-zinc-500">Connected</span>
        </div>
      </div>
    </aside>
  );
}
