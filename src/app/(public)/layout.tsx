import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getSiteSettings } from "@/lib/queries/public";

export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const { coupleNames, momentsEnabled } = await getSiteSettings();

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader name={coupleNames} momentsEnabled={momentsEnabled} />
      <main className="flex flex-1 flex-col">{children}</main>
      <SiteFooter name={coupleNames} />
    </div>
  );
}
