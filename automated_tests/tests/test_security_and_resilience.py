import re

import pytest
from playwright.sync_api import expect

from config import AUTH_ROUTES, DEMO_EMAIL, DEMO_PASSWORD


@pytest.mark.security
def test_unauthenticated_sensitive_pages_redirect(page):
    sensitive = [
        "/dashboard",
        "/profile",
        "/browse",
        "/chat",
        "/swaps",
        "/wallet",
        "/verify",
        "/admin/dashboard",
        "/admin/users",
    ]
    for route in sensitive:
        page.goto(route)
        if route.startswith("/admin/"):
            assert "/admin" in page.url
            expect(page.locator("#admin-email")).to_be_visible()
        else:
            assert "/login" in page.url
            expect(page.locator("#username")).to_be_visible()


@pytest.mark.security
def test_session_cookie_security_attributes(page):
    page.goto("/login")
    page.locator("#username").fill(DEMO_EMAIL)
    page.locator("#password").fill(DEMO_PASSWORD)
    page.locator("form button[type='submit']").click()
    page.wait_for_url(re.compile(r"/dashboard"))

    cookies = {c["name"]: c for c in page.context.cookies()}
    token = cookies.get("swapspot_token")
    assert token is not None
    assert token.get("httpOnly") is True, "Auth cookie should be HttpOnly"
    assert token.get("sameSite", "").lower() in {"lax", "strict"}, "Auth cookie should have SameSite protection"


@pytest.mark.security
def test_protected_profile_api_cannot_be_viewed_from_browser_without_login(page):
    response = page.request.get("/api/users/me")
    assert response.status in {401, 403}


@pytest.mark.security
def test_admin_api_cannot_be_viewed_without_admin_session(page):
    for endpoint in ["/api/admin/me", "/api/admin/users", "/api/admin/overview"]:
        response = page.request.get(endpoint)
        assert response.status in {401, 403}, f"{endpoint} returned {response.status}"


@pytest.mark.security
def test_invalid_profile_and_swap_ids_are_handled(demo_page):
    for route in ["/profiles/does-not-exist", "/swaps/does-not-exist"]:
        response = demo_page.goto(route, wait_until="domcontentloaded")
        assert response.status < 500
        text = demo_page.locator("body").inner_text().lower()
        assert "application error" not in text
        assert "internal server error" not in text


@pytest.mark.security
def test_openapi_and_health_endpoints_are_reachable(page):
    health = page.request.get("/api/health")
    assert health.status < 500
    openapi = page.request.get("/api/openapi")
    assert openapi.status < 500
    assert "openapi" in openapi.text().lower()
