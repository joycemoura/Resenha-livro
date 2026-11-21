import { notFound, redirect } from "next/navigation";
import { readingHref, validReadingId } from "@/lib/readings";

export const dynamic = "force-dynamic";

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!validReadingId(id)) notFound();
  redirect(readingHref(id));
}
