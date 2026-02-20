#!/usr/bin/env python3
"""
Arbetsförmedlingen Intelligent Data Scraper v2
Scrapes dataset pages to find and download JSON files

Usage:
    python download_all_datasets.py
"""

import requests
import json
import time
import os
import sys
import re
from pathlib import Path
from datetime import datetime

try:
    from bs4 import BeautifulSoup
except ImportError:
    print("ERROR: BeautifulSoup4 is required!")
    print("Install it with: pip3 install beautifulsoup4")
    sys.exit(1)

# ANSI colors
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def print_success(msg):
    print(f"{GREEN}✓{RESET} {msg}")

def print_error(msg):
    print(f"{RED}✗{RESET} {msg}")

def print_info(msg):
    print(f"{BLUE}ℹ{RESET} {msg}")

def print_warning(msg):
    print(f"{YELLOW}⚠{RESET} {msg}")

# Create data directories
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"
RAW_DIR = DATA_DIR / "raw"

for directory in [DATA_DIR, RAW_DIR]:
    directory.mkdir(exist_ok=True)

print(f"\n{BLUE}{'='*60}{RESET}")
print(f"{BLUE}NordiqFlow - Intelligent Data Scraper v2{RESET}")
print(f"{BLUE}{'='*60}{RESET}\n")

# =============================================================================
# PRIORITY DATASETS
# =============================================================================

PRIORITY_DATASETS = [
    {
        "name": "⭐ Släktskap mellan yrkesbenämningar",
        "slug": "substitutability-relations-between-occupations",
        "category": "career_transitions"
    },
    {
        "name": "⭐ Närliggande yrken",
        "slug": "related-occupations",
        "category": "career_transitions"
    },
    {
        "name": "⭐ Yrkesbarometer",
        "slug": "yrkesbarometer",
        "category": "forecasting"
    },
    {
        "name": "Hela SSYK-strukturen med yrkesbenämningar",
        "slug": "the-ssyk-hierarchy-with-occupations",
        "category": "ssyk"
    },
    {
        "name": "Kompetensbegrepp",
        "slug": "skills",
        "category": "skills"
    },
]

# =============================================================================
# SCRAPING FUNCTIONS
# =============================================================================

def find_download_link(dataset_url):
    """Visit dataset page and find 'Ladda ner JSON fil' link"""
    try:
        response = requests.get(dataset_url, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Look for "Ladda ner JSON fil" text
        json_links = soup.find_all('a', string=re.compile(r'Ladda ner JSON', re.IGNORECASE))
        
        if json_links:
            href = json_links[0].get('href')
            if href:
                if href.startswith('http'):
                    return href
                else:
                    return f"https://data.arbetsformedlingen.se{href}"
        
        return None
        
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return None

def download_dataset(dataset_info):
    """Download a single dataset"""
    name = dataset_info["name"]
    slug = dataset_info["slug"]
    category = dataset_info["category"]
    
    print_info(f"{name}")
    
    # Build dataset page URL
    dataset_page_url = f"https://data.arbetsformedlingen.se/data/dataset/{slug}/"
    
    # Find download link
    print_info(f"  → Visiting {dataset_page_url}")
    download_url = find_download_link(dataset_page_url)
    
    if not download_url:
        print_error(f"  → Could not find download link")
        return False
    
    print_info(f"  → Found: {download_url}")
    
    # Download
    try:
        response = requests.get(download_url, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        
        # Save
        category_dir = RAW_DIR / category
        category_dir.mkdir(exist_ok=True)
        
        output_file = category_dir / f"{slug}.json"
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        # Count records
        if isinstance(data, list):
            count = len(data)
        elif isinstance(data, dict) and 'results' in data:
            count = len(data['results'])
        else:
            count = 1
        
        size_kb = len(response.content) / 1024
        print_success(f"  → {count} records ({size_kb:.1f} KB)")
        
        return True
        
    except Exception as e:
        print_error(f"  → Failed: {str(e)}")
        return False

# =============================================================================
# TAXONOMY API DATASETS (direct API, no scraping needed)
# =============================================================================

TAXONOMY_API_BASE = "https://taxonomy.api.jobtechdev.se/v1/taxonomy/specific/concepts"

TAXONOMY_API_DATASETS = [
    {
        "name": "🗺️  Svenska regioner (län)",
        "endpoint": "region",
        "filename": "regions.json",
    },
    {
        "name": "🏘️  Svenska kommuner",
        "endpoint": "municipality",
        "filename": "municipalities.json",
    },
]

def download_taxonomy_api_datasets():
    """Download datasets directly from JobTech Taxonomy API (no auth needed)"""
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}Downloading from JobTech Taxonomy API{RESET}")
    print(f"{BLUE}{'='*60}{RESET}\n")

    taxonomy_dir = RAW_DIR / "taxonomy"
    taxonomy_dir.mkdir(exist_ok=True)

    downloaded = 0
    failed = 0

    for i, dataset in enumerate(TAXONOMY_API_DATASETS, 1):
        name = dataset["name"]
        endpoint = dataset["endpoint"]
        filename = dataset["filename"]

        print(f"\n{YELLOW}[{i}/{len(TAXONOMY_API_DATASETS)}]{RESET}")
        print_info(f"{name}")

        url = f"{TAXONOMY_API_BASE}/{endpoint}"
        print_info(f"  → GET {url}")

        try:
            response = requests.get(url, headers={"accept": "application/json"}, timeout=15)
            response.raise_for_status()

            data = response.json()

            output_file = taxonomy_dir / filename
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

            # Count records
            if isinstance(data, dict) and 'data' in data and 'concepts' in data['data']:
                count = len(data['data']['concepts'])
            elif isinstance(data, list):
                count = len(data)
            else:
                count = 1

            size_kb = len(response.content) / 1024
            print_success(f"  → {count} records ({size_kb:.1f} KB)")
            downloaded += 1

        except Exception as e:
            print_error(f"  → Failed: {str(e)}")
            failed += 1

        if i < len(TAXONOMY_API_DATASETS):
            time.sleep(1)

    return downloaded, failed


# =============================================================================
# MAIN
# =============================================================================

def main():
    datasets = PRIORITY_DATASETS
    print_info(f"Downloading {len(datasets)} priority datasets\n")

    downloaded = 0
    failed = 0

    for i, dataset in enumerate(datasets, 1):
        print(f"\n{YELLOW}[{i}/{len(datasets)}]{RESET}")

        success = download_dataset(dataset)

        if success:
            downloaded += 1
        else:
            failed += 1

        if i < len(datasets):
            time.sleep(1)

    # Download Taxonomy API datasets (regions, municipalities)
    api_downloaded, api_failed = download_taxonomy_api_datasets()
    downloaded += api_downloaded
    failed += api_failed

    total = len(datasets) + len(TAXONOMY_API_DATASETS)

    # Summary
    print(f"\n{BLUE}{'='*60}{RESET}")
    print_success(f"Downloaded: {downloaded}/{total}")
    if failed > 0:
        print_error(f"Failed: {failed}/{total}")

    print_info(f"\nData saved to: {RAW_DIR.relative_to(BASE_DIR)}")
    print(f"\n{GREEN}✓ Complete!{RESET}\n")

if __name__ == "__main__":
    main()
