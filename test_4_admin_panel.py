"""
Selenium Test 4 - Admin panel (/admin)

Covers: admin pages are protected, wrong credentials show an error,
correct credentials open the admin dashboard, and Sign out works.

Admin credentials come from ADMIN_EMAIL / ADMIN_PASSWORD env vars
(same names as in .env.local). Defaults match .env.example.

Run (with `npm run dev` already running):
    pip install selenium
    python test_4_admin_panel.py
"""
import os
import unittest

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

BASE_URL = os.getenv("BASE_URL", "http://localhost:3000")
HEADLESS = os.getenv("HEADLESS", "0") == "1"
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@swapspot.test")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin12345")

ERROR_ALERT = (By.CSS_SELECTOR, "p[role='alert']")
SUBMIT = (By.XPATH, "//form//button[@type='submit']")


def make_driver():
    options = webdriver.ChromeOptions()
    if HEADLESS:
        options.add_argument("--headless=new")
    options.add_argument("--window-size=1400,900")
    return webdriver.Chrome(options=options)


class AdminPanelTest(unittest.TestCase):
    def setUp(self):
        self.driver = make_driver()
        self.wait = WebDriverWait(self.driver, 20)

    def tearDown(self):
        self.driver.quit()

    def open_admin_login(self):
        self.driver.get(BASE_URL + "/admin")
        self.wait.until(EC.visibility_of_element_located((By.ID, "admin-email")))

    def sign_in(self, email, password):
        self.driver.find_element(By.ID, "admin-email").send_keys(email)
        self.driver.find_element(By.ID, "admin-password").send_keys(password)
        self.driver.find_element(*SUBMIT).click()

    def test_login_page_heading(self):
        self.open_admin_login()
        heading = self.driver.find_element(By.TAG_NAME, "h1")
        self.assertEqual(heading.text, "SwapSpot Admin")

    def test_admin_pages_require_login(self):
        self.driver.get(BASE_URL + "/admin/users")
        self.wait.until(EC.url_contains("next=%2Fadmin%2Fusers"))
        self.wait.until(EC.visibility_of_element_located((By.ID, "admin-email")))

    def test_wrong_credentials_show_error(self):
        self.open_admin_login()
        self.sign_in(ADMIN_EMAIL, "not-the-password")
        alert = self.wait.until(EC.visibility_of_element_located(ERROR_ALERT))
        self.assertIn("Invalid email or password", alert.text)

    def test_empty_credentials_show_error(self):
        self.open_admin_login()
        self.driver.find_element(*SUBMIT).click()
        alert = self.wait.until(EC.visibility_of_element_located(ERROR_ALERT))
        self.assertIn("required", alert.text)

    def test_login_and_sign_out(self):
        self.open_admin_login()
        self.sign_in(ADMIN_EMAIL, ADMIN_PASSWORD)
        self.wait.until(EC.url_contains("/admin/dashboard"))
        self.assertIsNotNone(self.driver.get_cookie("swapspot_admin"))

        sign_out = self.wait.until(
            EC.element_to_be_clickable((By.XPATH, "//button[normalize-space()='Sign out']"))
        )
        sign_out.click()
        self.wait.until(EC.url_matches(r"/admin/?(\?.*)?$"))
        self.wait.until(EC.visibility_of_element_located((By.ID, "admin-email")))


if __name__ == "__main__":
    unittest.main(verbosity=2)
