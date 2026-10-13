"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useLayoutEffect, useState } from "react";
import { PUBLIC_NAV, SITE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string };

type SiteHeaderProps = {
  name?: string;
  /** Hides the Moments link while the feed is switched off. */
  momentsEnabled?: boolean;
};

export function SiteHeader({ name = SITE_NAME, momentsEnabled = true }: SiteHeaderProps) {
  const nav = PUBLIC_NAV.filter((item) => momentsEnabled || item.href !== "/moments");
  const mobileLinks = [{ href: "/", label: "Home" }, ...nav];
  const [open, setOpen] = useState(false);

  // Next keeps hidden routes mounted; don't return to an open menu.
  useLayoutEffect(() => () => setOpen(false), []);

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
          <NavLinks items={nav} variant="desktop" />
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
          <NavLinks items={mobileLinks} variant="mobile" onNavigate={() => setOpen(false)} />
        </nav>
      )}
    </header>
  );
}

type NavLinksProps = {
  items: NavItem[];
  variant: "desktop" | "mobile";
  onNavigate?: () => void;
};

/**
 * The current path is only known at request time on dynamic routes
 * (/moments/[slug]), so the highlighted links stream in; the plain links
 * render immediately as the fallback.
 */
function NavLinks(props: NavLinksProps) {
  return (
    <Suspense fallback={<NavLinkList {...props} pathname={null} />}>
      <CurrentNavLinks {...props} />
    </Suspense>
  );
}

function CurrentNavLinks(props: NavLinksProps) {
  const pathname = usePathname();
  return <NavLinkList {...props} pathname={pathname} />;
}

function NavLinkList({
  items,
  variant,
  onNavigate,
  pathname,
}: NavLinksProps & { pathname: string | null }) {
  const isCurrent = (href: string) =>
    pathname !== null &&
    (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

  return items.map(({ href, label }) => (
    <Link
      key={href}
      href={href}
      onNavigate={onNavigate}
      aria-current={isCurrent(href) ? "page" : undefined}
      className={cn(
        "no-underline",
        variant === "desktop"
          ? "flex min-h-11 items-center text-[0.9375rem] font-medium"
          : "flex h-14 items-center px-5 font-serif text-[1.625rem]",
        isCurrent(href)
          ? cn("text-accent-dark", variant === "mobile" && "font-semibold")
          : cn("text-ink hover:text-accent-dark", variant === "mobile" && "font-medium"),
      )}
    >
      {label}
    </Link>
  ));
}
