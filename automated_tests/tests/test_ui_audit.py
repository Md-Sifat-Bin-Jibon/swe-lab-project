import json
import re

import pytest
from playwright.sync_api import expect

from config import AUTH_ROUTES, ADMIN_ROUTES, ARTIFACTS, PUBLIC_ROUTES
from helpers import assert_interactive_controls_are_accessible, assert_not_error_page, wait_ready


@pytest.mark.comprehensive
def test_public_pages_have_no_unexpected_browser_errors(page, capture_browser_errors):
    for route in PUBLIC_ROUTES:
        page.goto(route, wait_until="domcontentloaded")
        wait_ready(page)
        assert_not_error_page(page)
    unexpected = [x for x in capture_browser_errors if not re.search(r"favicon|Failed to load resource.*404", x, re.I)]
    assert not unexpected, "Browser console/page errors found: " + json.dumps(unexpected, indent=2)


@pytest.mark.comprehensive
def test_authenticated_pages_have_no_unexpected_browser_errors(demo_page, capture_browser_errors):
    for route in AUTH_ROUTES:
        demo_page.goto(route, wait_until="domcontentloaded")
        wait_ready(demo_page)
        assert_not_error_page(demo_page)
    unexpected = [x for x in capture_browser_errors if not re.search(r"favicon|Failed to load resource.*404", x, re.I)]
    assert not unexpected, "Browser console/page errors found: " + json.dumps(unexpected, indent=2)


@pytest.mark.comprehensive
def test_admin_pages_have_no_unexpected_browser_errors(admin_page, capture_browser_errors):
    for route in ADMIN_ROUTES:
        admin_page.goto(route, wait_until="domcontentloaded")
        wait_ready(admin_page)
        assert_not_error_page(admin_page)
    unexpected = [x for x in capture_browser_errors if not re.search(r"favicon|Failed to load resource.*404", x, re.I)]
    assert not unexpected, "Browser console/page errors found: " + json.dumps(unexpected, indent=2)


@pytest.mark.comprehensive
def test_forms_have_labels_or_accessible_names(page):
    for route in ["/login", "/signup", "/forgot-password", "/reset-password", "/admin"]:
        page.goto(route, wait_until="domcontentloaded")
        wait_ready(page)
        controls = page.locator("input:not([type='hidden']), textarea, select")
        for i in range(controls.count()):
            control = controls.nth(i)
            if not control.is_visible():
                continue
            identifier = control.get_attribute("id") or control.get_attribute("name") or control.get_attribute("aria-label")
            assert identifier, f"Unlabelled form control on {route}"


@pytest.mark.comprehensive
def test_screenshots_of_core_surfaces(demo_page):
    surfaces = [
        ("dashboard", "/dashboard"),
        ("browse", "/browse"),
        ("profile", "/profile"),
        ("swaps", "/swaps"),
        ("chat", "/chat"),
        ("wallet", "/wallet"),
        ("verify", "/verify"),
    ]
    for name, route in surfaces:
        demo_page.goto(route, wait_until="domcontentloaded")
        wait_ready(demo_page)
        demo_page.screenshot(path=str(ARTIFACTS / f"surface_{name}.png"), full_page=True)
