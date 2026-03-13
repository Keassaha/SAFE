"use client";

import * as React from "react";

type AccordionContextValue = {
  openItem: string | null;
  setOpenItem: (value: string | null) => void;
  type: "single" | "multiple";
};

const AccordionContext = React.createContext<AccordionContextValue | null>(null);

function useAccordionContext() {
  const ctx = React.useContext(AccordionContext);
  if (!ctx) throw new Error("Accordion components must be used within Accordion");
  return ctx;
}

export interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "single" | "multiple";
  defaultValue?: string | string[];
  children: React.ReactNode;
}

export function Accordion({
  type = "single",
  defaultValue,
  children,
  className = "",
  ...props
}: AccordionProps) {
  const [openItem, setOpenItem] = React.useState<string | null>(() => {
    if (defaultValue == null) return null;
    return Array.isArray(defaultValue) ? defaultValue[0] ?? null : defaultValue;
  });
  return (
    <AccordionContext.Provider value={{ openItem, setOpenItem, type }}>
      <div className={className} data-state={openItem} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

export interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  children: React.ReactNode;
}

export function AccordionItem({ value, children, className = "", ...props }: AccordionItemProps) {
  return (
    <div
      className={`border-b border-[var(--safe-neutral-border)] last:border-b-0 ${className}`}
      data-state={value}
      {...props}
    >
      {children}
    </div>
  );
}

export interface AccordionTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  children: React.ReactNode;
}

export function AccordionTrigger({
  value,
  children,
  className = "",
  ...props
}: AccordionTriggerProps) {
  const { openItem, setOpenItem } = useAccordionContext();
  const isOpen = openItem === value;
  return (
    <button
      type="button"
      aria-expanded={isOpen}
      aria-controls={`content-${value}`}
      id={`trigger-${value}`}
      onClick={() => setOpenItem(isOpen ? null : value)}
      className={`flex w-full items-center justify-between py-4 text-left text-sm font-medium text-[var(--safe-text-title)] transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--safe-green-700)] focus-visible:ring-offset-2 [&[data-state=open]>svg]:rotate-180 ${className}`}
      data-state={isOpen ? "open" : "closed"}
      {...props}
    >
      {children}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0 transition-transform duration-200"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>
  );
}

export interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  children: React.ReactNode;
}

export function AccordionContent({
  value,
  children,
  className = "",
  ...props
}: AccordionContentProps) {
  const { openItem } = useAccordionContext();
  const isOpen = openItem === value;
  if (!isOpen) return null;
  return (
    <div
      id={`content-${value}`}
      role="region"
      aria-labelledby={`trigger-${value}`}
      className={`overflow-hidden pb-4 pt-0 text-sm text-[var(--safe-text-secondary)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
