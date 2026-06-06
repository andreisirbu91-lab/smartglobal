import { fetchPhoto } from "@/lib/places";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const name = new URL(req.url).searchParams.get("name");
  if (!name) return new Response("missing name", { status: 400 });

  const photo = await fetchPhoto(name);
  if (!photo) return new Response("not found", { status: 404 });

  return new Response(photo.body, {
    headers: {
      "Content-Type": photo.contentType,
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
