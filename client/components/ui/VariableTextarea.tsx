import React, {
  useRef,
  useState,
  useCallback,
  KeyboardEvent,
  useEffect,
} from "react";
import { cn } from "@/lib/utils";

export interface VariableTextareaProps extends Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "onChange" | "value"
> {
  value: string;
  onChange: (value: string) => void;
  /** Variable names WITHOUT braces, e.g. ["first_name", "broker_name"] */
  variables: string[];
  /** Optional descriptions shown below each variable name in the dropdown */
  variableHints?: Record<string, string>;
}

/** Returns the pixel position of the caret inside a textarea, relative to the textarea element. */
function getCaretCoords(
  el: HTMLTextAreaElement,
  caretPos: number,
): { top: number; left: number } {
  const computed = window.getComputedStyle(el);
  const mirror = document.createElement("div");

  // Use fixed + off-screen so getBoundingClientRect values are viewport-stable
  Object.assign(mirror.style, {
    position: "fixed",
    visibility: "hidden",
    top: "-9999px",
    left: "-9999px",
    overflow: "hidden",
    whiteSpace: "pre-wrap",
    wordWrap: "break-word",
    width: computed.width,
    paddingTop: computed.paddingTop,
    paddingRight: computed.paddingRight,
    paddingBottom: computed.paddingBottom,
    paddingLeft: computed.paddingLeft,
    borderTopWidth: computed.borderTopWidth,
    borderRightWidth: computed.borderRightWidth,
    borderBottomWidth: computed.borderBottomWidth,
    borderLeftWidth: computed.borderLeftWidth,
    boxSizing: computed.boxSizing,
    fontFamily: computed.fontFamily,
    fontSize: computed.fontSize,
    fontWeight: computed.fontWeight,
    fontStyle: computed.fontStyle,
    lineHeight: computed.lineHeight,
    letterSpacing: computed.letterSpacing,
    textTransform: (computed as any).textTransform,
  });

  document.body.appendChild(mirror);
  mirror.textContent = el.value.slice(0, caretPos);

  const marker = document.createElement("span");
  marker.textContent = "\u200b";
  mirror.appendChild(marker);

  // Measure position of the cursor character WITHIN the mirror div
  const mirrorRect = mirror.getBoundingClientRect();
  const markerRect = marker.getBoundingClientRect();

  const topInContent = markerRect.top - mirrorRect.top;
  const leftInContent = markerRect.left - mirrorRect.left;

  document.body.removeChild(mirror);

  const lineHeight = parseFloat(computed.lineHeight) || 20;

  // Subtract el.scrollTop so the position is relative to the visible area of the textarea
  return {
    top: topInContent - el.scrollTop + lineHeight,
    left: Math.max(0, leftInContent),
  };
}

/**
 * A textarea that shows an autocomplete dropdown at the cursor when the user types `{{`.
 * Arrow keys / Enter / Tab to select, Escape to dismiss.
 */
const VariableTextarea: React.FC<VariableTextareaProps> = ({
  value,
  onChange,
  variables,
  variableHints,
  className,
  onKeyDown: externalKeyDown,
  ...props
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [showDropdown, setShowDropdown] = useState(false);
  const [filter, setFilter] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [triggerStart, setTriggerStart] = useState(-1);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>(
    { top: 0, left: 0 },
  );

  const filtered = variables.filter((v) =>
    v.toLowerCase().startsWith(filter.toLowerCase()),
  );

  const detectTrigger = useCallback((newValue: string, cursor: number) => {
    const before = newValue.slice(0, cursor);
    const lastOpen = before.lastIndexOf("{{");
    if (lastOpen === -1) {
      setShowDropdown(false);
      return;
    }
    const between = before.slice(lastOpen + 2);
    if (between.includes("}}") || between.includes("\n")) {
      setShowDropdown(false);
      return;
    }

    setTriggerStart(lastOpen);
    setFilter(between);
    setActiveIndex(0);
    setShowDropdown(true);

    // Calculate dropdown position at the {{ trigger start
    if (textareaRef.current) {
      const coords = getCaretCoords(
        textareaRef.current,
        lastOpen + 2 + between.length,
      );
      setDropdownPos(coords);
    }
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      const cursor = e.target.selectionStart ?? newValue.length;
      onChange(newValue);
      detectTrigger(newValue, cursor);
    },
    [onChange, detectTrigger],
  );

  const insertVariable = useCallback(
    (varName: string) => {
      const ta = textareaRef.current;
      const cursor = ta?.selectionStart ?? value.length;
      const before = value.slice(0, triggerStart);
      const after = value.slice(cursor);
      const insertion = `{{${varName}}}`;
      const newValue = `${before}${insertion}${after}`;
      onChange(newValue);
      setShowDropdown(false);
      setTriggerStart(-1);

      setTimeout(() => {
        if (ta) {
          const pos = before.length + insertion.length;
          ta.focus();
          ta.setSelectionRange(pos, pos);
        }
      }, 0);
    },
    [value, triggerStart, onChange],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (showDropdown && filtered.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setActiveIndex((i) => Math.max(i - 1, 0));
          return;
        }
        if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          insertVariable(filtered[activeIndex]);
          return;
        }
        if (e.key === "Escape") {
          setShowDropdown(false);
          return;
        }
      }
      externalKeyDown?.(e);
    },
    [showDropdown, filtered, activeIndex, insertVariable, externalKeyDown],
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
          "ring-offset-background placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50 resize-none",
          className,
        )}
        {...props}
      />

      {showDropdown && filtered.length > 0 && (
        <div
          ref={dropdownRef}
          style={{ top: dropdownPos.top, left: dropdownPos.left }}
          className="absolute z-50 w-56 rounded-md border border-border bg-popover shadow-lg overflow-hidden"
        >
          <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
            Insert variable
          </div>
          {filtered.map((v, i) => (
            <button
              key={v}
              type="button"
              className={cn(
                "flex w-full items-start gap-2 px-3 py-2 text-sm font-mono transition-colors text-left",
                "hover:bg-accent hover:text-accent-foreground",
                i === activeIndex && "bg-accent text-accent-foreground",
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                insertVariable(v);
              }}
            >
              <span className="text-primary text-xs mt-0.5">{"{{"}</span>
              <span className="flex-1 min-w-0">
                <span className="block">{v}</span>
                {variableHints?.[v] && (
                  <span
                    className={cn(
                      "block text-[10px] font-sans font-normal mt-0.5 leading-tight",
                      i === activeIndex
                        ? "text-accent-foreground/70"
                        : "text-muted-foreground",
                    )}
                  >
                    {variableHints[v]}
                  </span>
                )}
              </span>
              <span className="text-primary text-xs mt-0.5">
                {"}}"[0]}
                {"}}"[1]}
              </span>
            </button>
          ))}
          <div className="px-2 py-1 text-[10px] text-muted-foreground border-t border-border">
            ↑↓ navigate · ↵ insert · Esc dismiss
          </div>
        </div>
      )}
    </div>
  );
};

export default VariableTextarea;
