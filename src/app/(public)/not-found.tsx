import { NotFoundContent } from "@/components/public/not-found-content";

// Shown inside the public header and footer for notFound() calls, including
// private and switched-off moments.
export default function PublicNotFound() {
  return <NotFoundContent />;
}
