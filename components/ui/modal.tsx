"use client";

import { Fragment } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { overlayVariants, modalVariants } from "@/lib/motion/variants";

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  showClose?: boolean;
  className?: string;
}

const sizeStyles = {
  sm: "max-w-sm",
  md: "max-w-[520px]",
  lg: "max-w-[800px]",
  xl: "max-w-[1000px]",
};

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = "md",
  showClose = true,
  className,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                className={cn(
                  "fixed left-1/2 top-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2",
                  "bg-surface-02 border border-border-strong rounded-xl shadow-modal",
                  "focus:outline-none",
                  sizeStyles[size],
                  className
                )}
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {(title || showClose) && (
                  <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div>
                      {title && (
                        <Dialog.Title className="text-lg font-semibold text-text-primary">
                          {title}
                        </Dialog.Title>
                      )}
                      {description && (
                        <Dialog.Description className="text-sm text-text-secondary mt-1">
                          {description}
                        </Dialog.Description>
                      )}
                    </div>
                    {showClose && (
                      <Dialog.Close asChild>
                        <button
                          className="p-1.5 rounded-md text-text-tertiary hover:text-text-primary hover:bg-surface-03 transition-colors"
                          aria-label="Close"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </Dialog.Close>
                    )}
                  </div>
                )}
                <div className="p-6">{children}</div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

// Modal footer for action buttons
export function ModalFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-3 pt-4 mt-4 border-t border-border",
        className
      )}
    >
      {children}
    </div>
  );
}

// Confirm dialog shortcut
export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: "danger" | "default";
  isLoading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  variant = "default",
  isLoading,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title} size="sm">
      {description && (
        <p className="text-sm text-text-secondary">{description}</p>
      )}
      <ModalFooter>
        <button
          onClick={() => onOpenChange(false)}
          className="btn btn-ghost"
          disabled={isLoading}
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          className={cn("btn", variant === "danger" ? "btn-danger" : "btn-primary")}
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : confirmLabel}
        </button>
      </ModalFooter>
    </Modal>
  );
}
