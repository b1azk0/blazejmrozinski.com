---
term: "Context Window"
seoTitle: "What Is a Context Window? LLM Memory Limits and How to Work Within Them"
description: "A context window is the maximum amount of text an LLM can process at once. Learn how token limits affect AI interactions and strategies for working within them."
definition: "A context window is the maximum number of tokens (words and word fragments) that a large language model can process in a single conversation, encompassing both input and output."
domain: "ai-automation"
relatedContent:
  - "blog/building-a-brain-for-your-ai-cto"
  - "blog/how-i-taught-ai-to-work-like-a-colleague"
relatedTerms:
  - "knowledge-base-ai"
  - "specification-driven-development"
status: published
date: 2026-04-09
---

A context window is the working memory of a language model. Everything the model can "see" at once — your messages, its responses, any documents you've attached, the system prompt — has to fit within this limit. Exceed it, and content gets truncated or the request fails entirely.

Understanding context windows matters practically. It shapes what kinds of tasks LLMs can handle in a single session, how you structure your prompts and attached materials, and which model is appropriate for a given task.

## What Tokens Are

Models don't process text as characters or words — they process tokens, which are chunks of text that the tokenizer has learned to treat as units. In English, a token is roughly 0.75 words on average. "Unbelievable" is one token. "Psychometrics" might tokenize differently depending on the model. Code tends to tokenize less efficiently than prose because of symbols, whitespace, and identifiers the tokenizer hasn't seen frequently.

The practical implication: if you're working with a 128K token context window, you have room for roughly 96,000 words of text — about the length of a long novel. For most tasks, that's ample. For tasks involving large codebases, lengthy document sets, or extended multi-turn conversations, it can become a real constraint.

## Input and Output Both Count

The context window encompasses both input and output. The prompt you send, the documents attached, the conversation history, and the response the model generates — all of it counts toward the limit.

This creates a practical tradeoff. If you send 100K tokens of input, you've left only 28K tokens for the response in a 128K context model. For most tasks, that's fine. For tasks that require lengthy generated output — detailed code, long documents, comprehensive analyses — you need to budget context accordingly.

## Current Sizes Across Major Models

Context window sizes have grown rapidly. Models that launched with 4K or 8K token limits now often have 128K or more. As of early 2026:

- Claude 3.5 and 3.7 (Anthropic): 200K tokens
- GPT-4o (OpenAI): 128K tokens
- Gemini 1.5 Pro (Google): 1M tokens
- Gemini 1.5 Flash: 1M tokens

These numbers will continue to grow. But larger context windows don't automatically mean better performance on all tasks.

## Why Bigger Isn't Always Better

Two problems temper the value of very large context windows.

**Attention degradation:** Models tend to perform better on information near the beginning and end of the context than on information buried in the middle. This is sometimes called the "lost in the middle" problem. In a 1M token context window, information at position 500K may be processed less reliably than information at position 1K or position 999K. For tasks where every detail matters — code review, legal document analysis — this is a meaningful concern.

**Cost:** Context window size directly affects API cost. Tokens are priced per thousand, and filling a 200K context window with background documentation costs money every call. For high-volume applications, context efficiency matters economically, not just technically.

## Practical Strategies for Working Within Context Limits

**Knowledge bases:** Rather than pasting full documentation into every conversation, maintain structured knowledge files that can be selectively loaded. A well-organized knowledge base lets you provide the relevant context for a task without filling the window with irrelevant material.

**Summarization:** For long documents, summarize rather than paste. A 200-word summary of a 5,000-word document uses 97% less context. If the model needs to refer back to specific passages, use targeted retrieval rather than including the full document.

**Chunking:** For tasks that exceed the context window — processing an entire large codebase, analyzing a document corpus — break the work into chunks and process each separately, then synthesize. Many agentic tools do this automatically.

**Conversation management:** In long multi-turn conversations, older messages accumulate and eventually push newer content out of the effective attention range. For extended working sessions, periodic context resets — starting a fresh conversation with a concise summary of what's been decided — often produces better results than endlessly growing threads.

## Context Window vs. Long-Term Memory

A context window is not persistent memory. When a conversation ends, the context is gone. The model retains nothing session-to-session unless you provide it explicitly in the next session.

This is why knowledge bases matter: they're the bridge between the stateless nature of LLM interactions and the continuity that makes sustained collaboration possible. The context window is the size of the room; the knowledge base determines how well-equipped the room is when you walk in.
