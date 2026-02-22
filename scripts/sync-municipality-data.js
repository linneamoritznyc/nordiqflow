#!/usr/bin/env node
/**
 * NordiqFlow — Municipality Data Sync Script
 * ============================================
 * Fetches live job data from AF JobSearch API and populates
 * Supabase tables for CityIQ dashboard.
 *
 * Usage:
 *   # Sync all pilot municipalities
 *   node scripts/sync-municipality-data.js
 *
 *   # Sync specific municipality
 *   node scripts/sync-municipality-data.js --municipality 0684
 *
 *   # Dry run (fetch but don't write to DB)
 *   node scripts/sync-municipality-data.js --dry-run
 *
 * Environment:
 *   SUPABASE_URL=https://your-project.supabase.co
 *   SUPABASE_SERVICE_KEY=your-service-role-key
 *
 * Schedule: Run daily via cron, Vercel Cron, or pg_cron
 *   Recommended: 04:00 CET (low AF API traffic)
 */

const fs = require('fs');
const path = require('path');

// ── CONFIG ──────────────────────────────────────────────────────
const JOBTECH_API = 'https://jobsearch.api.jobtechdev.se';
const TAXONOMY_API = 'https://taxonomy.api.jobtechdev.se/v1/taxonomy';

// Rate limiting: 100 req/min for AF API
const RATE_LIMIT_MS = 700; // ~85 req/min to be safe

// Pilot municipalities with AF taxonomy concept IDs
const MUNICIPALITIES = {
    '0684': { conceptId: 'xJqx_SLC_415', name: 'Vetlanda',  regionId: 'MtbE_xWT_eMi' },
    '0682': { conceptId: 'KfXT_ySA_do2', name: 'Nässjö',    regionId: 'MtbE_xWT_eMi' },
    '0680': { conceptId: 'VacK_WF6_XVg', name: 'Eksjö',     regionId: 'MtbE_xWT_eMi' },
    '0683': { conceptId: 'KURg_KJF_Lwc', name: 'Jönköping', regionId: 'MtbE_xWT_eMi' },
};

// ── HELPERS ─────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchWithRetry(url, options = {}, retries = 3) {
    for (let i = 0; i <= retries; i++) {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...options.headers,
                },
            });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`HTTP ${response.status}: ${text.substring(0, 200)}`);
            }
            return await response.json();
        } catch (e) {
            if (i === retries) throw e;
            const delay = Math.pow(2, i) * 1000;
            console.warn(`  Retry ${i + 1}/${retries} after ${delay}ms: ${e.message}`);
            await sleep(delay);
        }
    }
}

// ── STEP 1: Fetch Jobs for Municipality ─────────────────────────
async function fetchMunicipalityJobs(municipalityConceptId) {
    const allJobs = [];
    let offset = 0;
    const batchSize = 100;

    while (true) {
        const data = await fetchWithRetry(`${JOBTECH_API}/search`, {
            method: 'POST',
            body: JSON.stringify({
                municipality: [municipalityConceptId],
                limit: batchSize,
                offset,
            }),
        });

        const hits = data.hits || [];
        allJobs.push(...hits);
        offset += hits.length;

        console.log(`    Fetched ${allJobs.length}/${data.total?.value || '?'} jobs`);

        if (hits.length < batchSize || allJobs.length >= (data.total?.value || 0)) break;

        await sleep(RATE_LIMIT_MS);
    }

    return allJobs;
}

// ── STEP 2: Analyze Jobs → Occupation Snapshots ─────────────────
function analyzeJobs(jobs) {
    const byOccupation = {};

    jobs.forEach(job => {
        const occId = job.occupation?.concept_id;
        const occName = job.occupation?.label;
        if (!occId || !occName) return;

        if (!byOccupation[occId]) {
            byOccupation[occId] = {
                occupationId: occId,
                occupationName: occName,
                ssykCode: job.occupation_group?.ssyk_code_2012 || null,
                activeJobs: 0,
                newJobs7d: 0,
                employers: {},
            };
        }

        byOccupation[occId].activeJobs++;

        // Check if posted in last 7 days
        if (job.publication_date) {
            const pubDate = new Date(job.publication_date);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            if (pubDate >= weekAgo) {
                byOccupation[occId].newJobs7d++;
            }
        }

        // Track employers
        const employer = job.employer?.name || 'Okänd';
        byOccupation[occId].employers[employer] =
            (byOccupation[occId].employers[employer] || 0) + 1;
    });

    // Sort employers and take top 5
    for (const occ of Object.values(byOccupation)) {
        occ.topEmployers = Object.entries(occ.employers)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));
        delete occ.employers;
    }

    return Object.values(byOccupation);
}

// ── STEP 3: Write to Supabase ───────────────────────────────────
async function writeToSupabase(supabase, municipalityId, snapshots) {
    const today = new Date().toISOString().split('T')[0];

    // Prepare snapshot rows
    const snapshotRows = snapshots.map(s => ({
        municipality_id: municipalityId,
        occupation_id: s.occupationId,
        snapshot_date: today,
        active_jobs: s.activeJobs,
        new_jobs_7d: s.newJobs7d,
        top_employers: s.topEmployers,
    }));

    // Upsert snapshots (on conflict: update)
    if (snapshotRows.length > 0) {
        const batchSize = 100;
        for (let i = 0; i < snapshotRows.length; i += batchSize) {
            const batch = snapshotRows.slice(i, i + batchSize);
            const { error } = await supabase
                .from('municipality_job_snapshots')
                .upsert(batch, { onConflict: 'municipality_id,occupation_id,snapshot_date' });

            if (error) {
                console.error(`    Error upserting snapshots batch ${i}:`, error.message);
            }
        }
    }

    // Update talent gaps
    const gapRows = snapshots.map(s => ({
        municipality_id: municipalityId,
        occupation_id: s.occupationId,
        snapshot_date: today,
        open_positions: s.activeJobs,
        available_workers: 0,  // TODO: integrate with AF registered job seekers data
    }));

    if (gapRows.length > 0) {
        const { error } = await supabase
            .from('municipal_talent_gaps')
            .upsert(gapRows, { onConflict: 'municipality_id,occupation_id,snapshot_date' });

        if (error) {
            console.error(`    Error upserting talent gaps:`, error.message);
        }
    }

    return snapshotRows.length;
}

// ── STEP 4: Write to local JSON (for demo without Supabase) ────
function writeToLocalJSON(municipalityId, municipalityName, snapshots, allJobs) {
    const outputDir = path.join(__dirname, '../data/processed/municipalities');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const output = {
        municipalityId,
        municipalityName,
        snapshotDate: new Date().toISOString().split('T')[0],
        totalActiveJobs: allJobs.length,
        uniqueOccupations: snapshots.length,
        occupationSnapshots: snapshots.sort((a, b) => b.activeJobs - a.activeJobs),
        meta: {
            source: 'Arbetsförmedlingen JobSearch API',
            generatedAt: new Date().toISOString(),
        },
    };

    const filepath = path.join(outputDir, `${municipalityId}-${municipalityName.toLowerCase()}.json`);
    fs.writeFileSync(filepath, JSON.stringify(output, null, 2));
    console.log(`    Saved local snapshot: ${filepath}`);
    return filepath;
}

// ── MAIN ────────────────────────────────────────────────────────
async function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const specificMunicipality = args.find((a, i) => args[i - 1] === '--municipality');

    console.log('='.repeat(60));
    console.log('NordiqFlow — Municipality Data Sync');
    console.log(`Started: ${new Date().toISOString()}`);
    console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
    console.log('='.repeat(60));

    // Initialize Supabase (optional)
    let supabase = null;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (supabaseUrl && supabaseKey && !dryRun) {
        try {
            const { createClient } = require('@supabase/supabase-js');
            supabase = createClient(supabaseUrl, supabaseKey);
            console.log('Supabase connected ✓');
        } catch (e) {
            console.warn('Supabase not available, writing to local JSON only');
        }
    } else {
        console.log('No Supabase credentials — writing to local JSON');
    }

    // Determine which municipalities to sync
    const toSync = specificMunicipality
        ? { [specificMunicipality]: MUNICIPALITIES[specificMunicipality] }
        : MUNICIPALITIES;

    if (specificMunicipality && !MUNICIPALITIES[specificMunicipality]) {
        console.error(`Municipality ${specificMunicipality} not found. Available: ${Object.keys(MUNICIPALITIES).join(', ')}`);
        process.exit(1);
    }

    const results = [];

    for (const [kod, muni] of Object.entries(toSync)) {
        console.log(`\n[${muni.name}] (${kod}) ──────────────────────────`);

        try {
            // Fetch jobs
            console.log('  Fetching jobs from AF API...');
            const jobs = await fetchMunicipalityJobs(muni.conceptId);
            console.log(`  Total jobs: ${jobs.length}`);

            // Analyze
            const snapshots = analyzeJobs(jobs);
            console.log(`  Unique occupations: ${snapshots.length}`);
            console.log(`  Top 5 occupations:`);
            snapshots.slice(0, 5).forEach((s, i) => {
                console.log(`    ${i + 1}. ${s.occupationName} — ${s.activeJobs} jobs`);
            });

            // Write to Supabase
            if (supabase && !dryRun) {
                const count = await writeToSupabase(supabase, kod, snapshots);
                console.log(`  Supabase: ${count} snapshot rows written`);
            }

            // Always write to local JSON (serves as cache)
            writeToLocalJSON(kod, muni.name, snapshots, jobs);

            results.push({
                municipality: muni.name,
                kod,
                totalJobs: jobs.length,
                uniqueOccupations: snapshots.length,
                status: 'success',
            });

            // Rate limit between municipalities
            await sleep(RATE_LIMIT_MS * 2);

        } catch (error) {
            console.error(`  ERROR: ${error.message}`);
            results.push({
                municipality: muni.name,
                kod,
                status: 'error',
                error: error.message,
            });
        }
    }

    // Log sync result to Supabase
    if (supabase && !dryRun) {
        try {
            await supabase.from('data_sync_log').insert({
                source: 'municipality_job_sync',
                status: results.every(r => r.status === 'success') ? 'success' : 'partial',
                records_updated: results.reduce((sum, r) => sum + (r.totalJobs || 0), 0),
                finished_at: new Date().toISOString(),
            });
        } catch (e) {
            console.warn('Failed to log sync:', e.message);
        }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('SYNC SUMMARY');
    console.log('='.repeat(60));
    results.forEach(r => {
        const status = r.status === 'success' ? '✓' : '✗';
        console.log(`  ${status} ${r.municipality}: ${r.totalJobs || 0} jobs, ${r.uniqueOccupations || 0} occupations`);
    });
    console.log(`\nFinished: ${new Date().toISOString()}`);
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
