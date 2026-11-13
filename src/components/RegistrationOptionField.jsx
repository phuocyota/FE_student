import React, { useState } from "react";

export const NEW_REGISTRATION_OPTION = "__new__";

const normalize = (text) => text.normalize("NFC").trim().replace(/\s+/g, " ").toLocaleLowerCase("vi");
const searchable = (text) => normalize(text).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");

export default function RegistrationOptionField({ id, label, options, value, name, onChange, loading = false, disabled = false, showCreateOption = true, disabledHint = "Nhập hoặc chọn trường trước khi chọn lớp." }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const text = value === NEW_REGISTRATION_OPTION ? name : options.find((option) => option.id === value)?.name || "";
  const matches = options.filter((option) => searchable(option.name).includes(searchable(text)));
  const exactMatches = options.filter((option) => normalize(option.name) === normalize(text));
  const canCreate = showCreateOption && !!text.trim() && exactMatches.length === 0 && !loading;
  const choices = [...matches, ...(canCreate ? [{ id: NEW_REGISTRATION_OPTION, name: text.trim() }] : [])];
  const expanded = open && !disabled;

  const select = (option) => {
    onChange(option.id, option.id === NEW_REGISTRATION_OPTION ? option.name : "");
    setOpen(false);
    setActiveIndex(-1);
  };

  return (
    <div className="relative" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) {
        if (value === NEW_REGISTRATION_OPTION && exactMatches.length === 1) onChange(exactMatches[0].id, "");
        setOpen(false);
        setActiveIndex(-1);
      }
    }}>
      <label htmlFor={id} className="mb-2 block text-sm font-medium">{label} <span className="text-red-500">*</span></label>
      <input
        id={id}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={expanded ? `${id}-options` : undefined}
        aria-activedescendant={expanded && activeIndex >= 0 && choices[activeIndex] ? `${id}-option-${activeIndex}` : undefined}
        aria-describedby={`${id}-hint`}
        autoComplete="off"
        required
        maxLength={255}
        value={text}
        disabled={disabled}
        placeholder={`Nhập tên ${label.toLowerCase()} để tìm kiếm`}
        onFocus={() => { setOpen(true); setActiveIndex(-1); }}
        onChange={(event) => {
          const input = event.target.value;
          const exact = options.filter((option) => normalize(option.name) === normalize(input));
          if (exact.length === 1 && input === exact[0].name) onChange(exact[0].id, "");
          else onChange(input ? NEW_REGISTRATION_OPTION : "", input);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
            setActiveIndex((current) => choices.length ? (event.key === "ArrowDown" ? (current + 1) % choices.length : (current <= 0 ? choices.length - 1 : current - 1)) : -1);
          } else if (event.key === "Enter" && expanded) {
            event.preventDefault();
            if (choices[activeIndex]) select(choices[activeIndex]);
            else if (exactMatches.length === 1) select(exactMatches[0]);
            else setOpen(false);
          } else if (event.key === "Escape") {
            event.preventDefault();
            setOpen(false);
          }
        }}
        className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-600 disabled:bg-gray-100"
      />
      {expanded && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          <ul id={`${id}-options`} role="listbox" aria-label={label} aria-busy={loading} className="max-h-56 overflow-y-auto">
            {choices.map((option, index) => (
              <li
                key={option.id}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={value === option.id}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => select(option)}
                className={`cursor-pointer px-4 py-3 text-sm hover:bg-green-50 ${activeIndex === index ? "bg-green-50" : ""}`}
              >
                {option.id === NEW_REGISTRATION_OPTION ? `+ Tạo ${label.toLowerCase()} mới: “${option.name}”` : option.name}
              </li>
            ))}
          </ul>
          {loading && <p role="status" className="px-4 py-3 text-sm text-gray-500">Đang tải danh sách...</p>}
          {!loading && !choices.length && <p className="px-4 py-3 text-sm text-gray-500">Chưa có {label.toLowerCase()} phù hợp.{showCreateOption && " Nhập tên để tạo mới."}</p>}
        </div>
      )}
      <p id={`${id}-hint`} className="mt-1 text-xs text-gray-500">
        {disabled ? disabledHint : !showCreateOption ? `Tìm và chọn ${label.toLowerCase()} có sẵn trong danh sách.` : value === NEW_REGISTRATION_OPTION && text.trim() && !exactMatches.length ? `${label} mới sẽ được tạo khi đăng ký thành công.` : `Tìm và chọn ${label.toLowerCase()} có sẵn, hoặc nhập tên mới nếu chưa có.`}
      </p>
    </div>
  );
}
