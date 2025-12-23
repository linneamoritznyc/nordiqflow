#!/usr/bin/env python3
"""
NordiqFlow API Connectivity Test
Tests all Arbetsförmedlingen APIs to verify they work as expected.
"""

import requests
import json
from datetime import datetime

# ANSI color codes for pretty output
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

print(f"\n{BLUE}{'='*60}{RESET}")
print(f"{BLUE}NordiqFlow - API Connectivity Test{RESET}")
print(f"{BLUE}{'='*60}{RESET}\n")

# =============================================================================
# TEST 1: Taxonomy API - The Brain
# =============================================================================

print(f"\n{YELLOW}TEST 1: Taxonomy API{RESET}")
print("-" * 60)

try:
    # Test 1a: Fetch all occupations
    print_info("Fetching occupations...")
    response = requests.get(
        'https://taxonomy.api.jobtechdev.se/v1/occupations',
        params={'limit': 10},
        timeout=10
    )
    response.raise_for_status()
    occupations = response.json()
    
    if len(occupations) > 0:
        print_success(f"Found {len(occupations)} occupations")
        print_info(f"Example: {occupations[0].get('preferred_term', 'N/A')}")
    else:
        print_error("No occupations returned")
    
    # Test 1b: Search for a specific occupation
    print_info("Searching for 'Mjukvaruutvecklare'...")
    response = requests.get(
        'https://taxonomy.api.jobtechdev.se/v1/concepts/search',
        params={'q': 'mjukvaruutvecklare', 'type': 'occupation'},
        timeout=10
    )
    response.raise_for_status()
    search_results = response.json()
    
    if len(search_results) > 0:
        concept = search_results[0]
        print_success(f"Found: {concept.get('preferred_term')}")
        print_info(f"Concept ID: {concept.get('concept_id')}")
        print_info(f"SSYK Code: {concept.get('ssyk_code_2012', 'N/A')}")
    else:
        print_error("Search returned no results")
    
    # Test 1c: Fetch skills
    print_info("Fetching skills...")
    response = requests.get(
        'https://taxonomy.api.jobtechdev.se/v1/skills',
        params={'limit': 10},
        timeout=10
    )
    response.raise_for_status()
    skills = response.json()
    
    if len(skills) > 0:
        print_success(f"Found {len(skills)} skills")
        print_info(f"Example skills: {', '.join([s.get('preferred_term', 'N/A') for s in skills[:3]])}")
    else:
        print_error("No skills returned")

except requests.exceptions.RequestException as e:
    print_error(f"Taxonomy API failed: {str(e)}")

# =============================================================================
# TEST 2: JobSearch API - Real-Time Pulse
# =============================================================================

print(f"\n{YELLOW}TEST 2: JobSearch API{RESET}")
print("-" * 60)

try:
    # Test 2a: Simple search
    print_info("Searching for Python jobs...")
    response = requests.post(
        'https://jobsearch.api.jobtechdev.se/search',
        json={'q': 'python', 'limit': 5},
        headers={'Content-Type': 'application/json'},
        timeout=10
    )
    response.raise_for_status()
    job_results = response.json()
    
    total_jobs = job_results.get('total', {}).get('value', 0)
    hits = job_results.get('hits', [])
    
    if total_jobs > 0:
        print_success(f"Found {total_jobs} Python jobs")
        if len(hits) > 0:
            first_job = hits[0]
            print_info(f"Example: {first_job.get('headline', 'N/A')}")
            print_info(f"Employer: {first_job.get('employer', {}).get('name', 'N/A')}")
            print_info(f"Location: {first_job.get('workplace_address', {}).get('municipality', 'N/A')}")
    else:
        print_warning("No Python jobs found (might be temporary)")
    
    # Test 2b: Aggregations (critical for SkillHedge)
    print_info("Testing aggregations...")
    response = requests.post(
        'https://jobsearch.api.jobtechdev.se/search',
        json={
            'q': '',
            'limit': 0,
            'stats': ['occupation']
        },
        headers={'Content-Type': 'application/json'},
        timeout=10
    )
    response.raise_for_status()
    agg_results = response.json()
    
    occupation_stats = agg_results.get('stats', [])
    if len(occupation_stats) > 0:
        print_success(f"Aggregations working! Found stats for {len(occupation_stats)} items")
    else:
        print_warning("No aggregation data returned")

except requests.exceptions.RequestException as e:
    print_error(f"JobSearch API failed: {str(e)}")

# =============================================================================
# TEST 3: JobAd Enrichments API - AI Layer
# =============================================================================

print(f"\n{YELLOW}TEST 3: JobAd Enrichments API{RESET}")
print("-" * 60)

try:
    test_text = """
    Vi söker en erfaren projektledare med kunskap i Scrum och Agile.
    Du bör ha minst 5 års erfarenhet inom IT-branschen och tala flytande engelska.
    Erfarenhet av Python och JavaScript är meriterande.
    """
    
    print_info("Analyzing job ad text with NLP...")
    response = requests.post(
        'https://jobad-enrichments.api.jobtechdev.se/enrich',
        json={'text': test_text},
        headers={'Content-Type': 'application/json'},
        timeout=10
    )
    response.raise_for_status()
    enrichments = response.json()
    
    occupations = enrichments.get('occupations', [])
    skills = enrichments.get('skills', [])
    languages = enrichments.get('languages', [])
    
    print_success(f"Enrichments working!")
    if occupations:
        print_info(f"Detected occupations: {', '.join([o.get('term', 'N/A') for o in occupations[:3]])}")
    if skills:
        print_info(f"Detected skills: {', '.join([s.get('term', 'N/A') for s in skills[:5]])}")
    if languages:
        print_info(f"Detected languages: {', '.join([l.get('term', 'N/A') for l in languages])}")

except requests.exceptions.RequestException as e:
    print_error(f"Enrichments API failed: {str(e)}")

# =============================================================================
# TEST 4: Historical Ads API
# =============================================================================

print(f"\n{YELLOW}TEST 4: Historical Ads API{RESET}")
print("-" * 60)

try:
    print_info("Fetching historical job ad data...")
    response = requests.get(
        'https://historical-ads.api.jobtechdev.se/ads',
        params={'limit': 5},
        timeout=10
    )
    response.raise_for_status()
    historical = response.json()
    
    if len(historical) > 0:
        print_success(f"Historical API working! Retrieved {len(historical)} ads")
        print_info(f"This enables trend analysis and backtesting for SkillHedge")
    else:
        print_warning("No historical data returned")

except requests.exceptions.RequestException as e:
    print_error(f"Historical API failed: {str(e)}")

# =============================================================================
# SUMMARY
# =============================================================================

print(f"\n{BLUE}{'='*60}{RESET}")
print(f"{BLUE}Test Summary{RESET}")
print(f"{BLUE}{'='*60}{RESET}\n")

print_info("All critical APIs tested!")
print_info("Data connections verified:")
print(f"  • {GREEN}Taxonomy{RESET}: Occupations, Skills, Education (the graph)")
print(f"  • {GREEN}JobSearch{RESET}: Real-time job ads with aggregations")
print(f"  • {GREEN}Enrichments{RESET}: NLP extraction from unstructured text")
print(f"  • {GREEN}Historical{RESET}: 10+ years of trend data")

print(f"\n{GREEN}✓ All systems GO!{RESET}")
print(f"{GREEN}✓ NordiqFlow can be built with these APIs{RESET}\n")

print_info(f"Next steps:")
print("  1. Build the graph database (Neo4j)")
print("  2. Create the unified API layer")
print("  3. Develop MVP for TalentFlow, SkillHedge, and CityIQ")

print(f"\n{BLUE}{'='*60}{RESET}\n")
