# Product

## Register

product

## Platform

web

## Users

Primary: a single authorized user (the author) today, tracking personal finances in COP. Opens the app on a phone throughout the day — on mobile web / PWA — and occasionally on desktop to review a month in depth.

Secondary (planned, not yet present): future forkers who self-host the open-source release and adapt it to their own currency, categories, and accounts. Design decisions must not hardcode the author's identity into critical UI; tokens and copy stay easy to retheme and reword.

## Product Purpose

A personal expense tracker and budget manager that gives one person a calm, honest view of their money: where it stands today, what was spent, and whether the budget is on track. Built for a fast daily ritual of recording and reviewing — including SMS / shortcut automation — rather than for periodic bookkeeping sessions. Success is a 30-second glance that tells the user, without spin, whether they are on or off course.

## Positioning

A single-user finance tool tuned to its owner's real categories, currency, and card-payment flow — the numbers and their deltas in plain view, with no generic-template opinions and no cheerful framing of bad news.

## Brand Personality

Calm, clear, trustworthy. Reads like a well-kept ledger, not a bank app or a fintech demo. Voice is plain and direct; copy states what happened, not how the user should feel about it. No marketing tone, no upsells, no celebratory framing of overspending, no alarm fatigue. Trust is earned by showing the truth (good or bad) without softening.

## Anti-references

- **Bank-app chrome** — banner promotions, sticky upsells, sidebar ads, fine-print disclaimers. The product has nothing to sell its user.
- **Gamified budget guilt** — celebratory green checkmarks on over-budget months, confetti, streak mendacity. Overspending is reported, not styled away.
- **Generic SaaS slop** — hero-metric template (big number + supporting stats + gradient accent), identical icon+heading+text card grids, the cream / sand / warm-neutral bg default.
- **Notion-template vibes** — raw tables with no editorial opinion, leaving the work of interpretation to the user every session.
- **Alarm fatigue** — shrill red everywhere on load, multiple toast interruptions competing for attention.

## Design Principles

- **Show, don't tell.** Numbers and their deltas carry the meaning. Prose descriptions of "what happened this month" are filler; the data already says it. Let it.
- **Honest signal.** Bad news surfaces plainly. Over-budget is over-budget; a card payment due is due. No softening through color or framing, and no amplifying into alarm either — the level of visual urgency matches the level of financial urgency.
- **One screen, one job.** Each view has a primary action; everything else supports it. Dashboard = orient. Transactions = record or review. Accounts = reconcile balances and card payments. Budgets = course-correct. Don't blur these inside one screen.
- **Fast daily ritual.** The app rewards quick opens; friction is the enemy. A 30-second check should land without scrolling for the primary number. Recording one transaction should not exceed the minimum taps the data requires.
- **Practice what you preach.** Calm brand means calm UI: no jarring motion, no alarm fatigue, no gradient虚荣. Trustworthy means legible: every body text meets contrast, no muted-gray-for-elegance excuses.

## Accessibility & Inclusion

Target **WCAG 2.1 AA**: body text ≥4.5:1 contrast, large text ≥3:1, every interactive element keyboard-reachable with a visible focus ring, color-blind-safe palette (encoding never relies on hue alone — icons, position, and text labels carry meaning). `prefers-reduced-motion: reduce` is honored globally (already implemented in `globals.css`) and applies to every animation introduced later. Open-source forkers must be able to change the palette via tokens without breaking contrast guarantees, so semantic token roles rather than raw hex values govern color usage in components.
