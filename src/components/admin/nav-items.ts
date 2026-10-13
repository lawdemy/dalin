import {
  BookOpen,
  Calendar,
  House,
  Image as ImageIcon,
  PenLine,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const NEW_ENTRY_HREF = "/admin/entries/new";

/** Bottom tabs on phones: Home · Timeline · (+) · Photos · More. */
export const TAB_ITEMS: NavItem[] = [
  { href: "/admin", label: "Home", icon: House },
  { href: "/admin/timeline", label: "Timeline", icon: BookOpen },
  { href: "/admin/photos", label: "Photos", icon: ImageIcon },
];

/** Inside the "More" sheet on phones. */
export const MORE_ITEMS: NavItem[] = [
  { href: "/admin/calendar", label: "Calendar", icon: Calendar },
  { href: "/admin/about", label: "About Us editor", icon: PenLine },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}
