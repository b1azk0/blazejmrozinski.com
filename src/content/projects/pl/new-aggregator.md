---
name: "News Aggregator"
company: "digital-savages"
description: "Silnik treści oparty na AI, który crawluje źródła newsowe, generuje komentarze zoptymalizowane pod SEO i publikuje je do WordPressa z oceną jakości, harmonogramem i detekcją kanibalizacji."
domain: "Automatyzacja treści · WordPress · SEO"
order: 2
related_posts: []
challenge: "Prowadzenie stron treściowych w newsowych niszach wymaga świeżych, wysokowolumenowych publikacji. Ręczna kuracja nie skaluje się w portfolio klientów, a generyczne treści AI nie mają świadomości SEO, bramek jakościowych, inteligentnego harmonogramu ani ochrony przed konkurowaniem własnych postów w wyszukiwaniu."
approach: "Zbudowałem system hub-and-spoke: centralny backend w Pythonie crawluje źródła RSS, klastruje i deduplikuje artykuły, generuje oryginalne komentarze przez GPT-4o i pushuje do wielu stron WordPress przez REST API. Każdy post jest scoringowany względem 13-punktowej checklisty SEO, planowany w optymalnych slotach i monitorowany pod kątem kanibalizacji przez semantyczne embeddingi. Konfiguracja per-source pozwala każdemu źródłu mieć własny tryb wyjścia (samodzielny artykuł vs dzienny digest), ton, język i progi jakości."
results:
  - "172 posty wygenerowane z 8 źródeł przy łącznym koszcie API ~$7,32 (~$0,04 za post)"
  - "97% wskaźnik publikacji z automatycznymi bramkami jakości (13-punktowy scoring SEO)"
  - "Detekcja kanibalizacji oparta na embeddingach wychwytuje duplikaty pokrycia, zanim zaszkodzą rankingom"
  - "Architektura multi-site obsługuje całe portfolio klientów z jednego backendu"
  - "Tryb dziennego digestu agreguje słabe źródła w solidne wpisy podsumowujące"
tools:
  - "Python (Flask, APScheduler, feedparser)"
  - "OpenAI GPT-4o, text-embedding-3-small"
  - "WordPress REST API"
  - "SQLite z trybem WAL"
  - "Claude Code (development)"
lang: pl
source_hash: bb07118a9d7f
---

Silnik treści oparty na AI, zbudowany do działania w portfolio klienckich stron WordPress. System crawluje feedy RSS i Google Alerts, generuje oryginalne komentarze zoptymalizowane pod SEO (nie podsumowania ani przeróbki) i publikuje przez WordPressa z automatyczną kontrolą jakości na każdym kroku.

## Co go wyróżnia

Większość narzędzi AI do treści rozwiązuje problem generowania i na tym kończy. Ten system rozwiązuje pięć problemów, które przychodzą po generowaniu: scoring jakości (13-punktowa checklista SEO z automatycznym czyszczeniem postów, które nie przejdą), planowanie (algorytm freshness-first, który priorytetyzuje świeże newsy i rozkłada posty w ciągu dnia), detekcję kanibalizacji (semantyczne embeddingi identyfikują, kiedy twoje własne artykuły zaczynają konkurować o te same zapytania), agregację w digesty (słabe źródła są łączone w solidne dzienne wpisy zamiast produkować słabe samodzielne posty) oraz linkowanie wewnętrzne (mapowania słowo kluczowe → URL wstrzykiwane automatycznie przez całą wygenerowaną treść).

## Architektura

Design hub-and-spoke. Centralny backend Flask obsługuje drogą pracę (crawling, generowanie AI, obliczanie embeddingów) i zasila wiele stron WordPress z jednej instancji. Każda strona rejestruje się niezależnie z własnymi źródłami, ustawieniami i pipeline'em treści. Wtyczka WordPress jest lekka: odbiera wygenerowane posty przez REST API, zarządza planowaniem i publikacją oraz udostępnia interfejs admina do konfiguracji i monitoringu.

Cały system został zbudowany z Claude Code jako technicznym co-founderem, od początkowej architektury przez 147 commitów do obecnej wersji v1.27.
