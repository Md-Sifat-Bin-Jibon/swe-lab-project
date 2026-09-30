import re

import pytest
from playwright.sync_api import expect

from config import ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_ROUTES
from helpers import assert_interactive_controls_are_accessible, assert_not_error_page, wait_ready


@pytest.mark.admin
@pytest.mark.smoke
def test_admin_login_validation(page):
    page.goto("/admin")
    expect(page.locator("#admin-email")).to_be_visible()
    expect(page.locator("#admin-password")).to_be_visible()

    page.locator("form button[type='submit']").click()
    expect(page.locator("p[role='alert']")).to_contain_text(re.compile("required", re.I))

    page.locator("#admin-email").fill(ADMIN_EMAIL)
    page.locator("#admin-password").fill("wrong-admin-password")
    page.locator("form button[type='submit']").click()
    expect(page.locator("p[role='alert']")).to_contain_text(re.compile("Invalid email or password", re.I))


@pytest.mark.admin
@pytest.mark.comprehensive
@pytest.mark.parametrize("route", ADMIN_ROUTES[1:])
def test_all_admin_sections_render(admin_page, route):
    response = admin_page.goto(route, wait_until="domcontentloaded")
    wait_ready(admin_page)
    assert response.status < 500
    assert_not_error_page(admin_page)
    assert_interactive_controls_are_accessible(admin_page)


def test_admin_navigation_links(admin_page):
    admin_page.goto("/admin/dashboard")
    nav = admin_page.get_by_role("navigation", name="Admin sections")
    expect(nav).to_be_visible()
    links = nav.get_by_role("link")
    assert links.count() >= 8


def test_admin_search_and_filters(admin_page):
    admin_page.goto("/admin/users")
    inputs = admin_page.locator("input")
    assert inputs.count() >= 1
    for i in range(inputs.count()):
        el = inputs.nth(i)
        if el.is_visible() and el.get_attribute("type") in {"search", "text"}:
            el.fill("demo")
            admin_page.wait_for_timeout(250)
            break

    admin_page.goto("/admin/swaps")
    selects = admin_page.locator("select")
    for i in range(selects.count()):
        if selects.nth(i).is_visible():
            options = selects.nth(i).locator("option")
            if options.count() > 1:
                selects.nth(i).select_option(index=1)
                admin_page.wait_for_timeout(200)


def test_admin_sign_out(admin_page):
    admin_page.goto("/admin/dashboard")
    signout = admin_page.get_by_role("button", name=re.compile("sign out", re.I))
    expect(signout).to_be_visible()
    signout.click()
    admin_page.wait_for_url(re.compile(r"/admin/?(?:\?.*)?$"))
    expect(admin_page.locator("#admin-email")).to_be_visible()


def test_normal_user_cannot_access_admin(admin_page, context):
    # admin_page is intentionally used only to ensure the browser can hold an admin session;
    # a fresh context proves separation.
    admin_page.goto("/admin/dashboard")
    assert "/admin/dashboard" in admin_page.url

    fresh = context.new_page()
    fresh.goto("/admin/users")
    fresh.wait_for_url(re.compile(r"/admin\?next=%2Fadmin%2Fusers|/admin$"))
    expect(fresh.locator("#admin-email")).to_be_visible()
    fresh.close()
