import re
import time

import pytest
from playwright.sync_api import expect

from config import DEMO_EMAIL, DEMO_PASSWORD, PUBLIC_ROUTES
from helpers import assert_interactive_controls_are_accessible, assert_not_error_page, wait_ready


@pytest.mark.public
@pytest.mark.smoke
@pytest.mark.parametrize("route", PUBLIC_ROUTES)
def test_public_route_loads_without_application_error(page, route):
    response = page.goto(route, wait_until="domcontentloaded")
    wait_ready(page)
    assert response is not None
    assert response.status < 500
    assert_not_error_page(page)
    assert_interactive_controls_are_accessible(page)


def test_landing_navigation(page):
    page.goto("/")
    expect(page.get_by_role("link", name=re.compile("Sign In", re.I)).first).to_be_visible()
    expect(page.get_by_role("link", name=re.compile("Join", re.I)).first).to_be_visible()

    page.get_by_role("link", name=re.compile("Sign In", re.I)).first.click()
    page.wait_for_url(re.compile(r"/login"))
    page.go_back()
    page.get_by_role("link", name=re.compile("Join", re.I)).first.click()
    page.wait_for_url(re.compile(r"/signup"))


def test_login_validation_and_password_toggle(page):
    page.goto("/login")
    submit = page.locator("form button[type='submit']")
    submit.click()
    expect(page.locator("[role='status']")).to_contain_text("Please enter your username and password")

    password = page.locator("#password")
    password.fill("secret")
    toggle = page.get_by_role("button", name="Toggle password visibility")
    expect(password).to_have_attribute("type", "password")
    toggle.click()
    expect(password).to_have_attribute("type", "text")
    toggle.click()
    expect(password).to_have_attribute("type", "password")


def test_wrong_login_stays_on_login(page):
    page.goto("/login")
    page.locator("#username").fill(DEMO_EMAIL)
    page.locator("#password").fill("definitely-wrong")
    page.locator("form button[type='submit']").click()
    expect(page.locator("[role='status']")).to_contain_text("Invalid username or password")
    expect(page).to_have_url(re.compile(r"/login"))


def test_valid_login_logout(page):
    page.goto("/login")
    page.locator("#username").fill(DEMO_EMAIL)
    page.locator("#password").fill(DEMO_PASSWORD)
    page.locator("form button[type='submit']").click()
    page.wait_for_url(re.compile(r"/dashboard(?:\?.*)?$"))
    expect(page.locator("h1").first).to_contain_text("Hi")
    assert any(c["name"] == "swapspot_token" for c in page.context.cookies())

    signout = page.get_by_role("button", name=re.compile("Sign out", re.I))
    if signout.count():
        signout.first.click()
    else:
        page.get_by_role("link", name=re.compile("Sign out", re.I)).first.click()
    page.wait_for_url(re.compile(r"/login"))


def test_protected_route_redirects_to_login(page):
    page.goto("/dashboard")
    page.wait_for_url(re.compile(r"/login\?next=%2Fdashboard"))
    expect(page.locator("#username")).to_be_visible()


def test_signup_validation(page):
    page.goto("/signup")
    for field in ("username", "email", "password", "confirm-password"):
        expect(page.locator(f"#{field}")).to_be_visible()

    page.locator("form button[type='submit']").click()
    expect(page.locator("[role='status']")).to_contain_text("Please fill in all fields")

    page.locator("#username").fill("browser_test_user")
    page.locator("#email").fill("browser-test@example.com")
    page.locator("#password").fill("Password123!")
    page.locator("#confirm-password").fill("Different123!")
    page.locator("form button[type='submit']").click()
    expect(page.locator("[role='status']")).to_contain_text("Passwords do not match")


def test_register_alias_redirects_to_signup(page):
    page.goto("/register")
    page.wait_for_url(re.compile(r"/signup"))


def test_forgot_password_form(page):
    page.goto("/forgot-password")
    expect(page.locator("input").first).to_be_visible()
    buttons = page.get_by_role("button")
    assert buttons.count() >= 1
    buttons.last.click()
    expect(page.locator("body")).not_to_contain_text("Application Error")
