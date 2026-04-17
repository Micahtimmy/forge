"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { toastVariants } from "@/lib/motion/variants";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => string;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// Shorthand hooks
export function useToastActions() {
  const { addToast } = useToast();

  return {
    success: (title: string, description?: string) =>
      addToast({ type: "success", title, description }),
    error: (title: string, description?: string) =>
      addToast({ type: "error", title, description }),
    warning: (title: string, description?: string) =>
      addToast({ type: "warning", title, description }),
    info: (title: string, description?: string) =>
      addToast({ type: "info", title, description }),
  };
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="w-5 h-5 text-jade" />,
  error: <AlertCircle className="w-5 h-5 text-coral" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber" />,
  info: <Info className="w-5 h-5 text-sky" />,
};

const borderColors: Record<ToastType, string> = {
  success: "border-l-jade",
  error: "border-l-coral",
  warning: "border-l-amber",
  info: "border-l-sky",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    // Auto-remove after duration (default 4s)
    const duration = toast.duration ?? 4000;
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: Toast[];
  removeToast: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            variants={toastVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              "pointer-events-auto",
              "bg-surface-02 border border-border rounded-lg shadow-lg",
              "border-l-[3px]",
              borderColors[toast.type]
            )}
          >
            <div className="flex items-start gap-3 p-4">
              <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary">
                  {toast.title}
                </p>
                {toast.description && (
                  <p className="text-sm text-text-secondary mt-1">
                    {toast.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 p-1 rounded text-text-tertiary hover:text-text-primary hover:bg-surface-03 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
