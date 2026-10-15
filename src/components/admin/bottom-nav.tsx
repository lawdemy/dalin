"use client";

import { Ellipsis, LogOut, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import { signOut } from "@/app/login/actions";
import { cn } from "@/lib/utils";
import {
  isActive,
  isEditorPath,
  MORE_ITEMS,
  NEW_ENTRY_HREF,
  TAB_ITEMS,
  type NavItem,
} from "./nav-items";

/**
 * Phone tab bar: Home · Timeline · (+) · Photos · More. Hidden on desktop and
 * on entry editor pages. The path streams in on dynamic routes, so the bar
 * first renders without a highlighted tab.
 */
export function BottomNav() {
  return (
    <Suspense fallback={<TabBar pathname={null} />}>
      <CurrentTabBar />
    </Suspense>
  );
}

function CurrentTabBar() {
  return <TabBar pathname={usePathname()} />;
}

function TabBar({ pathname }: { pathname: string | null }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = MORE_ITEMS.some(({ href }) => isActive(pathname, href));
  const [home, timeline, photos] = TAB_ITEMS;
  if (isEditorPath(pathname)) return null;

  return (
    <>
      <nav
        aria-label="Diary"
        className="sticky bottom-0 z-20 border-t border-sand bg-ivory pb-[max(env(safe-area-inset-bottom),8px)] md:hidden"
      >
        <div className="grid h-16 grid-cols-5 items-center px-2">
          <Tab item={home} active={isActive(pathname, home.href)} />
          <Tab item={timeline} active={isActive(pathname, timeline.href)} />
          <Link
            href={NEW_ENTRY_HREF}
            aria-label="New entry"
            className="-mt-7 flex size-15 items-center justify-center justify-self-center rounded-full bg-accent-dark text-white shadow-fab hover:bg-accent-deep hover:text-white"
          >
            <Plus aria-hidden className="size-7" strokeWidth={2} />
          </Link>
          <Tab item={photos} active={isActive(pathname, photos.href)} />
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
            className={cn(
              "flex h-14 flex-col items-center justify-center gap-0.5 text-micro",
              moreActive ? "font-semibold text-accent-dark" : "font-medium text-muted",
            )}
          >
            <Ellipsis aria-hidden className="size-5.5" strokeWidth={1.8} />
            More
          </button>
        </div>
      </nav>
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} pathname={pathname} />
    </>
  );
}

function Tab({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-14 flex-col items-center justify-center gap-0.5 text-micro no-underline",
        active
          ? "font-semibold text-accent-dark hover:text-accent-dark"
          : "font-medium text-muted hover:text-ink",
      )}
    >
      <Icon aria-hidden className="size-5.5" strokeWidth={1.8} />
      {item.label}
    </Link>
  );
}

function MoreSheet({
  open,
  onClose,
  pathname,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string | null;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const onCloseRef = useRef(onClose);
  useLayoutEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Next keeps hidden routes mounted; don't come back to an open sheet.
  useLayoutEffect(() => () => onCloseRef.current(), []);

  return (
    <dialog
      ref={ref}
      aria-label="More"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose(); // tap on the backdrop
      }}
      className="mx-0 mt-auto mb-0 w-full max-w-full rounded-t-[20px] bg-ivory px-3 pt-2 pb-[calc(16px+env(safe-area-inset-bottom))] text-ink md:hidden"
    >
      <div aria-hidden className="mx-auto mt-1 mb-3 h-1 w-10 rounded-full bg-sand" />
      {MORE_ITEMS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onNavigate={onClose}
          aria-current={isActive(pathname, href) ? "page" : undefined}
          className={cn(
            "flex h-14 items-center gap-4 rounded-xl px-3 font-medium no-underline hover:bg-linen",
            isActive(pathname, href) ? "text-accent-dark" : "text-ink hover:text-ink",
          )}
        >
          <Icon aria-hidden className="size-5" strokeWidth={1.8} />
          {label}
        </Link>
      ))}
      <div aria-hidden className="mx-3 my-1 h-px bg-sand" />
      <form action={signOut}>
        <button
          type="submit"
          className="flex h-14 w-full items-center gap-4 rounded-xl px-3 font-medium text-danger-text hover:bg-linen"
        >
          <LogOut aria-hidden className="size-5" strokeWidth={1.8} />
          Sign out
        </button>
      </form>
    </dialog>
  );
}
