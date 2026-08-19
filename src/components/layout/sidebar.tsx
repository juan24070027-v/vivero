"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Sprout,
  Trees,
  Beaker,
  Users as UsersIcon,
  FileSpreadsheet,
  History,
  Users,
  DatabaseBackup,
  Menu,
  X,
  LogOut,
  BarChart3,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/lib/actions/auth";
import type { Profile } from "@/lib/types";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  { label: "General", items: [{ href: "/dashboard", label: "Panel", icon: LayoutDashboard }, { href: "/estadisticas", label: "Estadísticas", icon: BarChart3 }] },
  {
    label: "Catálogo",
    items: [
      { href: "/semillas", label: "Semillas", icon: Sprout },
      { href: "/plantas", label: "Plantas", icon: Trees },
      { href: "/fertilizantes", label: "Fertilizantes", icon: Beaker },
      { href: "/clientes", label: "Clientes", icon: UsersIcon },
    ],
  },
  {
    label: "Cotizaciones",
    items: [
      { href: "/cotizaciones/nueva/semillas", label: "Cotizar semillas", icon: FileSpreadsheet },
      { href: "/cotizaciones/nueva/plantas", label: "Cotizar plantas", icon: FileSpreadsheet },
      { href: "/cotizaciones/nueva/fertilizantes", label: "Cotizar fertilizantes", icon: FileSpreadsheet },
      { href: "/cotizaciones", label: "Historial", icon: History },
    ],
  },
];

const SUPERADMIN_GROUP: NavGroup = {
  label: "Administración",
  items: [
    { href: "/usuarios", label: "Usuarios", icon: Users },
    { href: "/base-de-datos", label: "Base de datos", icon: DatabaseBackup },
  ],
};

export function Sidebar({ profile, onOpenSearch }: { profile: Profile; onOpenSearch?: () => void }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const groups = profile.role === "superadmin" ? [...NAV_GROUPS, SUPERADMIN_GROUP] : NAV_GROUPS;

  const content = (
    <>
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-forest-800/60 shrink-0">
        <Image src="/logo.png" alt="" width={32} height={24} className="object-contain shrink-0" />
        <span className="font-display text-base text-white truncate">Vivero Chaka</span>
      </div>

      <div className="px-3 pt-3">
        <button
          type="button"
          onClick={() => {
            setMobileOpen(false);
            onOpenSearch?.();
          }}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-forest-300 bg-forest-800/50 hover:bg-forest-800 transition-colors"
        >
          <Search size={16} />
          <span className="flex-1 text-left">Buscar…</span>
          <kbd className="hidden sm:inline text-[10px] border border-forest-600 rounded px-1.5 py-0.5 text-forest-400">⌘K</kbd>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1.5 text-[11px] font-medium uppercase tracking-wider text-forest-400">{group.label}</p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active ? "bg-forest-700 text-white" : "text-forest-200 hover:bg-forest-800 hover:text-white"
                    )}
                  >
                    <Icon size={18} className="shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-forest-800/60 shrink-0">
        <div className="px-3 py-2 mb-1">
          <p className="text-sm text-white truncate">{profile.full_name || profile.email}</p>
          <p className="text-xs text-forest-300 capitalize">{profile.role}</p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-forest-200 hover:bg-forest-800 hover:text-white transition-colors"
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </form>
      </div>
    </>
  );

  return (
    <>
      <header className="lg:hidden flex items-center justify-between h-14 px-4 bg-forest-900 text-white sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="" width={26} height={20} className="object-contain" />
          <span className="font-display text-sm">Vivero Chaka</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onOpenSearch} aria-label="Buscar" className="p-2">
            <Search size={20} />
          </button>
          <button onClick={() => setMobileOpen(true)} aria-label="Abrir menú" className="p-2 -mr-2">
            <Menu size={22} />
          </button>
        </div>
      </header>

      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-forest-900 h-screen sticky top-0">{content}</aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-forest-950/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex flex-col w-72 bg-forest-900 h-full">
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Cerrar menú"
              className="absolute top-4 right-4 text-forest-200 p-1"
            >
              <X size={20} />
            </button>
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
