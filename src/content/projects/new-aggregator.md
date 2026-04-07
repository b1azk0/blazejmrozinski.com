---
name: "News Aggregator"
company: "digital-savages"
description: "AI-powered content engine that crawls news sources, generates SEO-optimized commentary, and publishes to WordPress with quality scoring, scheduling, and cannibalization detection."
domain: "Content Automation · WordPress · SEO"
order: 2
related_posts: []
challenge: "Running content sites in news-driven niches requires fresh, high-volume publishing. Manual curation doesn't scale across a client portfolio, and generic AI content lacks SEO awareness, quality gating, scheduling intelligence, and protection against your own posts competing in search results."
approach: "Built a hub-and-spoke system: a central Python backend crawls RSS sources, clusters and deduplicates articles, generates original commentary via GPT-4o, and pushes to multiple WordPress sites via REST API. Every post gets scored against a 13-point SEO checklist, scheduled into optimal time slots, and monitored for cannibalization via semantic embeddings. Per-source configuration lets each source have its own output mode (standalone article vs. daily digest), tone, language, and quality thresholds."
results:
  - "172 posts generated from 8 sources at ~$7.32 total API cost (~$0.04/post)"
  - "97% publish rate with automated quality gating (13-point SEO scoring)"
  - "Embedding-based cannibalization detection catches duplicate coverage before it hurts rankings"
  - "Multi-site architecture serves entire client portfolio from one backend"
  - "Daily digest mode aggregates thin sources into substantial roundup posts"
tools:
  - "Python (Flask, APScheduler, feedparser)"
  - "OpenAI GPT-4o, text-embedding-3-small"
  - "WordPress REST API"
  - "SQLite with WAL mode"
  - "Claude Code (development)"
---

An AI-powered content engine built to run across a portfolio of client WordPress sites. The system crawls RSS feeds and Google Alerts, generates original SEO-optimized commentary (not summaries or rewrites), and publishes through WordPress with automated quality control at every step.

## What Makes It Different

Most AI content tools solve the generation problem and stop there. This system solves the five problems that come after generation: quality scoring (13-point SEO checklist with automatic cleanup of posts that don't pass), scheduling (freshness-first algorithm that prioritizes recent news and spaces posts throughout the day), cannibalization detection (semantic embeddings identify when your own articles start competing for the same search queries), digest aggregation (thin sources get combined into substantial daily roundups instead of producing weak standalone posts), and internal linking (keyword-to-URL mappings injected automatically across all generated content).

## Architecture

Hub-and-spoke design. A central Flask backend handles the expensive work (crawling, AI generation, embedding computation) and serves multiple WordPress sites from a single instance. Each site registers independently with its own sources, settings, and content pipeline. The WordPress plugin is lightweight: it receives generated posts via REST API, manages scheduling and publishing, and provides the admin interface for configuration and monitoring.

The entire system was built with Claude Code as technical co-founder, from initial architecture through 147 commits to the current v1.27 release.
