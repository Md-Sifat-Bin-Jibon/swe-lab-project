import re

import pytest
from playwright.sync_api import expect

from config import ADMIN_ROUTES, AUTH_ROUTES, ONBOARDING_ROUTES, PUBLIC_ROUTES
from helpers import assert_interactive_controls_are_accessible, assert_not_error_page, internal_links, wait_ready


@pytest.mark.comprehensive
def test_all_declared_public_routes(page):
    for route in PUBLIC_ROUTES:
        response = page.goto(route, wait_until="domcontentloaded")
        wait_ready(page)
        assert response.status < 500, f"{route} returned {response.status}"
        assert_not_error_page(page)


@pytest.mark.comprehensive
def test_authenticated_route_crawler(demo_page):
    discovered = set()
    for route in AUTH_ROUTES + ONBOARDING_ROUTES:
        demo_page.goto(route, wait_until="domcontentloaded")
        wait_ready(demo_page)
        assert_not_error_page(demo_page)
        discovered.update(internal_links(demo_page))

    # Follow same-origin links discovered from the authenticated surfaces. Skip obvious
    # state-changing/auth links; their dedicated tests handle those actions explicitly.
    skip = ("/api/", "/login", "/signup", "/logout")
    checked = []
    for href in sorted(discovered):
        if href.startswith(skip) or href.startswith("/admin"):
            continue
        if href in {"/", "/forgot-password", "/reset-password", "/otp"}:
            continue
        checked.append(href)
        response = demo_page.goto(href, wait_until="domcontentloaded")
        wait_ready(demo_page)
        assert response.status < 500, f"{href} returned {response.status}"
        assert_not_error_page(demo_page)

    assert checked, "No authenticated internal links were discovered"


@pytest.mark.comprehensive
def test_admin_route_crawler(admin_page):
    for route in ADMIN_ROUTES:
        admin_page.goto(route, wait_until="domcontentloaded")
        wait_ready(admin_page)
        assert_not_error_page(admin_page)
        assert_interactive_controls_are_accessible(admin_page)


@pytest.mark.comprehensive
def test_no_broken_internal_links_on_landing(page):
    page.goto("/")
    links = internal_links(page)
    assert links
    broken = []
    for href in links:
        if href.startswith("/api/"):
            continue
        response = page.goto(href, wait_until="domcontentloaded")
        wait_ready(page)
        if response.status >= 400:
            broken.append((href, response.status))
    assert not broken, f"Broken internal links: {broken}"


@pytest.mark.comprehensive
def test_responsive_mobile_rendering(browser):
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, ignore_https_errors=True)
    page = ctx.new_page()
    page.set_default_timeout(15000)
    try:
        for route in ["/", "/login", "/signup", "/dashboard", "/browse", "/chat", "/swaps", "/profile", "/wallet"]:
            page.goto(route, wait_until="domcontentloaded")
            wait_ready(page)
            assert_not_error_page(page)
            body_width = page.locator("body").evaluate("e => e.scrollWidth")
            viewport_width = page.evaluate("window.innerWidth")
            assert body_width <= viewport_width + 30, f"Horizontal overflow on {route}: {body_width}>{viewport_width}"
    finally:
        ctx.close()
