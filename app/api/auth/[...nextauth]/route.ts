import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const nextAuthHandler = NextAuth(authOptions);

type RouteContext = { params: Promise<{ nextauth?: string[] }> };

async function GET(req: Request, context: RouteContext) {
  try {
    const resolvedParams = await context.params;
    return await nextAuthHandler(req, { params: resolvedParams });
  } catch (e) {
    console.error("[NextAuth] GET error:", e);
    return Response.json(
      { error: "AuthConfigurationError" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

async function POST(req: Request, context: RouteContext) {
  try {
    const resolvedParams = await context.params;
    return await nextAuthHandler(req, { params: resolvedParams });
  } catch (e) {
    console.error("[NextAuth] POST error:", e);
    return Response.json(
      { error: "AuthConfigurationError" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export { GET, POST };
