type Handler = (
  req: Request,
  params: Record<string, string>,
) => Promise<Response> | Response;

interface Route {
  method: string;
  pattern: RegExp;
  paramNames: string[];
  handler: Handler;
}

export function route(method: string, path: string, handler: Handler): Route {
  const paramNames: string[] = [];
  const patternStr = path.replace(/:([^/]+)/g, (_, name) => {
    paramNames.push(name);
    return "([^/]+)";
  });
  return {
    method,
    pattern: new RegExp(`^${patternStr}$`),
    paramNames,
    handler,
  };
}

export function matchRoute(
  routes: Route[],
  method: string,
  pathname: string,
): { handler: Handler; params: Record<string, string> } | null {
  for (const r of routes) {
    if (r.method !== method) continue;
    const match = pathname.match(r.pattern);
    if (match) {
      const params: Record<string, string> = {};
      r.paramNames.forEach((name, i) => {
        params[name] = match[i + 1]!;
      });
      return { handler: r.handler, params };
    }
  }
  return null;
}
