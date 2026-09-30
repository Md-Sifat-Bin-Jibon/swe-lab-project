import json
import re
from pathlib import Path
from typing import Generator

import pytest
from playwright.sync_api import Browser, BrowserContext, Page, Playwright, sync_playwright

from config import (
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
    ARTIFACTS,
    BASE_URL,
    BROWSER,
    DEMO_EMAIL,
    DEMO_PASSWORD,
    HEADLESS,
    NAV_TIMEOUT_MS,
    SLOW_MO,
    TIMEOUT_MS,
)


def _launch_browser(pw: Playwright) -> Browser:
    browser_type = getattr(pw, BROWSER, pw.chromium)
    return browser_type.launch(headless=HEADLESS, slow_mo=SLOW_MO)


@pytest.fixture(scope="session")
def browser() -> Generator[Browser, None, None]:
    with sync_playwright() as pw:
        browser = _launch_browser(pw)
        yield browser
        browser.close()


@pytest.fixture
def context(browser: Browser) -> Generator[BrowserContext, None, None]:
    ctx = browser.new_context(
        base_url=BASE_URL,
        viewport={"width": 1440, "height": 1000},
        ignore_https_errors=True,
        record_video_dir=str(ARTIFACTS / "videos"),
    )
    yield ctx
    ctx.close()


@pytest.fixture
def page(context: BrowserContext) -> Generator[Page, None, None]:
    p = context.new_page()
    p.set_default_timeout(TIMEOUT_MS)
    p.set_default_navigation_timeout(NAV_TIMEOUT_MS)
    yield p


@pytest.fixture
def demo_page(context: BrowserContext) -> Generator[Page, None, None]:
    p = context.new_page()
    p.set_default_timeout(TIMEOUT_MS)
    p.set_default_navigation_timeout(NAV_TIMEOUT_MS)
    login_as_demo(p)
    yield p


@pytest.fixture
def admin_page(context: BrowserContext) -> Generator[Page, None, None]:
    p = context.new_page()
    p.set_default_timeout(TIMEOUT_MS)
    p.set_default_navigation_timeout(NAV_TIMEOUT_MS)
    login_as_admin(p)
    yield p


def login_as_demo(page: Page) -> None:
    page.goto("/login", wait_until="domcontentloaded")
    page.locator("#username").fill(DEMO_EMAIL)
    page.locator("#password").fill(DEMO_PASSWORD)
    page.locator("form button[type='submit']").click()
    page.wait_for_url(re.compile(r"/dashboard(?:\?.*)?$"))


def login_as_admin(page: Page) -> None:
    page.goto("/admin", wait_until="domcontentloaded")
    page.locator("#admin-email").fill(ADMIN_EMAIL)
    page.locator("#admin-password").fill(ADMIN_PASSWORD)
    page.locator("form button[type='submit']").click()
    page.wait_for_url(re.compile(r"/admin/dashboard(?:\?.*)?$"))


@pytest.fixture
def capture_browser_errors(page: Page):
    errors: list[str] = []

    def on_console(msg):
        if msg.type == "error":
            errors.append(f"console.error: {msg.text}")

    def on_page_error(exc):
        errors.append(f"pageerror: {exc}")

    page.on("console", on_console)
    page.on("pageerror", on_page_error)
    yield errors


@pytest.fixture(autouse=True)
def attach_failure_artifacts(request, page: Page):
    yield
    if getattr(request.node, "rep_call", None) and request.node.rep_call.failed:
        safe = re.sub(r"[^a-zA-Z0-9_.-]+", "_", request.node.nodeid)[:180]
        try:
            page.screenshot(path=str(ARTIFACTS / f"FAIL_{safe}.png"), full_page=True)
        except Exception:
            pass


def pytest_runtest_makereport(item, call):
    if call.when == "call":
        item.rep_call = call
