"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface Action {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface QuickActionsProps {
  actions: Action[];
  className?: string;
}

/**
 * Primary-style quick action buttons: white background, green icon, subtle shadow.
 */
export function QuickActions({ actions, className = "" }: QuickActionsProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {actions.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="group/btn flex-1 flex flex-col items-center gap-2 py-3 px-2 rounded-xl bg-white border border-gray-200/80 shadow-sm hover:shadow-md hover:border-primary-200 transition-all duration-200"
        >
          <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 group-hover/btn:bg-primary-100 transition-colors">
            <Icon className="w-5 h-5" aria-hidden />
          </div>
          <span className="text-xs font-medium text-neutral-text-primary">{label}</span>
        </Link>
      ))}
    </div>
  );
}
