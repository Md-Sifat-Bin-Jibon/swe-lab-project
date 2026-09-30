# SwapSpot Full Browser Automation (Python + Playwright)

This suite is built specifically for the SwapSpot project in the parent directory.
It uses **Python + pytest + Playwright** and drives a real browser. It does not replace
business logic/unit tests; instead it verifies the application as a user/admin would see it.

## Coverage

- Landing page and public navigation
- Login, logout, password visibility and invalid credentials
- Signup/register validation
- Forgot/reset-password surfaces
- Protected-route redirects
- Demo-user dashboard, profile, browse, public profiles, swaps, swap details, proposal form
- Chat UI and message composer
- Wallet and add-funds UI
- Identity-verification UI
- Project editor/viewer UI when exposed by seeded data
- Meeting UI when exposed by the current state
- Onboarding route safety
- All admin sections and admin navigation
- Admin login/logout and invalid credentials
- Browser-level authorization checks
- Auth cookie security attributes
- Invalid profile/swap IDs
- Health/OpenAPI reachability
- Internal-link crawling
- Mobile rendering / horizontal-overflow smoke check
- Console/page-error monitoring
- Accessible names/identifiers for visible controls
- Core-surface screenshots on every comprehensive run

## Install

From the project root:

```bash
python -m venv .venv
# Windows:
.venv\\Scripts\\activate
# Linux/macOS:
source .venv/bin/activate

pip install -r automated_tests/requirements.txt
python -m playwright install chromium
```

For all supported browsers:

```bash
python -m playwright install chromium firefox webkit
```

The application itself still needs its normal Node.js setup:

```bash
npm install
```

## Run everything

The runner starts `npm run dev` automatically if port 3000 is not already serving the app:

```bash
python automated_tests/run_tests.py
```

If the app is already running:

```bash
python automated_tests/run_tests.py --no-server
```

Show the browser:

```bash
python automated_tests/run_tests.py --headed
```

Smoke suite only:

```bash
python automated_tests/run_tests.py -m smoke
```

Comprehensive suite:

```bash
python automated_tests/run_tests.py -m comprehensive
```

Firefox/WebKit:

```bash
python automated_tests/run_tests.py --browser firefox
python automated_tests/run_tests.py --browser webkit
```

## Configuration

Environment variables:

```text
BASE_URL=http://127.0.0.1:3000
HEADLESS=1
BROWSER=chromium
PW_TIMEOUT_MS=15000
PW_NAV_TIMEOUT_MS=25000
DEMO_EMAIL=demo@swapspot.test
DEMO_PASSWORD=password123
ADMIN_EMAIL=admin@swapspot.test
ADMIN_PASSWORD=admin12345
TEST_ARTIFACTS=automated_tests/artifacts
```

The suite intentionally uses the seeded demo/admin accounts by default because they are
part of this repository's documented test environment.

## Artifacts

After a run, inspect:

```text
automated_tests/artifacts/
  junit.xml
  surface_dashboard.png
  surface_browse.png
  surface_profile.png
  surface_swaps.png
  surface_chat.png
  surface_wallet.png
  surface_verify.png
  FAIL_*.png
  videos/
```

For debugging a failed Playwright test, run headed mode and narrow the test with `-k`.

## Important scope note

Browser automation cannot literally execute every internal TypeScript function independently.
This suite therefore combines route coverage, UI/component interaction, business workflows,
authorization checks, navigation crawling, and browser error monitoring. Internal pure
functions should additionally receive unit tests if you want code-level coverage metrics.
