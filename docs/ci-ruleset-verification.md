# CI Ruleset verification (temporary PR)

This file is a harmless marker for verifying the `main-pr-ci` GitHub branch ruleset.

- Scope: temporary pull request only; **do not merge**.
- Required check: `Validate (test, lint, build)` from GitHub Actions.
- Expected: pending/failed checks prevent merging; a successful check permits merging, subject to the other rules.
- No application, dependencies, production settings, or workflows are changed by this marker.
- Cleanup: close the verification PR without merging after checking its behavior.
