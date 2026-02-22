/**
 * Shared Supabase client + data fallback for API endpoints
 *
 * Supports two modes:
 *   1. PRODUCTION: Queries Supabase PostgreSQL (when SUPABASE_URL is set)
 *   2. DEMO: Falls back to local JSON files (for investor demos without DB)
 *
 * Usage:
 *   const { getSupabase, isSupabaseEnabled, loadLocalData } = require('./_lib/supabase');
 */

let supabaseClient = null;

function getSupabase() {
    if (supabaseClient) return supabaseClient;

    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;

    if (!url || !key) return null;

    // Dynamic import — @supabase/supabase-js must be installed
    try {
        const { createClient } = require('@supabase/supabase-js');
        supabaseClient = createClient(url, key);
        return supabaseClient;
    } catch (e) {
        console.warn('Supabase client not available:', e.message);
        return null;
    }
}

function isSupabaseEnabled() {
    return !!(process.env.SUPABASE_URL && (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY));
}

// Local data cache for demo mode
const dataCache = {};

function loadLocalData(filename) {
    if (dataCache[filename]) return dataCache[filename];

    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(process.cwd(), 'data/processed', filename);

    try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        dataCache[filename] = data;
        return data;
    } catch (e) {
        console.error(`Failed to load ${filename}:`, e.message);
        return null;
    }
}

// CORS helper
function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// Standard error response
function sendError(res, status, message, details = null) {
    const body = { error: message };
    if (details) body.details = details;
    return res.status(status).json(body);
}

module.exports = {
    getSupabase,
    isSupabaseEnabled,
    loadLocalData,
    setCorsHeaders,
    sendError,
};
