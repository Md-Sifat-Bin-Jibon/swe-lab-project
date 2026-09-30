import os
from pathlib import Path

BASE_URL = os.getenv("BASE_URL", "http://127.0.0.1:3000").rstrip("/")
HEADLESS = os.getenv("HEADLESS", "1") == "1"
SLOW_MO = int(os.getenv("SLOW_MO", "0"))
BROWSER = os.getenv("BROWSER", "chromium").lower()
TIMEOUT_MS = int(os.getenv("PW_TIMEOUT_MS", "15000"))
NAV_TIMEOUT_MS = int(os.getenv("PW_NAV_TIMEOUT_MS", "25000"))

DEMO_EMAIL = os.getenv("DEMO_EMAIL", "demo@swapspot.test")
DEMO_PASSWORD = os.getenv("DEMO_PASSWORD", "password123")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@swapspot.test")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin12345")

ARTIFACTS = Path(os.getenv("TEST_ARTIFACTS", Path(__file__).parent / "artifacts"))
ARTIFACTS.mkdir(parents=True, exist_ok=True)

# Seeded users/profiles in lib/seed.ts.
SEEDED_PROFILES = ["eric", "neha", "boston"]
SEEDED_SWAP_IDS = [
    "ongoing-eric",
    "ongoing-boston",
    "proposal-neha",
    "proposal-eric",
    "completed-neha",
    "completed-boston",
]

PUBLIC_ROUTES = [
    "/",
    "/login",
    "/signup",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/otp",
    "/api-docs",
]

AUTH_ROUTES = [
    "/dashboard",
    "/profile",
    "/browse",
    "/chat",
    "/swaps",
    "/swaps/ongoing-boston",
    "/swaps/proposal-neha",
    "/swaps/completed-neha",
    "/swaps/propose?partnerId=eric",
    "/profiles/eric",
    "/wallet",
    "/verify",
]

ONBOARDING_ROUTES = [
    "/onboarding/1",
    "/onboarding/2",
    "/onboarding/3",
    "/onboarding/4",
    "/onboarding/complete",
]

ADMIN_ROUTES = [
    "/admin",
    "/admin/dashboard",
    "/admin/users",
    "/admin/users/demo-user",
    "/admin/verifications",
    "/admin/projects",
    "/admin/swaps",
    "/admin/wallet",
    "/admin/chat",
    "/admin/activity",
    "/admin/audit",
    "/admin/meetings",
    "/admin/moderation",
    "/admin/settings",
]
