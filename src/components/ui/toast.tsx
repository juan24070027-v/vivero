"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastItem {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastContextValue {
  show: (message: string, type?: ToastItem["type"]) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}

const ICONS = { success: CheckCircle2, error: XCircle, info: Info };
const TONES = {
  success: "bg-forest-800 text-white",
  error: "bg-red-600 text-white",
  info: "bg-stone-800 text-white",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, type: ToastItem["type"] = "success") => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => dismiss(id), 4500);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-[100] flex flex-col gap-2 sm:max-w-sm pointer-events-none">
        {toasts.map((t) => {
          const Icon = ICONS[t.type];
          return (
            <div
              key={t.id}
              className={cn(
                "animate-toast-in pointer-events-auto flex items-start gap-2.5 rounded-xl px-4 py-3 shadow-lg text-sm",
                TONES[t.type]
              )}
            >
              <Icon size={18} className="shrink-0 mt-0.5" />
              <p className="flex-1">{t.message}</p>
              <button onClick={() => dismiss(t.id)} className="shrink-0 opacity-70 hover:opacity-100">
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
