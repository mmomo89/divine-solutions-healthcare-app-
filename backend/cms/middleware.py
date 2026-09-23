class SecurityHeadersMiddleware:
    """Adds security response headers not already covered by Django's
    built-in SecurityMiddleware (X-Content-Type-Options, HSTS, SSL redirect):

    - Content-Security-Policy: restricts where scripts/styles/frames/etc. can
      load from, as defense-in-depth against XSS.
    - Referrer-Policy: avoids leaking full URLs (which could contain tokens
      in query strings) to third-party sites via the Referer header.
    - Permissions-Policy: disables browser features this API has no reason
      to use.

    Kept as a small dependency-free middleware rather than adding a package,
    since the policy needed here is short and API-specific.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        response.setdefault(
            "Content-Security-Policy",
            "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
        )
        response.setdefault("Referrer-Policy", "same-origin")
        response.setdefault("Permissions-Policy", "geolocation=(), microphone=(), camera=()")
        return response
