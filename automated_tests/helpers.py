import re
from pathlib import Path
from typing import Iterable

from playwright.sync_api import Locator, Page, expect

from config import ARTIFACTS, BASE_URL, TIMEOUT_MS


def wait_ready(page: Page) -> None:
    page.wait_for_load_state("domcontentloaded")
    page.wait_for_timeout(250)


def assert_no_http_5xx(page: Page) -> None:
    failures: list[str] = []

    def on_response(response):
        if response.status >= 500:
            failures.append(f"{response.status} {response.url}")

    page.on("response", on_response)
    yield failures


def internal_links(page: Page) -> list[str]:
    hrefs = page.locator("a[href]").evaluate_all(
        "els => els.map(a => a.getAttribute('href')).filter(Boolean)"
    )
    result = []
    for href in hrefs:
        if not href or href.startswith(("#", "mailto:", "tel:", "javascript:")):
            continue
        if href.startswith("/"):
            result.append(href)
    return sorted(set(result))


def assert_interactive_controls_are_accessible(page: Page) -> None:
    controls = page.locator("button, input, textarea, select, a[href]")
    count = controls.count()
    assert count > 0, f"No interactive controls found on {page.url}"

    for i in range(count):
        el = controls.nth(i)
        if not el.is_visible():
            continue
        tag = el.evaluate("e => e.tagName.toLowerCase()")
        if tag == "button":
            name = el.inner_text().strip() or el.get_attribute("aria-label")
            assert name, f"Visible button without text/aria-label on {page.url}"
        elif tag in {"input", "textarea", "select"}:
            if el.get_attribute("type") == "hidden":
                continue
            accessible = el.get_attribute("aria-label") or el.get_attribute("id") or el.get_attribute("name")
            assert accessible, f"Form control without id/name/aria-label on {page.url}"


def visible_text(page: Page) -> str:
    return page.locator("body").inner_text(timeout=TIMEOUT_MS)


def assert_not_error_page(page: Page) -> None:
    text = visible_text(page).lower()
    bad_markers = [
        "application error",
        "internal server error",
        "unhandled runtime error",
        "500: internal server error",
    ]
    for marker in bad_markers:
        assert marker not in text, f"Error marker '{marker}' found on {page.url}"


def save_snapshot(page: Page, name: str) -> Path:
    safe = re.sub(r"[^a-zA-Z0-9_.-]+", "_", name)
    path = ARTIFACTS / f"{safe}.png"
    page.screenshot(path=str(path), full_page=True)
    return path


def first_visible(locator: Locator) -> Locator | None:
    for i in range(locator.count()):
        item = locator.nth(i)
        if item.is_visible():
            return item
    return None


def click_text(page: Page, text: str, exact: bool = True) -> None:
    loc = page.get_by_role("button", name=text, exact=exact)
    if loc.count() == 0:
        loc = page.get_by_text(text, exact=exact)
    loc.first.click()
