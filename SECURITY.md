# Security Policy

## Supported version

Security fixes are applied to the latest version on the `main` branch.

## Reporting a vulnerability

Please use GitHub's private vulnerability reporting flow from the repository's **Security** tab.
Do not publish secrets, personal data, database contents, or an exploitable proof of concept in a
public issue.

Include the affected version, reproduction steps, expected impact, and any safe mitigation you
have identified. Reports will be reviewed before details are disclosed publicly.

## Local-data boundary

Focus Cockpit is local-first. Real databases, imported credentials, backups, thumbnails, local
paths, and environment files must never be committed to the public repository.
