"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Check, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "info" | "error";

type Toast = {
  id: number;
  message: string;
  variant: ToastVariant;
  action?: { label: string; onClick: () => void };
};

type ToastContextValue = {
  toast: (
    message: string,
    options?: { variant?: ToastVariant; action?: Toast["action"] },
  ) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const AUTO_DISMISS_MS = 4500;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback<ToastContextValue["toast"]>((message, options) => {
    const id = ++nextId.current;
    setToasts((current) => [
      ...current.slice(-2),
      { id, message, variant: options?.variant ?? "success", action: options?.action },
    ]);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 left-1/2 z-[100] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4 sm:bottom-6"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={cn(
        "pointer-events-auto flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm shadow-lg backdrop-blur",
        "animate-fade-up border-stone-200 bg-white/95 text-stone-800 dark:border-stone-700 dark:bg-stone-900/95 dark:text-stone-100",
        toast.variant === "error" &&
          "border-red-200 bg-red-50/95 text-red-800 dark:border-red-900 dark:bg-red-950/95 dark:text-red-200",
      )}
    >
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
          toast.variant === "success" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
          toast.variant === "info" && "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
          toast.variant === "error" && "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
        )}
      >
        {toast.variant === "success" ? <Check className="h-3 w-3" /> : <Info className="h-3 w-3" />}
      </span>
      <span className="min-w-0 flex-1">{toast.message}</span>
      {toast.action ? (
        <button
          type="button"
          onClick={() => {
            toast.action!.onClick();
            onDismiss();
          }}
          className="shrink-0 font-semibold text-violet-700 hover:underline dark:text-violet-300"
        >
          {toast.action.label}
        </button>
      ) : null}
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={onDismiss}
        className="shrink-0 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
