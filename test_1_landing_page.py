"""
Selenium Test 1 - Landing page (/)

Checks that the SwapSpot home page loads, shows the hero heading,
and that the "Sign In" and "Join" buttons go to the right pages.

Run (with `npm run dev` already running):
    pip install selenium
    python test_1_landing_page.py
"""
import os
import unittest

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

BASE_URL = os.getenv("BASE_URL", "http://localhost:3000")
HEADLESS = os.getenv("HEADLESS", "0") == "1"


def make_driver():
    options = webdriver.ChromeOptions()
    if HEADLESS:
        options.add_argument("--headless=new")
    options.add_argument("--window-size=1400,900")
    return webdriver.Chrome(options=options)


class LandingPageTest(unittest.TestCase):
    def setUp(self):
        self.driver = make_driver()
        self.wait = WebDriverWait(self.driver, 20)  # first dev compile can be slow
        self.driver.get(BASE_URL + "/")

    def tearDown(self):
        self.driver.quit()

    def test_page_title(self):
        self.wait.until(EC.title_contains("SwapSpot"))
        self.assertIn("SwapSpot", self.driver.title)

    def test_hero_heading_visible(self):
        heading = self.wait.until(
            EC.visibility_of_element_located((By.ID, "landing-heading"))
        )
        self.assertIn("Skill Swap Marketplace", heading.text)

    def test_hero_search_box_present(self):
        search = self.wait.until(
            EC.presence_of_element_located((By.ID, "hero-skill-search"))
        )
        search.send_keys("Web Design")
        self.assertEqual(search.get_attribute("value"), "Web Design")

    def test_sign_in_button_opens_login(self):
        link = self.wait.until(
            EC.element_to_be_clickable((By.XPATH, "//header//a[normalize-space()='Sign In']"))
        )
        link.click()
        self.wait.until(EC.url_contains("/login"))
        self.assertIn("/login", self.driver.current_url)

    def test_join_button_opens_signup(self):
        link = self.wait.until(
            EC.element_to_be_clickable((By.XPATH, "//header//a[normalize-space()='Join']"))
        )
        link.click()
        self.wait.until(EC.url_contains("/signup"))
        self.assertIn("/signup", self.driver.current_url)


if __name__ == "__main__":
    unittest.main(verbosity=2)
