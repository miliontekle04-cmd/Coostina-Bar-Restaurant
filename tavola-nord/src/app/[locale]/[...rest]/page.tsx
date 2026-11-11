import { notFound } from "next/navigation";

/** Unknown addresses end up here, so they get the 404 page inside the site's layout. */
export default function CatchAll() {
  notFound();
}
