import re
import time

import pytest
from playwright.sync_api import expect

from config import DEMO_EMAIL, DEMO_PASSWORD


@pytest.mark.workflow
@pytest.mark.app
def test_profile_to_public_profile_workflow(demo_page):
    demo_page.goto("/profile")
    expect(demo_page.locator("body")).to_contain_text(re.compile("Dwiky Ahmad|Profile", re.I))

    public_link = demo_page.get_by_role("link", name=re.compile("view|profile", re.I))
    if public_link.count():
        href = public_link.first.get_attribute("href")
        if href and href.startswith("/profiles/"):
            public_link.first.click()
            demo_page.wait_for_load_state("domcontentloaded")
            expect(demo_page.locator("body")).not_to_contain_text("Application Error")


@pytest.mark.workflow
@pytest.mark.app
def test_browse_to_propose_swap_workflow(demo_page):
    demo_page.goto("/browse")
    eric = demo_page.get_by_text(re.compile("Eric Yates", re.I))
    expect(eric.first).to_be_visible()

    profile_links = demo_page.locator("a[href*='/profiles/eric']")
    if profile_links.count():
        profile_links.first.click()
        demo_page.wait_for_load_state("domcontentloaded")
        propose = demo_page.get_by_role("link", name=re.compile("swap|propose", re.I))
        if propose.count():
            propose.first.click()
            demo_page.wait_for_url(re.compile(r"/swaps/propose"))
            expect(demo_page.locator("#your-offer")).to_be_visible()


@pytest.mark.workflow
@pytest.mark.app
def test_existing_swap_detail_task_and_action_controls(demo_page):
    demo_page.goto("/swaps/ongoing-boston")
    expect(demo_page.locator("body")).not_to_contain_text("Swap not found")

    # Exercise the task panel if present, without completing or disputing the seeded swap.
    task_input = demo_page.get_by_role("textbox", name="New to-do")
    if task_input.count():
        expect(task_input).to_be_visible()
        due = demo_page.get_by_role("textbox", name="Due date (optional)")
        if due.count():
            expect(due).to_be_visible()

    chat = demo_page.get_by_role("button", name="Open chat")
    if chat.count():
        chat.first.click()
        demo_page.wait_for_timeout(300)


@pytest.mark.workflow
@pytest.mark.app
def test_chat_moderation_browser_flow(demo_page):
    demo_page.goto("/chat")
    message = demo_page.get_by_placeholder("Type a message...")
    if not message.count():
        pytest.skip("No active seeded conversation/message composer rendered")

    message.fill("hello from automated browser test")
    send = demo_page.get_by_role("button", name="Send message")
    expect(send).to_be_enabled()
    send.click()
    demo_page.wait_for_timeout(600)
    expect(demo_page.locator("body")).not_to_contain_text("Application Error")


@pytest.mark.workflow
@pytest.mark.app
def test_meeting_panel_if_available(demo_page):
    # Meetings are rendered in the dashboard/profile/swap surfaces depending on state.
    demo_page.goto("/dashboard")
    body = demo_page.locator("body")
    if body.get_by_text(re.compile("meeting", re.I)).count() == 0:
        pytest.skip("No meeting panel exposed by the current seeded dashboard")

    create = demo_page.get_by_role("button", name=re.compile("schedule|create|meeting", re.I))
    if create.count():
        create.first.click()
        if demo_page.locator("#meeting-title").count():
            expect(demo_page.locator("#meeting-title")).to_be_visible()
            expect(demo_page.locator("#meeting-start")).to_be_visible()
            expect(demo_page.locator("#meeting-duration")).to_be_visible()
            expect(demo_page.locator("#meeting-agenda")).to_be_visible()
