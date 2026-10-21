"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "./ui";

type Choice = { value: string; label: string; disabled?: boolean };
/** Select-only combobox. Native popover keeps the menu above dialogs and clipping containers. */
export function ProductSelect({
  value,
  onChange,
  options,
  id,
  name,
  label,
  disabled = false,
  action,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Choice[];
  id?: string;
  name?: string;
  label: string;
  disabled?: boolean;
  action?: { label: string; onSelect: () => void };
}) {
  const generated = useId(),
    menuId = `${generated}-options`;
  const trigger = useRef<HTMLButtonElement>(null),
    menu = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false),
    [active, setActive] = useState(0);
  const [position, setPosition] = useState({
    left: 0,
    top: 0,
    width: 200,
    maxHeight: 280,
  });
  const search = useRef({ value: "", time: 0 });
  const items = action
    ? [...options, { value: "__action", label: action.label }]
    : options;
  const selected = options.find((item) => item.value === value);
  function show() {
    if (disabled || !trigger.current || !menu.current) return;
    const rect = trigger.current.getBoundingClientRect(),
      below = innerHeight - rect.bottom - 12;
    const height = Math.min(280, items.length * 48 + 24),
      above = below < Math.min(height, 160) && rect.top > below;
    const width = Math.min(Math.max(rect.width, 190), innerWidth - 24);
    setPosition({
      left: Math.max(12, Math.min(rect.left, innerWidth - width - 12)),
      top: above ? Math.max(12, rect.top - height - 6) : rect.bottom + 6,
      width,
      maxHeight: above
        ? Math.min(height, rect.top - 18)
        : Math.min(height, below),
    });
    setActive(
      Math.max(
        0,
        options.findIndex((item) => item.value === value),
      ),
    );
    menu.current.showPopover();
  }
  function choose(index: number) {
    const item = items[index];
    if (!item || item.disabled) return;
    menu.current?.hidePopover();
    trigger.current?.focus();
    if (action && index === options.length) action.onSelect();
    else onChange(item.value);
  }
  useEffect(() => {
    if (!open) return;
    menu.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active, open]);
  useEffect(() => {
    if (!open) return;
    const hide = () => menu.current?.hidePopover();
    const scroll = (event: Event) => {
      if (!menu.current?.contains(event.target as Node)) hide();
    };
    window.addEventListener("resize", hide);
    window.addEventListener("scroll", scroll, true);
    return () => {
      window.removeEventListener("resize", hide);
      window.removeEventListener("scroll", scroll, true);
    };
  }, [open]);
  return (
    <span className="product-select">
      {name && <input type="hidden" name={name} value={value} />}
      <button
        ref={trigger}
        id={id}
        type="button"
        className="product-select-trigger"
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="listbox"
        aria-activedescendant={open ? `${generated}-${active}` : undefined}
        disabled={disabled}
        onClick={() => (open ? menu.current?.hidePopover() : show())}
        onKeyDown={(event) => {
          if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
            event.preventDefault();
            if (!open) {
              show();
              return;
            }
            let next =
              event.key === "Home"
                ? 0
                : event.key === "End"
                  ? items.length - 1
                  : (active +
                      (event.key === "ArrowDown" ? 1 : -1) +
                      items.length) %
                    items.length;
            for (
              let count = 0;
              items[next]?.disabled && count < items.length;
              count++
            )
              next =
                (next + (event.key === "ArrowUp" ? -1 : 1) + items.length) %
                items.length;
            setActive(next);
          } else if ((event.key === "Enter" || event.key === " ") && open) {
            event.preventDefault();
            choose(active);
          } else if (event.key === "Escape" || event.key === "Tab") {
            if (open) {
              if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
              }
              menu.current?.hidePopover();
            }
          } else if (
            event.key.length === 1 &&
            !event.ctrlKey &&
            !event.metaKey &&
            event.key !== " "
          ) {
            event.preventDefault();
            if (!open) show();
            const now = Date.now();
            search.current.value =
              now - search.current.time > 700
                ? event.key
                : search.current.value + event.key;
            search.current.time = now;
            const found = items.findIndex(
              (item) =>
                !item.disabled &&
                item.label
                  .toLocaleLowerCase()
                  .startsWith(search.current.value.toLocaleLowerCase()),
            );
            if (found >= 0) setActive(found);
          }
        }}
      >
        <span>{selected?.label || label}</span>
        <Icon name="downCaret" size={15} />
      </button>
      <div
        ref={menu}
        id={menuId}
        popover="auto"
        role="listbox"
        aria-label={label}
        className="product-select-menu"
        style={position}
        onToggle={(event) => setOpen(event.newState === "open")}
      >
        {items.map((item, index) => (
          <div
            key={item.value}
            id={`${generated}-${index}`}
            role="option"
            aria-selected={value === item.value}
            aria-disabled={item.disabled || undefined}
            data-index={index}
            data-active={active === index || undefined}
            className={`product-select-option${action && index === options.length ? " is-action" : ""}`}
            onPointerMove={() => !item.disabled && setActive(index)}
            onMouseDown={(event) => event.preventDefault()}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              choose(index);
            }}
          >
            {action && index === options.length && (
              <Icon name="folderPlus" size={18} />
            )}
            <span>{item.label}</span>
            {value === item.value && <Icon name="check" size={17} />}
          </div>
        ))}
      </div>
    </span>
  );
}
