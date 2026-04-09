---
term: "O*NET (Occupational Information Network)"
seoTitle: "What Is O*NET? The Occupational Database Behind Modern Career Assessment"
description: "O*NET is the US Department of Labor's comprehensive database of occupational information. Learn how it powers career assessment, job matching, and workforce development tools."
definition: "O*NET (Occupational Information Network) is a comprehensive database maintained by the US Department of Labor that describes occupations in terms of skills, abilities, knowledge, work activities, and interests."
domain: "psychometrics"
relatedContent:
  - "projects/hse-career-quiz"
  - "work/gyfted"
relatedTerms:
  - "psychometric-assessment"
  - "big-five-personality"
status: published
date: 2026-04-09
---

Career assessment tools need two things to be useful: a way to measure the person, and a way to describe the world of work. Most tools invest heavily in the first and treat the second as an afterthought — a list of job titles, a vague taxonomy, something the product team assembled by hand. O*NET is what happens when the second part is taken seriously.

## What O*NET Is

O*NET (Occupational Information Network) is maintained by the US Department of Labor through the Employment and Training Administration, with data collection managed by the National Center for O*NET Development. It covers roughly 1,000 occupations and is continuously updated through surveys of workers and occupational analysts.

The database isn't just job descriptions. Each occupation is characterized across multiple domains:

- **Skills** — Cross-functional capabilities like active listening, critical thinking, coordination, and technology design
- **Abilities** — Underlying capacities like inductive reasoning, spatial orientation, and selective attention
- **Knowledge** — Organized bodies of information required for competent performance (mathematics, customer service, law, engineering)
- **Work Activities** — What people actually do: getting information, monitoring processes, communicating with supervisors, operating vehicles
- **Work Context** — Physical and social environment: indoors/outdoors, exposure to hazards, level of autonomy, contact with others
- **Interests** — Holland RIASEC codes for each occupation (more on this below)
- **Work Values** — What the occupation tends to satisfy: achievement, independence, recognition, working conditions
- **Education and training** — Typical entry-level requirements and on-the-job preparation

The combination makes O*NET something qualitatively different from a job title list. It's a structured, empirically grounded description of what work actually requires and what it feels like to do it.

## The O*NET-SOC Taxonomy

O*NET is organized using the Standard Occupational Classification (SOC) system, the official occupational taxonomy used across US federal statistical agencies. The O*NET-SOC taxonomy extends SOC to distinguish occupations that share a SOC code but differ in their work requirements.

SOC codes are hierarchical: two-digit major group codes roll up into progressively more specific four-, six-, and eight-digit codes. "15-1252.00" identifies Software Developers specifically; "15-0000" covers Computer and Mathematical Occupations broadly. This hierarchy lets you work at the level of specificity appropriate to your use case — granular matching for detailed career guidance, broader groupings for workforce planning.

## Holland Codes and RIASEC Integration

One of O*NET's most valuable features for career assessment is the integration of Holland's RIASEC model. Each occupation in O*NET is assigned a three-letter Holland code representing its primary, secondary, and tertiary interest types.

The six Holland types are:
- **Realistic (R)** — Hands-on work with tools, machines, plants, animals, or materials
- **Investigative (I)** — Research, analysis, intellectual inquiry
- **Artistic (A)** — Creative expression, unstructured environments, aesthetic work
- **Social (S)** — Teaching, helping, and interpersonal service
- **Enterprising (E)** — Leadership, persuasion, business and organizational influence
- **Conventional (C)** — Structured, detail-oriented work with data, records, and systems

A "software developer" might be coded IRC — primarily Investigative, with Realistic and Conventional components. A "social worker" might be SAI. The three-letter code captures the characteristic interest profile of people who work in that occupation and find it satisfying.

When you pair a person's own RIASEC profile (measured via a standardized interest inventory) against O*NET occupation codes, you get a congruence score — how well this person's interests match what this occupation requires and rewards. Congruence with work environment is one of the strongest predictors of job satisfaction and tenure.

## How O*NET Powers Career Assessment Tools

A career assessment tool that uses O*NET can do something that a home-built occupation taxonomy can't: it can match along multiple dimensions simultaneously. Not just "do your interests match this job?" but also "do your skills align with what the job requires, do your values match what the work rewards, and is the work context compatible with how you like to operate?"

This is the foundation of the HSE Career Quiz. We use O*NET occupation profiles combined with interest measurement to surface occupational families where a student or early-career professional is likely to find both engagement and fit. The matching isn't just on interest codes — the O*NET work values and work context data let us surface nuances that pure interest matching would miss.

## Practical Considerations for Builders

O*NET data is free, public, and available for download in multiple formats (SQL, Excel, text). The API is straightforward. For developers building career tools, it removes the hardest part of the problem: you don't have to create and maintain a database of occupational requirements from scratch.

A few practical notes for anyone building on O*NET:

O*NET is US-centric. Job titles, licensing requirements, and work context descriptions reflect the US labor market. Using it for international tools requires adaptation — mapping occupation codes to local equivalents and adjusting for differences in how occupations are structured.

The data updates lag actual market changes. Emerging roles (machine learning engineer, prompt engineer) are added over time but coverage of new occupations is always behind the curve.

Granularity requires care. Matching at the six-digit SOC level is more precise but more brittle — small shifts in how someone describes their interests can change which occupations surface. Matching at broader group levels is more robust but loses useful specificity. The right level depends on the use case and the precision of the interest measurement feeding into the match.
