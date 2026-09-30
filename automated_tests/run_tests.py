#!/usr/bin/env python3
"""One-command runner for the SwapSpot browser test suite.

Examples:
  python automated_tests/run_tests.py
  python automated_tests/run_tests.py --no-server
  python automated_tests/run_tests.py --headed -m smoke
  python automated_tests/run_tests.py -m comprehensive --browser chromium
"""
from __future__ import annotations

import argparse
import os
import socket
import subprocess
import sys
import time
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
TEST_DIR = ROOT / "automated_tests"
BASE_URL = os.getenv("BASE_URL", "http://127.0.0.1:3000").rstrip("/")


def server_ready(url: str) -> bool:
    try:
        req = Request(url, method="GET")
        with urlopen(req, timeout=1.5) as r:
            return r.status < 500
    except Exception:
        return False


def start_server() -> subprocess.Popen | None:
    if server_ready(BASE_URL + "/api/health"):
        print(f"[runner] Existing server detected at {BASE_URL}")
        return None

    env = os.environ.copy()
    env.setdefault("HOSTNAME", "127.0.0.1")
    print("[runner] Starting Next.js development server...")
    proc = subprocess.Popen(
        ["npm", "run", "dev", "--", "--hostname", "127.0.0.1"],
        cwd=ROOT,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )
    deadline = time.time() + 60
    while time.time() < deadline:
        if server_ready(BASE_URL + "/api/health"):
            print(f"[runner] Server ready at {BASE_URL}")
            return proc
        if proc.poll() is not None:
            output = proc.stdout.read() if proc.stdout else ""
            raise RuntimeError("Next.js server exited before becoming ready.\n" + output[-5000:])
        time.sleep(0.5)
    proc.terminate()
    raise TimeoutError(f"Server did not become ready at {BASE_URL} within 60 seconds")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--no-server", action="store_true", help="Do not start Next.js; use an already-running server")
    parser.add_argument("--headed", action="store_true", help="Show the browser")
    parser.add_argument("--browser", choices=["chromium", "firefox", "webkit"], default=os.getenv("BROWSER", "chromium"))
    parser.add_argument("-m", "--marker", default=None, help="Pytest marker expression, e.g. smoke or comprehensive")
    parser.add_argument("-k", default=None, help="Pytest -k expression")
    parser.add_argument("--workers", default="1", help="Pytest-xdist workers if installed; default 1")
    args = parser.parse_args()

    os.environ["BASE_URL"] = BASE_URL
    os.environ["HEADLESS"] = "0" if args.headed else "1"
    os.environ["BROWSER"] = args.browser

    server = None
    try:
        if not args.no_server:
            server = start_server()
        elif not server_ready(BASE_URL + "/api/health"):
            print(f"[runner] No server available at {BASE_URL}", file=sys.stderr)
            return 2

        cmd = [sys.executable, "-m", "pytest", str(TEST_DIR / "tests"), "--junitxml=" + str(TEST_DIR / "artifacts" / "junit.xml")]
        if args.marker:
            cmd += ["-m", args.marker]
        if args.k:
            cmd += ["-k", args.k]

        print("[runner]", " ".join(cmd))
        return subprocess.call(cmd, cwd=ROOT)
    finally:
        if server is not None and server.poll() is None:
            print("[runner] Stopping temporary Next.js server...")
            server.terminate()
            try:
                server.wait(timeout=8)
            except subprocess.TimeoutExpired:
                server.kill()


if __name__ == "__main__":
    raise SystemExit(main())
