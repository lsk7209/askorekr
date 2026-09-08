export function authorizeInternalRequest(request: Request) {
  const configuredToken = process.env.INTERNAL_API_TOKEN?.trim();
  if (!configuredToken) {
    return { authorized: false, configured: false } as const;
  }

  const authorization = request.headers.get("authorization")?.trim();
  const bearerToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : undefined;
  const suppliedToken = bearerToken || request.headers.get("x-internal-api-token")?.trim();

  return { authorized: suppliedToken === configuredToken, configured: true } as const;
}
