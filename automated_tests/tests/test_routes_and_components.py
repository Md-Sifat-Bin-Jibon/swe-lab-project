import re

import pytest
from playwright.sync_api import expect

from config import AUTH_ROUTES, ONBOARDING_ROUTES, SEEDED_PROFILES, SEEDED_SWAP_IDS
from helpers import assert_interactive_controls_are_accessible, assert_not_error_page, internal_links, wait_ready


@pytest.mark.app
@pytest.mark.comprehensive
@pytest.mark.parametrize("route", AUTH_ROUTES)
def test_authenticated_routes_render(demo_page, route, capture_browser_errors):
    response = demo_page.goto(route, wait_until="domcontentloaded")
    wait_ready(demo_page)
    assert response is not None
    assert response.status < 500
    assert_not_error_page(demo_page)
    assert_interactive_controls_are_accessible(demo_page)
    assert not [e for e in capture_browser_errors if "favicon" not in e.lower()], capture_browser_errors


@pytest.mark.app
@pytest.mark.comprehensive
@pytest.mark.parametrize("profile_id", SEEDED_PROFILES)
def test_seeded_profile_pages_render(demo_page, profile_id):
    response = demo_page.goto(f"/profiles/{profile_id}", wait_until="domcontentloaded")
    wait_ready(demo_page)
    assert response.status < 500
    assert_not_error_page(demo_page)
    expect(demo_page.locator("body")).not_to_contain_text("Profile not found")


@pytest.mark.app
@pytest.mark.comprehensive
@pytest.mark.parametrize("swap_id", SEEDED_SWAP_IDS)
def test_seeded_swap_pages_render(demo_page, swap_id):
    response = demo_page.goto(f"/swaps/{swap_id}", wait_until="domcontentloaded")
    wait_ready(demo_page)
    assert response.status < 500
    assert_not_error_page(demo_page)
    expect(demo_page.locator("body")).not_to_contain_text("Swap not found")


@pytest.mark.app
@pytest.mark.comprehensive
@pytest.mark.parametrize("route", ONBOARDING_ROUTES)
def test_onboarding_routes_are_safe(demo_page, route):
    response = demo_page.goto(route, wait_until="domcontentloaded")
    wait_ready(demo_page)
    assert response.status < 500
    assert_not_error_page(demo_page)
    # A completed seeded account may be redirected away from onboarding; either behavior is valid,
    # but an application error is not.
    assert demo_page.url.startswith(demo_page.context.base_url)


def test_browse_filters_and_search(demo_page):
    demo_page.goto("/browse")
    search = demo_page.get_by_placeholder("Search by name, skill or location")
    expect(search).to_be_visible()
    search.fill("Eric")
    demo_page.wait_for_timeout(500)
    expect(demo_page.locator("body")).to_contain_text("Eric")

    hide = demo_page.get_by_role("button", name=re.compile("filter", re.I))
    if hide.count():
        hide.first.click()
        hide.first.click()


def test_browse_filter_dropdowns(demo_page):
    demo_page.goto("/browse")
    for placeholder in ["Select Skills", "Any location", "All members"]:
        loc = demo_page.get_by_placeholder(placeholder)
        if loc.count():
            loc.first.click()
            demo_page.wait_for_timeout(150)
            # Close an opened dropdown using Escape without assuming a particular implementation.
            demo_page.keyboard.press("Escape")


def test_profile_edit_controls(demo_page):
    demo_page.goto("/profile")
    for field in ["profile-full-name", "profile-phone", "profile-location", "profile-avatar", "profile-bio", "profile-offer", "profile-want"]:
        expect(demo_page.locator(f"#{field}")).to_be_visible()

    # Exercise the edit/save state without changing persisted values.
    name = demo_page.locator("#profile-full-name")
    original = name.input_value()
    name.fill(original)
    save = demo_page.get_by_role("button", name=re.compile("save", re.I))
    if save.count():
        save.first.click()
        demo_page.wait_for_timeout(500)


def test_wallet_add_funds_ui(demo_page):
    demo_page.goto("/wallet")
    expect(demo_page.locator("body")).to_contain_text(re.compile("wallet", re.I))
    buttons = demo_page.get_by_role("button")
    assert buttons.count() >= 1

    # Open the funds form if present; don't submit a real payment.
    add = demo_page.get_by_role("button", name=re.compile("add|fund|deposit", re.I))
    if add.count():
        add.first.click()
        expect(demo_page.locator("body")).to_contain_text(re.compile("amount", re.I))


def test_verify_identity_ui(demo_page):
    demo_page.goto("/verify")
    expect(demo_page.locator("body")).to_contain_text(re.compile("identity|verification", re.I))
    checkboxes = demo_page.locator("input[type='checkbox']")
    if checkboxes.count():
        checkboxes.first.check()
        checkboxes.first.uncheck()


def test_chat_inbox_and_message_controls(demo_page):
    demo_page.goto("/chat")
    expect(demo_page.get_by_role("region").first).to_be_visible() if demo_page.get_by_role("region").count() else None
    conversations = demo_page.get_by_role("button")
    assert conversations.count() > 0

    text_box = demo_page.get_by_placeholder("Type a message...")
    if text_box.count():
        expect(text_box).to_be_visible()
        send = demo_page.get_by_role("button", name=re.compile("send message", re.I))
        expect(send).to_be_visible()


def test_swap_proposal_form_validation(demo_page):
    demo_page.goto("/swaps/propose?partnerId=eric")
    expect(demo_page.locator("#your-offer")).to_be_visible()
    expect(demo_page.locator("#want-in-return")).to_be_visible()
    expect(demo_page.locator("#swap-details")).to_be_visible()
    expect(demo_page.locator("#swap-duration")).to_be_visible()
    expect(demo_page.locator("#deposit")).to_be_visible()

    demo_page.locator("form button[type='submit']").click()
    expect(demo_page.locator("body")).not_to_contain_text("Application Error")


def test_projects_component_on_profile(demo_page):
    demo_page.goto("/profile")
    heading = demo_page.locator("#projects-heading")
    if heading.count():
        expect(heading).to_be_visible()
        add = demo_page.get_by_role("button", name=re.compile("add project", re.I))
        if add.count():
            add.first.click()
            expect(demo_page.locator("#project-title")).to_be_visible()
            expect(demo_page.locator("#project-description")).to_be_visible()
            close = demo_page.get_by_role("button", name=re.compile("cancel|close", re.I))
            if close.count():
                close.last.click()
