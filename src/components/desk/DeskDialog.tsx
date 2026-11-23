"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** A small dialog in the site's paper style (replaces the browser's grey confirm() box). */
export default function DeskDialog({
  open,
  title,
  children,
  onClose,
  actions,
  labelledBy = "desk-dialog-title",
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  actions?: ReactNode;
  labelledBy?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="desk-dialog"
      aria-labelledby={labelledBy}
      onClose={onClose}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="desk-dialog-card">
        <h2 id={labelledBy} className="m-0 font-mono text-[22px] font-normal">{title}</h2>
        <div className="text-[15px] leading-relaxed text-body">{children}</div>
        {actions && <div className="mt-2 flex flex-wrap justify-end gap-2">{actions}</div>}
      </div>
    </dialog>
  );
}
