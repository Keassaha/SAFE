import { readFile } from "node:fs/promises";

export const runtime = "nodejs";

const HERO_IMAGE_PATH =
  "/Users/Bookkeeping/.cursor/projects/Users-Bookkeeping-SAAS-SAFE-02/assets/safe-hero-dashboard.png";

export async function GET() {
  const buffer = await readFile(HERO_IMAGE_PATH);

  return new Response(buffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
