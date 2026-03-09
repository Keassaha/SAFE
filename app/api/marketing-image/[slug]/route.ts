import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";

const IMAGE_MAP: Record<string, { path: string; contentType: string }> = {
  "dashboard-hero": {
    path: "/Users/Bookkeeping/.cursor/projects/Users-Bookkeeping-SAAS-SAFE-02/assets/safe-dashboard-hero.png",
    contentType: "image/png",
  },
  "automation-flow": {
    path: "/Users/Bookkeeping/.cursor/projects/Users-Bookkeeping-SAAS-SAFE-02/assets/safe-automation-flow.png",
    contentType: "image/png",
  },
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const asset = IMAGE_MAP[slug];

  if (!asset) {
    return new NextResponse("Image introuvable", { status: 404 });
  }

  try {
    const buffer = await readFile(asset.path);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": asset.contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("Image introuvable", { status: 404 });
  }
}
