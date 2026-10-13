import Link from "next/link";
import type { ReactNode } from "react";

type SectionHeadingProps = {
  children: ReactNode;
  link?: { href: string; label: string };
  id?: string;
};

/** h2 with an optional "See all" link on the right. */
export function SectionHeading({ children, link, id }: SectionHeadingProps) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h2 id={id} className="text-section md:text-section-lg">
        {children}
      </h2>
      {link && (
        <Link
          href={link.href}
          className="flex min-h-11 items-center text-[0.9375rem] font-medium no-underline"
        >
          {link.label}
        </Link>
      )}
    </div>
  );
}

/** Small uppercase label above a page title, e.g. "OUR DIARY". */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="text-caption font-medium tracking-[2px] text-muted uppercase">{children}</span>
  );
}
