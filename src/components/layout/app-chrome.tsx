"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { CommandPalette } from "./command-palette";
import type { Profile } from "@/lib/types";

export function AppChrome({ profile, children }: { profile: Profile; children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar profile={profile} onOpenSearch={() => setSearchOpen(true)} />
      <div className="flex-1 min-w-0 flex flex-col">{children}</div>
      {searchOpen && <CommandPalette onClose={() => setSearchOpen(false)} />}
    </div>
  );
}
