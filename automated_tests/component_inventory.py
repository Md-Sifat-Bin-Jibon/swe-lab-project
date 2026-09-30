"""Static inventory helper for the browser suite.

This does not execute React components. It reports every TS/TSX component under
components/ and features/ and the application routes that form the browser entry points.
Use it to detect newly added components/routes that should receive browser coverage.
"""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    components = sorted((ROOT / "components").rglob("*.tsx")) + sorted((ROOT / "features").rglob("*.tsx"))
    routes = sorted((ROOT / "app").rglob("page.tsx"))
    print(f"UI components: {len(components)}")
    for path in components:
        print("COMPONENT", path.relative_to(ROOT).as_posix())
    print(f"Browser route entry points: {len(routes)}")
    for path in routes:
        print("ROUTE", path.relative_to(ROOT).as_posix())


if __name__ == "__main__":
    main()
