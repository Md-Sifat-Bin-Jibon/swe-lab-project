"""
Selenium Test 3 - Sign-up form (/signup)

Covers client-side validation of the registration form and navigation.
It does NOT create a real account (that would send an OTP email),
except test_register_new_user, which is skipped unless RUN_REGISTER=1.

Run (with `npm run dev` already running):
    pip install selenium
    python test_3_signup_validation.py
"""
import os
import time
import unittest

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

BASE_URL = os.getenv("BASE_URL", "http://localhost:3000")
HEADLESS = os.getenv("HEADLESS", "0") == "1"
RUN_REGISTER = os.getenv("RUN_REGISTER", "0") == "1"

TOAST = (By.CSS_SELECTOR, "[role='status']")
REGISTER_BUTTON = (By.XPATH, "//form//button[@type='submit']")


def make_driver():
    options = webdriver.ChromeOptions()
    if HEADLESS:
        options.add_argument("--headless=new")
    options.add_argument("--window-size=1400,900")
    return webdriver.Chrome(options=options)


class SignupValidationTest(unittest.TestCase):
    def setUp(self):
        self.driver = make_driver()
        self.wait = WebDriverWait(self.driver, 20)
        self.driver.get(BASE_URL + "/signup")
        self.wait.until(EC.visibility_of_element_located((By.ID, "email")))

    def tearDown(self):
        self.driver.quit()

    def fill(self, username, email, password, confirm):
        d = self.driver
        d.find_element(By.ID, "username").send_keys(username)
        d.find_element(By.ID, "email").send_keys(email)
        d.find_element(By.ID, "password").send_keys(password)
        d.find_element(By.ID, "confirm-password").send_keys(confirm)
        d.find_element(*REGISTER_BUTTON).click()

    def test_form_fields_present(self):
        for field_id in ("username", "email", "password", "confirm-password"):
            self.assertTrue(self.driver.find_element(By.ID, field_id).is_displayed())

    def test_register_route_redirects_to_signup(self):
        self.driver.get(BASE_URL + "/register")
        self.wait.until(EC.url_contains("/signup"))

    def test_empty_form_shows_error(self):
        self.driver.find_element(*REGISTER_BUTTON).click()
        self.wait.until(EC.text_to_be_present_in_element(
            TOAST, "Please fill in all fields."))

    def test_password_mismatch_shows_error(self):
        self.fill("seleniumuser", "selenium@example.com", "Password123!", "Different123!")
        self.wait.until(EC.text_to_be_present_in_element(
            TOAST, "Passwords do not match."))
        self.assertIn("/signup", self.driver.current_url)

    def test_sign_in_link_opens_login(self):
        self.driver.find_element(By.XPATH, "//a[normalize-space()='Sign in']").click()
        self.wait.until(EC.url_contains("/login"))

    @unittest.skipUnless(RUN_REGISTER, "set RUN_REGISTER=1 to create a real test account")
    def test_register_new_user(self):
        stamp = int(time.time())
        email = f"selenium{stamp}@example.com"
        self.fill(f"selenium{stamp}", email, "Password123!", "Password123!")
        self.wait.until(EC.url_contains("/otp"))
        self.assertIn("selenium", self.driver.current_url)


if __name__ == "__main__":
    unittest.main(verbosity=2)
