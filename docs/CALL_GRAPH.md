# Project call graph — one-page mapping

## Overview
High-level mapping of how data, logic and UI connect across the repo.

## Quick flow
data_scraper -> data/ -> Kompetensbryggan/loaders.py -> Kompetensbryggan/engine.py -> presentation (Kompetensbryggan/bryggan.py, viz.html, index.html)

## Component map
- data_scraper/
  - download_all_datasets.py → downloads datasets into `data/raw` and writes `data/download_metadata.json`.
- data/
  - Raw and processed dataset storage consumed by loaders.

- Kompetensbryggan/
  - loaders.py
    - Loads taxonomy and dataset JSON from `data/` and normalizes into internal structures (concepts/skills).
  - engine.py
    - Core matching and search functions (e.g., `find_any_skills`, `find_skills`).
    - Called by bryggan.py to compute matches and recommendations.
  - bryggan.py
    - Streamlit app glue: imports loaders, engine, visualizer and styles; handles uploads (CV), runs matching, presents results.
  - visualizer.py
    - Plotly/heatmap helpers used by bryggan and saved visual outputs.
  - styles.py
    - CSS injection for the Streamlit UI.

- Static web pages
  - index.html
    - Main landing page; page-wide styles embedded in <style> blocks.
  - viz.html
    - D3-based interactive demo; JS and styles embedded inline; uses a sample node set for visualization.
  - next-steps.html
    - Notes and architecture next steps.

- scripts/
  - test_apis.py and utilities — used to probe external APIs; standalone.

- docs/
  - MATCHING_ALGORITHM.md, API_RESEARCH.md, etc. — design notes and next-step plans.

## File-level imports / dependencies (typical)
- bryggan.py -> imports: loaders, engine, visualizer, styles
- engine.py -> pure logic, may depend on loader output formats
- loaders.py -> reads files from `data/`
- viz.html -> standalone JS (D3) + sample data; not tightly coupled to Python code
- index.html -> static marketing page

## Notes / Next steps
- Styles are mostly embedded in HTML or injected via styles.py; there is no central .css file.
- If you want a visual diagram (SVG/PNG) or a Mermaid block added to README, I can add that.
