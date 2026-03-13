import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const IMAGE_MAP: Record<
  string,
  { filename: string; contentType: string }
> = {
  "dashboard-hero": {
    filename: "safe-dashboard-hero.png",
    contentType: "image/png",
  },
  "automation-flow": {
    filename: "safe-automation-flow.png",
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

  const filePath = path.join(
    process.cwd(),
    "public",
    "images",
    "marketing",
    asset.filename
  );

  try {
    const buffer = await readFile(filePath);
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
