"""
Selenium Test 2 - User login (/login)

Covers: empty-form validation, wrong password, password show/hide toggle,
protected-route redirect, and a successful login with the demo account.

Run (with `npm run dev` already running):
    pip install selenium
    python test_2_user_login.py
"""
import os
import unittest

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

BASE_URL = os.getenv("BASE_URL", "http://localhost:3000")
HEADLESS = os.getenv("HEADLESS", "0") == "1"
DEMO_EMAIL = os.getenv("DEMO_EMAIL", "demo@swapspot.test")
DEMO_PASSWORD = os.getenv("DEMO_PASSWORD", "password123")

TOAST = (By.CSS_SELECTOR, "[role='status']")
LOGIN_BUTTON = (By.XPATH, "//form//button[@type='submit']")


def make_driver():
    options = webdriver.ChromeOptions()
    if HEADLESS:
        options.add_argument("--headless=new")
    options.add_argument("--window-size=1400,900")
    return webdriver.Chrome(options=options)


class UserLoginTest(unittest.TestCase):
    def setUp(self):
        self.driver = make_driver()
        self.wait = WebDriverWait(self.driver, 20)

    def tearDown(self):
        self.driver.quit()

    def open_login(self):
        self.driver.get(BASE_URL + "/login")
        self.wait.until(EC.visibility_of_element_located((By.ID, "username")))

    def fill(self, username, password):
        self.driver.find_element(By.ID, "username").send_keys(username)
        self.driver.find_element(By.ID, "password").send_keys(password)
        self.driver.find_element(*LOGIN_BUTTON).click()

    def test_empty_form_shows_error(self):
        self.open_login()
        self.driver.find_element(*LOGIN_BUTTON).click()
        self.wait.until(EC.text_to_be_present_in_element(
            TOAST, "Please enter your username and password."))

    def test_wrong_password_shows_error(self):
        self.open_login()
        self.fill(DEMO_EMAIL, "wrong-password-123")
        self.wait.until(EC.text_to_be_present_in_element(
            TOAST, "Invalid username or password."))
        self.assertIn("/login", self.driver.current_url)

    def test_password_visibility_toggle(self):
        self.open_login()
        pwd = self.driver.find_element(By.ID, "password")
        pwd.send_keys("secret")
        self.assertEqual(pwd.get_attribute("type"), "password")
        toggle = self.driver.find_element(
            By.CSS_SELECTOR, "button[aria-label='Toggle password visibility']")
        toggle.click()
        self.assertEqual(pwd.get_attribute("type"), "text")
        toggle.click()
        self.assertEqual(pwd.get_attribute("type"), "password")

    def test_protected_page_redirects_to_login(self):
        self.driver.get(BASE_URL + "/dashboard")
        self.wait.until(EC.url_contains("/login"))
        self.assertIn("next=%2Fdashboard", self.driver.current_url)

    def test_valid_login_goes_to_dashboard(self):
        self.open_login()
        self.fill(DEMO_EMAIL, DEMO_PASSWORD)
        self.wait.until(EC.url_contains("/dashboard"))
        greeting = self.wait.until(
            EC.visibility_of_element_located((By.XPATH, "//h1[starts-with(normalize-space(), 'Hi ')]"))
        )
        self.assertTrue(greeting.text.startswith("Hi"))
        self.assertIsNotNone(self.driver.get_cookie("swapspot_token"))


if __name__ == "__main__":
    unittest.main(verbosity=2)
