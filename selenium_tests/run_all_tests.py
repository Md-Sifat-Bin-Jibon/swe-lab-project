"""Runs all 4 Selenium test scripts. Start the app first with `npm run dev`."""
import os
import sys
import unittest

suite = unittest.defaultTestLoader.discover(os.path.dirname(os.path.abspath(__file__)), pattern="test_*.py")
result = unittest.TextTestRunner(verbosity=2).run(suite)
sys.exit(0 if result.wasSuccessful() else 1)
