/**
 * Instant placeholder for every admin page. Client navigations between admin
 * pages only re-render below the admin layout, so this boundary (not the one
 * inside the layout) is what shows while the session and data load.
 */
export default function AdminLoading() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="mx-auto flex w-full max-w-180 flex-col gap-4"
    >
      <div className="h-10 w-2/3 animate-pulse rounded-xl bg-linen" />
      <div className="h-12 animate-pulse rounded-xl bg-linen" />
      <div className="h-32 animate-pulse rounded-xl bg-linen" />
      <div className="h-32 animate-pulse rounded-xl bg-linen" />
    </div>
  );
}
