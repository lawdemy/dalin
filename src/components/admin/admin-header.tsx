"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonClasses } from "@/components/ui/button";
import { SITE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { isActive, MORE_ITEMS, NEW_ENTRY_HREF, TAB_ITEMS } from "./nav-items";
import { SignOutButton } from "./sign-out-button";

/** Top bar: wordmark and sign-out; on desktop also the full navigation. */
export function AdminHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-sand bg-ivory/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-300 items-center justify-between gap-4 pr-2 pl-5 md:h-16 md:px-6">
        <Link
          href="/admin"
          className="font-serif text-card-sm font-semibold text-ink no-underline hover:text-ink"
        >
          {SITE_NAME}
        </Link>

        <nav aria-label="Diary" className="hidden items-center gap-1 md:flex">
          {[...TAB_ITEMS, ...MORE_ITEMS].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(pathname, href) ? "page" : undefined}
              className={cn(
                "flex h-11 items-center rounded-xl px-3 text-[0.9375rem] font-medium no-underline hover:bg-linen",
                isActive(pathname, href) ? "text-accent-dark" : "text-ink hover:text-ink",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={NEW_ENTRY_HREF}
            className={buttonClasses({ size: "sm", className: "hidden md:inline-flex" })}
          >
            <Plus aria-hidden className="size-4.5" strokeWidth={2} />
            New entry
          </Link>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
