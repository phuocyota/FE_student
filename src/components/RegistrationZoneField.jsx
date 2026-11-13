import React, { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Loader2, MapPin, Search } from "lucide-react";

const searchable = (text) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLocaleLowerCase("vi").trim();

export default function RegistrationZoneField({ options, value, onChange, loading, disabled }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const triggerRef = useRef(null);
  const listRef = useRef(null);
  const selected = options.find((option) => option.id === value);
  const matches = options.filter((option) => searchable(option.name).includes(searchable(query)));
  const expanded = open && !disabled && !loading;

  useEffect(() => {
    if (expanded) listRef.current?.children[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, expanded]);

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };
  const select = (option) => {
    onChange(option.id);
    close();
  };
  const showOptions = () => {
    setQuery("");
    setActiveIndex(Math.max(0, options.findIndex((option) => option.id === value)));
    setOpen(true);
  };

  return (
    <div className="relative" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }} onKeyDown={(event) => {
      if (event.key === "Escape" && expanded) {
        event.preventDefault();
        event.stopPropagation();
        close();
      }
    }}>
      <label htmlFor="register-zone" className="mb-2 block text-sm font-medium text-gray-800">Khu vực <span className="text-red-500">*</span></label>
      <button
        ref={triggerRef}
        id="register-zone"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={expanded}
        aria-controls={expanded ? "register-zone-options" : undefined}
        disabled={disabled || loading}
        onClick={() => expanded ? setOpen(false) : showOptions()}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            showOptions();
          }
        }}
        className={`flex min-h-12 w-full items-center gap-3 rounded-xl border bg-white px-4 py-3 text-left transition focus:outline-none focus:ring-4 focus:ring-green-100 disabled:cursor-not-allowed disabled:bg-gray-50 ${expanded ? "border-green-600 ring-4 ring-green-100" : "border-gray-300 hover:border-green-500"}`}
      >
        <MapPin size={19} className="shrink-0 text-green-700" aria-hidden="true" />
        <span className={`flex-1 ${selected ? "font-medium text-gray-900" : "text-gray-500"}`}>{loading ? "Đang tải khu vực..." : selected?.name || "Chọn khu vực của bạn"}</span>
        {loading ? <Loader2 size={18} className="animate-spin text-green-700" aria-hidden="true" /> : <ChevronDown size={18} className={`shrink-0 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden="true" />}
      </button>
      {expanded && (
        <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
          <div className="border-b border-gray-100 p-3">
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 ring-1 ring-gray-200 focus-within:ring-green-600">
              <Search size={17} className="shrink-0 text-gray-400" aria-hidden="true" />
              <input
                autoFocus
                role="combobox"
                aria-label="Tìm khu vực"
                aria-autocomplete="list"
                aria-expanded="true"
                aria-controls="register-zone-options"
                aria-activedescendant={matches[activeIndex] ? `register-zone-option-${matches[activeIndex].id}` : undefined}
                autoComplete="off"
                placeholder="Tìm khu vực..."
                value={query}
                onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); }}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                    event.preventDefault();
                    setActiveIndex((current) => matches.length ? (current + (event.key === "ArrowDown" ? 1 : matches.length - 1)) % matches.length : 0);
                  } else if (event.key === "Enter") {
                    event.preventDefault();
                    if (matches[activeIndex]) select(matches[activeIndex]);
                  }
                }}
                className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400"
              />
            </div>
          </div>
          <ul ref={listRef} id="register-zone-options" role="listbox" aria-label="Khu vực" className="max-h-64 overflow-y-auto overscroll-contain p-2">
            {matches.map((option, index) => (
              <li key={option.id} id={`register-zone-option-${option.id}`} role="option" aria-selected={value === option.id}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => select(option)}
                onMouseMove={() => setActiveIndex(index)}
                className={`flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${value === option.id ? "bg-green-100 font-semibold text-green-800" : activeIndex === index ? "bg-green-50 text-green-800" : "text-gray-700 hover:bg-green-50"}`}>
                <span>{option.name}</span>
                {value === option.id && <Check size={18} className="shrink-0 text-green-700" aria-hidden="true" />}
              </li>
            ))}
          </ul>
          {!matches.length && <p role="status" className="px-4 pb-4 pt-2 text-center text-sm text-gray-500">{options.length ? "Không tìm thấy khu vực phù hợp." : "Chưa có khu vực đăng ký."}</p>}
        </div>
      )}
    </div>
  );
}
