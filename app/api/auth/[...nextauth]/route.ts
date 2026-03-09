import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const nextAuthHandler = NextAuth(authOptions);

type RouteContext = { params: Promise<{ nextauth?: string[] }> };

async function GET(req: Request, context: RouteContext) {
  try {
    const params = await context.params;
    const u = new URL(req.url);
    // #region agent log
    fetch('http://127.0.0.1:7625/ingest/04818075-f511-48cf-9bfe-b5154b454078',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'45748b'},body:JSON.stringify({sessionId:'45748b',runId:'run1',hypothesisId:'H2',location:'route.ts:GET_entry',message:'NextAuth GET entry',data:{pathname:u.pathname,origin:req.headers.get('origin'),host:req.headers.get('host'),nextauth:params?.nextauth},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    const response = await nextAuthHandler(req, { params });
    // #region agent log
    fetch('http://127.0.0.1:7625/ingest/04818075-f511-48cf-9bfe-b5154b454078',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'45748b'},body:JSON.stringify({sessionId:'45748b',runId:'run1',hypothesisId:'H2',location:'route.ts:GET_exit',message:'NextAuth GET exit',data:{status:response.status,contentType:response.headers.get('content-type')??null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return response;
  } catch (e) {
    console.error("[NextAuth] GET error:", e);
    // #region agent log
    fetch('http://127.0.0.1:7625/ingest/04818075-f511-48cf-9bfe-b5154b454078',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'45748b'},body:JSON.stringify({sessionId:'45748b',runId:'run1',hypothesisId:'H2',location:'route.ts:GET_catch',message:'NextAuth GET threw',data:{errorName:e instanceof Error?e.name:'non-Error',errorMessage:e instanceof Error?e.message:String(e)},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return Response.json(
      { error: "AuthConfigurationError" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

async function POST(req: Request, context: RouteContext) {
  try {
    const params = await context.params;
    const u = new URL(req.url);
    // #region agent log
    fetch('http://127.0.0.1:7625/ingest/04818075-f511-48cf-9bfe-b5154b454078',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'45748b'},body:JSON.stringify({sessionId:'45748b',runId:'run1',hypothesisId:'H2',location:'route.ts:POST_entry',message:'NextAuth POST entry',data:{pathname:u.pathname,origin:req.headers.get('origin'),host:req.headers.get('host')},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    const response = await nextAuthHandler(req, { params });
    // #region agent log
    fetch('http://127.0.0.1:7625/ingest/04818075-f511-48cf-9bfe-b5154b454078',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'45748b'},body:JSON.stringify({sessionId:'45748b',runId:'run1',hypothesisId:'H2',location:'route.ts:POST_exit',message:'NextAuth POST exit',data:{status:response.status,contentType:response.headers.get('content-type')??null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return response;
  } catch (e) {
    console.error("[NextAuth] POST error:", e);
    // #region agent log
    fetch('http://127.0.0.1:7625/ingest/04818075-f511-48cf-9bfe-b5154b454078',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'45748b'},body:JSON.stringify({sessionId:'45748b',runId:'run1',hypothesisId:'H2',location:'route.ts:POST_catch',message:'NextAuth POST threw',data:{errorName:e instanceof Error?e.name:'non-Error',errorMessage:e instanceof Error?e.message:String(e)},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return Response.json(
      { error: "AuthConfigurationError" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export { GET, POST };
