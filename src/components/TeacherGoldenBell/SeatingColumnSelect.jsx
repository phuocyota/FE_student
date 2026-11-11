import React, { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, LayoutGrid } from "lucide-react";

export default function SeatingColumnSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(value);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const listRef = useRef(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    listRef.current?.focus();
    const handleOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", handleOutside);
    return () => document.removeEventListener("pointerdown", handleOutside);
  }, [open]);

  const choose = (count) => {
    onChange(count);
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div ref={rootRef} className="relative" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }}>
      <button ref={triggerRef} type="button" aria-label={`Số cột: ${value}`} aria-haspopup="listbox" aria-expanded={open} aria-controls={`${id}-list`} onClick={() => { setActive(value); setOpen(!open); }} onKeyDown={(event) => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          setActive(value);
          setOpen(true);
        }
      }} className={`inline-flex min-w-36 items-center justify-between gap-3 rounded-xl border bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-800 shadow-sm transition hover:border-green-400 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 ${open ? "border-green-500 ring-2 ring-green-100" : "border-gray-200"}`}>
        <LayoutGrid size={17} className="text-green-600" aria-hidden="true" />
        <span>{value} cột</span>
        <ChevronDown size={16} aria-hidden="true" className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div ref={listRef} id={`${id}-list`} role="listbox" aria-label="Số cột" aria-activedescendant={`${id}-${active}`} tabIndex={0} onKeyDown={(event) => {
          if (["ArrowDown", "ArrowUp", "Home", "End", "Enter", " ", "Escape"].includes(event.key)) event.preventDefault();
          if (event.key === "ArrowDown") setActive((count) => Math.min(8, count + 1));
          if (event.key === "ArrowUp") setActive((count) => Math.max(1, count - 1));
          if (event.key === "Home") setActive(1);
          if (event.key === "End") setActive(8);
          if (event.key === "Enter" || event.key === " ") choose(active);
          if (event.key === "Escape") {
            event.stopPropagation();
            setOpen(false);
            triggerRef.current?.focus();
          }
        }} className="absolute left-0 top-full z-20 mt-2 w-44 rounded-xl border border-gray-100 bg-white p-1.5 shadow-xl shadow-gray-200/70 outline-none">
          {Array.from({ length: 8 }, (_, index) => index + 1).map((count) => (
            <div key={count} id={`${id}-${count}`} role="option" aria-selected={value === count} onPointerMove={() => setActive(count)} onMouseDown={(event) => event.preventDefault()} onClick={() => choose(count)} className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${value === count ? "bg-green-50 font-semibold text-green-700" : "text-gray-600"} ${active === count ? "bg-green-50 ring-1 ring-inset ring-green-200" : ""}`}>
              <span>{count} cột</span>
              {value === count && <Check size={16} strokeWidth={2.5} aria-hidden="true" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
