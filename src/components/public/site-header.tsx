"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import { PUBLIC_NAV, SITE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

const mobileLinks = [{ href: "/", label: "Home" }, ...PUBLIC_NAV];

export function SiteHeader({ name = SITE_NAME }: { name?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Next keeps hidden routes mounted; don't return to an open menu.
  useLayoutEffect(() => () => setOpen(false), []);

  const isCurrent = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="relative z-10 border-b border-sand bg-ivory">
      <div className="mx-auto flex h-16 max-w-300 items-center justify-between pr-2 pl-5 md:h-auto md:px-6 md:py-4">
        <Link
          href="/"
          className="font-serif text-2xl font-semibold tracking-[0.2px] text-ink no-underline hover:text-ink md:text-[1.75rem]"
        >
          {name}
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {PUBLIC_NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={isCurrent(href) ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center text-[0.9375rem] font-medium no-underline",
                isCurrent(href) ? "text-accent-dark" : "text-ink hover:text-accent-dark",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((o) => !o)}
          className="flex size-11 items-center justify-center rounded-xl text-ink hover:bg-linen md:hidden"
        >
          {open ? (
            <X aria-hidden className="size-5.5" strokeWidth={1.8} />
          ) : (
            <Menu aria-hidden className="size-5.5" strokeWidth={1.8} />
          )}
        </button>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Main"
          className="absolute inset-x-0 top-16 flex flex-col border-b border-sand bg-ivory py-2 shadow-menu md:hidden"
        >
          {mobileLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onNavigate={() => setOpen(false)}
              aria-current={isCurrent(href) ? "page" : undefined}
              className={cn(
                "flex h-14 items-center px-5 font-serif text-[1.625rem] no-underline",
                isCurrent(href)
                  ? "font-semibold text-accent-dark"
                  : "font-medium text-ink hover:text-accent-dark",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
