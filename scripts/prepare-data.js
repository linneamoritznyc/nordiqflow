/**
 * Prepare occupation and substitutability data for the API
 * Run with: node scripts/prepare-data.js
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data/raw/taxonomy');
const OUTPUT_DIR = path.join(__dirname, '../data/processed');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function loadJSON(filename) {
    const filepath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filepath)) {
        console.warn(`File not found: ${filename}`);
        return null;
    }
    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
}

function saveJSON(filename, data) {
    const filepath = path.join(OUTPUT_DIR, filename);
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    console.log(`Saved: ${filepath}`);
}

// Process SSYK groups with occupations
function processOccupations() {
    console.log('\n📊 Processing occupations...');
    const ssykData = loadJSON('ssyk-level-4-groups-with-related-occupations.json');
    if (!ssykData) return {};

    const occupations = {};
    const ssykGroups = {};

    ssykData.data.concepts.forEach(group => {
        const ssykCode = group.ssyk_code_2012;

        ssykGroups[ssykCode] = {
            code: ssykCode,
            label: group.preferred_label,
            definition: group.definition || '',
            occupations: []
        };

        if (group.narrower) {
            group.narrower.forEach(occ => {
                occupations[occ.id] = {
                    id: occ.id,
                    name: occ.preferred_label,
                    ssykCode: ssykCode,
                    ssykLabel: group.preferred_label,
                    definition: group.definition || ''
                };
                ssykGroups[ssykCode].occupations.push(occ.id);
            });
        }
    });

    console.log(`  Found ${Object.keys(occupations).length} occupations in ${Object.keys(ssykGroups).length} SSYK groups`);
    return { occupations, ssykGroups };
}

// Process skills
function processSkills() {
    console.log('\n🎯 Processing skills...');
    const skillsData = loadJSON('skills.json');
    if (!skillsData) return {};

    const skills = {};
    skillsData.data.concepts.forEach(skill => {
        skills[skill.id] = {
            id: skill.id,
            name: skill.preferred_label
        };
    });

    console.log(`  Found ${Object.keys(skills).length} skills`);
    return skills;
}

// Process substitutability relations
function processSubstitutability() {
    console.log('\n🔄 Processing substitutability relations...');
    const subData = loadJSON('substitutability-relations-between-occupations.json');
    if (!subData) return {};

    const substitutability = {};
    let relationCount = 0;

    subData.data.concepts.forEach(occ => {
        const relations = [];

        // Occupations that can substitute this one
        if (occ.substituted_by) {
            occ.substituted_by.forEach(sub => {
                relations.push({
                    targetId: sub.id,
                    targetName: sub.preferred_label,
                    score: sub.substitutability_percentage,
                    direction: 'can_become'
                });
                relationCount++;
            });
        }

        // Occupations this one can substitute for
        if (occ.substitutes) {
            occ.substitutes.forEach(sub => {
                relations.push({
                    targetId: sub.id,
                    targetName: sub.preferred_label,
                    score: sub.substitutability_percentage,
                    direction: 'can_replace'
                });
                relationCount++;
            });
        }

        if (relations.length > 0) {
            substitutability[occ.id] = {
                id: occ.id,
                name: occ.preferred_label,
                relations: relations.sort((a, b) => b.score - a.score)
            };
        }
    });

    console.log(`  Found ${Object.keys(substitutability).length} occupations with ${relationCount} substitutability relations`);
    return substitutability;
}

// Process regions (län) and municipalities (kommuner)
function processGeography() {
    console.log('\n🗺️  Processing geography (regions & municipalities)...');

    const regions = {};
    const municipalities = {};

    // Process regions (21 Swedish län)
    const regionData = loadJSON('regions.json');
    if (regionData && regionData.data && regionData.data.concepts) {
        regionData.data.concepts.forEach(region => {
            regions[region.id] = {
                id: region.id,
                name: region.preferred_label,
                nutsCode: region.national_nuts_level_3_code_2019 || region.nuts_level_3_code_2021 || null
            };
        });
        console.log(`  Found ${Object.keys(regions).length} regions (län)`);
    } else {
        console.warn('  ⚠ regions.json not found — run the scraper to download it');
    }

    // Process municipalities (290 Swedish kommuner)
    const municipalityData = loadJSON('municipalities.json');
    if (municipalityData && municipalityData.data && municipalityData.data.concepts) {
        municipalityData.data.concepts.forEach(muni => {
            const regionRef = muni.broader || muni.region;
            municipalities[muni.id] = {
                id: muni.id,
                name: muni.preferred_label,
                municipalityCode: muni.municipality_code || muni.national_nuts_level_3_code_2019 || null,
                regionId: regionRef ? (regionRef.id || null) : null,
                regionName: regionRef ? (regionRef.preferred_label || null) : null
            };
        });
        console.log(`  Found ${Object.keys(municipalities).length} municipalities (kommuner)`);
    } else {
        console.warn('  ⚠ municipalities.json not found — run the scraper to download it');
    }

    return { regions, municipalities };
}

// Create a search index for occupations
function createSearchIndex(occupations) {
    console.log('\n🔍 Creating search index...');
    const searchIndex = [];

    Object.values(occupations).forEach(occ => {
        searchIndex.push({
            id: occ.id,
            name: occ.name,
            nameLower: occ.name.toLowerCase(),
            ssykCode: occ.ssykCode,
            ssykLabel: occ.ssykLabel
        });
    });

    // Sort alphabetically
    searchIndex.sort((a, b) => a.name.localeCompare(b.name, 'sv'));
    console.log(`  Created index with ${searchIndex.length} entries`);
    return searchIndex;
}

// Main
async function main() {
    console.log('🚀 NordiqFlow Data Preparation\n');
    console.log('='.repeat(50));

    const { occupations, ssykGroups } = processOccupations();
    const skills = processSkills();
    const substitutability = processSubstitutability();
    const { regions, municipalities } = processGeography();
    const searchIndex = createSearchIndex(occupations);

    // Save processed data
    saveJSON('occupations.json', occupations);
    saveJSON('ssyk-groups.json', ssykGroups);
    saveJSON('skills.json', skills);
    saveJSON('substitutability.json', substitutability);
    saveJSON('search-index.json', searchIndex);

    if (Object.keys(regions).length > 0) {
        saveJSON('regions.json', regions);
    }
    if (Object.keys(municipalities).length > 0) {
        saveJSON('municipalities.json', municipalities);
    }

    // Create a combined lightweight file for the frontend
    const frontendData = {
        occupations: searchIndex.map(o => ({
            id: o.id,
            name: o.name,
            ssyk: o.ssykCode,
            category: o.ssykLabel
        })),
        totalOccupations: searchIndex.length,
        totalSubstitutabilityRelations: Object.values(substitutability).reduce(
            (sum, o) => sum + o.relations.length, 0
        ),
        totalRegions: Object.keys(regions).length,
        totalMunicipalities: Object.keys(municipalities).length
    };
    saveJSON('frontend-data.json', frontendData);

    console.log('\n' + '='.repeat(50));
    console.log('✅ Data preparation complete!');
    console.log(`\nOutput files in: ${OUTPUT_DIR}`);
}

main().catch(console.error);
