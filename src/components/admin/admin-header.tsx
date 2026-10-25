"use client";

import { ChevronDown, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useRef } from "react";
import { buttonClasses } from "@/components/ui/button";
import { SITE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { isActive, MORE_ITEMS, NEW_ENTRY_HREF, TAB_ITEMS } from "./nav-items";
import { NotificationBell } from "./notification-bell";
import { SignOutButton } from "./sign-out-button";

/** Top bar: wordmark and sign-out; on desktop also the full navigation. */
export function AdminHeader() {
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
          <Suspense fallback={<DesktopLinks pathname={null} />}>
            <CurrentDesktopLinks />
          </Suspense>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={NEW_ENTRY_HREF}
            className={buttonClasses({ size: "sm", className: "hidden md:inline-flex" })}
          >
            <Plus aria-hidden className="size-4.5" strokeWidth={2} />
            New entry
          </Link>
          <NotificationBell />
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}

// The path streams in on dynamic routes; the plain links are the fallback.
function CurrentDesktopLinks() {
  return <DesktopLinks pathname={usePathname()} />;
}

/** Shown in the header on desktop; the rest sit in the "More" menu. */
const INLINE_MORE = 2;

function DesktopLinks({ pathname }: { pathname: string | null }) {
  const inline = [...TAB_ITEMS, ...MORE_ITEMS.slice(0, INLINE_MORE)];
  const rest = MORE_ITEMS.slice(INLINE_MORE);
  const menu = useRef<HTMLDetailsElement>(null);
  const close = () => menu.current?.removeAttribute("open");
  const restActive = rest.some(({ href }) => isActive(pathname, href));

  return (
    <>
      {inline.map(({ href, label }) => (
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
      <details ref={menu} className="relative">
        <summary
          className={cn(
            "flex h-11 cursor-pointer list-none items-center gap-1 rounded-xl px-3 text-[0.9375rem] font-medium hover:bg-linen",
            restActive ? "text-accent-dark" : "text-ink",
          )}
        >
          More
          <ChevronDown aria-hidden className="size-4" strokeWidth={1.8} />
        </summary>
        <div className="absolute top-12 right-0 z-30 flex w-52 flex-col rounded-xl border border-sand bg-ivory py-1 shadow-menu">
          {rest.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={close}
              aria-current={isActive(pathname, href) ? "page" : undefined}
              className={cn(
                "flex h-11 items-center gap-3 px-4 text-[0.9375rem] font-medium no-underline hover:bg-linen",
                isActive(pathname, href) ? "text-accent-dark" : "text-ink hover:text-ink",
              )}
            >
              <Icon aria-hidden className="size-4.5 text-accent" strokeWidth={1.8} />
              {label}
            </Link>
          ))}
        </div>
      </details>
    </>
  );
}
