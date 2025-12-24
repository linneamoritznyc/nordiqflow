#!/usr/bin/env python3
"""
Arbetsförmedlingen Data Scraper
Downloads all 60+ datasets from data.arbetsformedlingen.se

Usage:
    python download_all_datasets.py
"""

import requests
import json
import time
import os
from pathlib import Path
from datetime import datetime

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
PROCESSED_DIR = DATA_DIR / "processed"

for directory in [DATA_DIR, RAW_DIR, PROCESSED_DIR]:
    directory.mkdir(exist_ok=True)

print(f"\n{BLUE}{'='*60}{RESET}")
print(f"{BLUE}Arbetsförmedlingen Data Scraper{RESET}")
print(f"{BLUE}{'='*60}{RESET}\n")

# =============================================================================
# DATASET REGISTRY
# =============================================================================

DATASETS = {
    # =========================================================================
    # CORE TAXONOMIES
    # =========================================================================
    "ssyk": {
        "name": "SSYK - Swedish Occupational Classification",
        "datasets": [
            {
                "id": "ssyk-level-1",
                "name": "SSYK Level 1 (Major groups)",
                "url": "https://taxonomy.api.jobtechdev.se/v1/occupational-group/ssyk-level-1",
                "format": "json"
            },
            {
                "id": "ssyk-level-2",
                "name": "SSYK Level 2",
                "url": "https://taxonomy.api.jobtechdev.se/v1/occupational-group/ssyk-level-2",
                "format": "json"
            },
            {
                "id": "ssyk-level-3",
                "name": "SSYK Level 3",
                "url": "https://taxonomy.api.jobtechdev.se/v1/occupational-group/ssyk-level-3",
                "format": "json"
            },
            {
                "id": "ssyk-level-4",
                "name": "SSYK Level 4 (Most detailed)",
                "url": "https://taxonomy.api.jobtechdev.se/v1/occupational-group/ssyk-level-4",
                "format": "json"
            }
        ]
    },
    
    "sni": {
        "name": "SNI - Swedish Industry Classification",
        "datasets": [
            {
                "id": "sni-level-1",
                "name": "SNI Level 1",
                "url": "https://taxonomy.api.jobtechdev.se/v1/sni-level/sni-level-1",
                "format": "json"
            },
            {
                "id": "sni-level-2",
                "name": "SNI Level 2",
                "url": "https://taxonomy.api.jobtechdev.se/v1/sni-level/sni-level-2",
                "format": "json"
            },
            # Add levels 3-5...
        ]
    },
    
    "skills": {
        "name": "Skills & Competencies",
        "datasets": [
            {
                "id": "all-skills",
                "name": "All Skill Concepts",
                "url": "https://taxonomy.api.jobtechdev.se/v1/skills",
                "format": "json"
            }
        ]
    },
    
    "occupations": {
        "name": "Occupation Names",
        "datasets": [
            {
                "id": "all-occupations",
                "name": "All Occupation Concepts",
                "url": "https://taxonomy.api.jobtechdev.se/v1/occupations",
                "format": "json"
            }
        ]
    },
    
    # =========================================================================
    # CRITICAL RELATIONSHIP DATA
    # =========================================================================
    
    "relationships": {
        "name": "⭐ Career Transition Data",
        "datasets": [
            {
                "id": "occupation-substitutability",
                "name": "⭐ SLÄKTSKAP mellan yrken (career transitions!)",
                "url": "https://data.arbetsformedlingen.se/data/dataset/substitutability-relations-between-occupations",
                "format": "json",
                "note": "CRITICAL: Pre-computed career similarities (75=high, 25=low)"
            },
            {
                "id": "related-occupations",
                "name": "⭐ NÄRLIGGANDE yrken (AI-computed)",
                "url": "https://data.arbetsformedlingen.se/data/dataset/related-occupations",
                "format": "json",
                "note": "CRITICAL: ML-based occupation similarity scores"
            },
            {
                "id": "relevant-skills-for-occupations",
                "name": "Relevanta kompetenser för yrken",
                "url": "https://data.arbetsformedlingen.se/data/dataset/relevant-skills-for-occupations",
                "format": "json"
            }
        ]
    },
    
    "forecasts": {
        "name": "⭐ Demand Forecasting Data",
        "datasets": [
            {
                "id": "yrkesbarometer",
                "name": "⭐ YRKESBAROMETER (5-year forecasts!)",
                "url": "https://data.arbetsformedlingen.se/data/dataset/yrkesbarometer",
                "format": "json",
                "note": "CRITICAL: Official 5-year demand forecasts by region"
            }
        ]
    },
    
    # =========================================================================
    # EDUCATION DATA
    # =========================================================================
    
    "education": {
        "name": "SUN - Education Classifications",
        "datasets": [
            {
                "id": "sun-field-level-1",
                "name": "SUN Field Level 1",
                "url": "https://taxonomy.api.jobtechdev.se/v1/sun-education-field-1",
                "format": "json"
            },
            {
                "id": "sun-field-level-2",
                "name": "SUN Field Level 2",
                "url": "https://taxonomy.api.jobtechdev.se/v1/sun-education-field-2",
                "format": "json"
            },
            {
                "id": "sun-field-level-3",
                "name": "SUN Field Level 3",
                "url": "https://taxonomy.api.jobtechdev.se/v1/sun-education-field-3",
                "format": "json"
            },
            {
                "id": "sun-field-level-4",
                "name": "SUN Field Level 4",
                "url": "https://taxonomy.api.jobtechdev.se/v1/sun-education-field-4",
                "format": "json"
            }
        ]
    },
    
    # =========================================================================
    # SUPPORTING DATA
    # =========================================================================
    
    "geographic": {
        "name": "Geographic Data",
        "datasets": [
            {
                "id": "eu-regions",
                "name": "EU Regions (NUTS codes)",
                "url": "https://taxonomy.api.jobtechdev.se/v1/geographic/eu-region",
                "format": "json"
            },
            {
                "id": "countries",
                "name": "Countries",
                "url": "https://taxonomy.api.jobtechdev.se/v1/countries",
                "format": "json"
            }
        ]
    },
    
    "requirements": {
        "name": "Job Requirements",
        "datasets": [
            {
                "id": "driving-licenses",
                "name": "Driving Licenses",
                "url": "https://taxonomy.api.jobtechdev.se/v1/driving-licence",
                "format": "json"
            },
            {
                "id": "languages",
                "name": "Languages",
                "url": "https://taxonomy.api.jobtechdev.se/v1/language",
                "format": "json"
            }
        ]
    }
}

# =============================================================================
# DOWNLOAD FUNCTIONS
# =============================================================================

def download_dataset(dataset_info, category):
    """Download a single dataset"""
    dataset_id = dataset_info["id"]
    name = dataset_info["name"]
    url = dataset_info["url"]
    
    # Determine if this is a full dataset URL or an API endpoint
    # For now, we'll try to fetch from Taxonomy API
    # Real URLs may need adjustment based on actual data.arbetsformedlingen.se structure
    
    print_info(f"Downloading: {name}")
    
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        
        # Save to raw directory
        category_dir = RAW_DIR / category
        category_dir.mkdir(exist_ok=True)
        
        output_file = category_dir / f"{dataset_id}.json"
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        # Get record count
        if isinstance(data, list):
            count = len(data)
        elif isinstance(data, dict) and 'results' in data:
            count = len(data['results'])
        else:
            count = 1
        
        print_success(f"Saved {count} records to {output_file.relative_to(BASE_DIR)}")
        
        if 'note' in dataset_info:
            print_warning(f"  → {dataset_info['note']}")
        
        return True
        
    except requests.exceptions.RequestException as e:
        print_error(f"Failed to download {name}: {str(e)}")
        return False
    except json.JSONDecodeError as e:
        print_error(f"Failed to parse JSON for {name}: {str(e)}")
        return False
    except Exception as e:
        print_error(f"Unexpected error for {name}: {str(e)}")
        return False

def main():
    """Main scraper function"""
    
    total_datasets = sum(len(cat["datasets"]) for cat in DATASETS.values())
    downloaded = 0
    failed = 0
    
    print_info(f"Found {total_datasets} datasets to download")
    print_info(f"Saving to: {RAW_DIR.relative_to(BASE_DIR)}\n")
    
    for category, category_info in DATASETS.items():
        print(f"\n{YELLOW}{'─'*60}{RESET}")
        print(f"{YELLOW}{category_info['name']}{RESET}")
        print(f"{YELLOW}{'─'*60}{RESET}\n")
        
        for dataset in category_info["datasets"]:
            success = download_dataset(dataset, category)
            
            if success:
                downloaded += 1
            else:
                failed += 1
            
            # Be nice to the API
            time.sleep(0.5)
    
    # Summary
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}Download Summary{RESET}")
    print(f"{BLUE}{'='*60}{RESET}\n")
    
    print_success(f"Successfully downloaded: {downloaded}/{total_datasets}")
    if failed > 0:
        print_error(f"Failed downloads: {failed}/{total_datasets}")
    
    print_info(f"\nData saved to: {RAW_DIR.relative_to(BASE_DIR)}")
    print_info(f"Next step: Run parse_and_normalize.py to process the data")
    
    # Save metadata
    metadata = {
        "download_date": datetime.now().isoformat(),
        "total_datasets": total_datasets,
        "downloaded": downloaded,
        "failed": failed,
        "categories": list(DATASETS.keys())
    }
    
    with open(DATA_DIR / "download_metadata.json", 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"\n{GREEN}✓ Scraping complete!{RESET}\n")

if __name__ == "__main__":
    main()
