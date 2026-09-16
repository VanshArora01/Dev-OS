const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// In-memory cache for parsed CSV data
let datasetCache = null;
let loadingPromise = null;

/**
 * Load and parse the CSV dataset into memory (once).
 * Returns a promise that resolves to the array of rows.
 */
function loadDataset() {
    if (datasetCache) return Promise.resolve(datasetCache);
    if (loadingPromise) return loadingPromise;

    loadingPromise = new Promise((resolve, reject) => {
        const results = [];
        const csvPath = path.join(__dirname, '..', 'dataset.csv');

        fs.createReadStream(csvPath)
            .pipe(csv())
            .on('data', (row) => {
                results.push({
                    disNo: row['DisNo.'],
                    disasterType: row['Disaster Type'] || '',
                    disasterSubtype: row['Disaster Subtype'] || '',
                    country: row['Country'] || '',
                    iso: row['ISO'] || '',
                    region: row['Region'] || '',
                    subregion: row['Subregion'] || '',
                    location: row['Location'] || '',
                    startYear: parseInt(row['Start Year']) || null,
                    startMonth: parseInt(row['Start Month']) || null,
                    endYear: parseInt(row['End Year']) || null,
                    totalDeaths: parseInt(row['Total Deaths']) || 0,
                    noInjured: parseInt(row['No. Injured']) || 0,
                    totalAffected: parseInt(row['Total Affected']) || 0,
                    totalDamageUSD: parseFloat(row["Total Damage ('000 US$)"]) || 0,
                    magnitude: parseFloat(row['Magnitude']) || null,
                    magnitudeScale: row['Magnitude Scale'] || '',
                    eventName: row['Event Name'] || '',
                });
            })
            .on('end', () => {
                datasetCache = results;
                loadingPromise = null;
                console.log(`[DatasetService] Loaded ${results.length} historical disaster records`);
                resolve(results);
            })
            .on('error', (err) => {
                loadingPromise = null;
                console.error('[DatasetService] Failed to load dataset:', err.message);
                reject(err);
            });
    });

    return loadingPromise;
}

/**
 * Map project hazard types to EM-DAT disaster types
 */
const HAZARD_TO_DISASTER_MAP = {
    'flood': ['Flood', 'Glacial lake outburst flood'],
    'storm': ['Storm'],
    'heat': ['Extreme temperature'],
    'slr': ['Flood', 'Storm'], // Sea level rise correlates with floods and storms
    'earthquake': ['Earthquake'],
    'drought': ['Drought'],
    'wildfire': ['Wildfire'],
    'volcanic': ['Volcanic activity'],
};

/**
 * Filter historical disaster data relevant to a project's context.
 * 
 * @param {Object} params
 * @param {string} params.hazard - Hazard type (flood, storm, heat, slr, etc.)
 * @param {string} params.country - Country name or ISO code
 * @param {string} params.region - Region or subregion name
 * @param {number} params.yearFrom - Optional start year filter (default: 1950)
 * @param {number} params.yearTo - Optional end year filter (default: current year)
 * @param {number} params.limit - Max records to return (default: 25)
 * @returns {Promise<{records: Array, summary: string}>}
 */
async function filterHistoricalData({ hazard, country, region, yearFrom = 1950, yearTo = 2025, limit = 25 }) {
    const dataset = await loadDataset();

    const hazardLower = (hazard || 'flood').toLowerCase();
    const targetTypes = HAZARD_TO_DISASTER_MAP[hazardLower] || ['Flood', 'Storm'];

    // Filter by disaster type
    let filtered = dataset.filter(row => targetTypes.includes(row.disasterType));

    // Filter by country (match country name or ISO code)
    if (country) {
        const countryLower = country.toLowerCase();
        const countryFiltered = filtered.filter(row =>
            row.country.toLowerCase().includes(countryLower) ||
            row.iso.toLowerCase() === countryLower.substring(0, 3)
        );
        // If we get results for the specific country, use them; else fall back to region
        if (countryFiltered.length > 0) {
            filtered = countryFiltered;
        } else if (region) {
            const regionLower = region.toLowerCase();
            filtered = filtered.filter(row =>
                row.region.toLowerCase().includes(regionLower) ||
                row.subregion.toLowerCase().includes(regionLower)
            );
        }
    }

    // Filter by year range
    filtered = filtered.filter(row => row.startYear && row.startYear >= yearFrom && row.startYear <= yearTo);

    // Sort by most recent and most impactful
    filtered.sort((a, b) => {
        // Prioritize recent events
        const yearDiff = (b.startYear || 0) - (a.startYear || 0);
        if (yearDiff !== 0) return yearDiff;
        // Then by total damage
        return (b.totalDamageUSD || 0) - (a.totalDamageUSD || 0);
    });

    // Take top N records
    const topRecords = filtered.slice(0, limit);

    // Compute summary statistics from ALL filtered data (not just top N)
    const totalEvents = filtered.length;
    const totalDeaths = filtered.reduce((sum, r) => sum + r.totalDeaths, 0);
    const totalAffected = filtered.reduce((sum, r) => sum + r.totalAffected, 0);
    const totalDamage = filtered.reduce((sum, r) => sum + r.totalDamageUSD, 0);
    const avgDeathsPerEvent = totalEvents > 0 ? Math.round(totalDeaths / totalEvents) : 0;
    const decadeCounts = {};
    filtered.forEach(r => {
        if (r.startYear) {
            const decade = `${Math.floor(r.startYear / 10) * 10}s`;
            decadeCounts[decade] = (decadeCounts[decade] || 0) + 1;
        }
    });

    // Format the records into a concise text for prompt injection
    const recordsText = topRecords.map((r, i) => {
        const parts = [
            `${i + 1}. ${r.disasterType}${r.disasterSubtype ? ` (${r.disasterSubtype})` : ''}`,
            `   Country: ${r.country}`,
            `   Year: ${r.startYear}${r.startMonth ? `-${String(r.startMonth).padStart(2, '0')}` : ''}`,
        ];
        if (r.eventName) parts.push(`   Event: ${r.eventName}`);
        if (r.location) parts.push(`   Location: ${r.location}`);
        if (r.totalDeaths > 0) parts.push(`   Deaths: ${r.totalDeaths.toLocaleString()}`);
        if (r.totalAffected > 0) parts.push(`   Total Affected: ${r.totalAffected.toLocaleString()}`);
        if (r.totalDamageUSD > 0) parts.push(`   Total Damage: $${r.totalDamageUSD.toLocaleString()}K USD`);
        if (r.magnitude) parts.push(`   Magnitude: ${r.magnitude} ${r.magnitudeScale}`);
        return parts.join('\n');
    }).join('\n\n');

    const decadeTrend = Object.entries(decadeCounts)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([decade, count]) => `${decade}: ${count} events`)
        .join(', ');

    const summary = `HISTORICAL DISASTER DATABASE ANALYSIS (EM-DAT International Disaster Database)
═══════════════════════════════════════════════════════
Source: Centre for Research on the Epidemiology of Disasters (CRED), verified records from ${yearFrom}-${yearTo}.
Filter: ${targetTypes.join(', ')} disasters${country ? ` in/near ${country}` : ''}${region ? ` (${region} region)` : ''}

AGGREGATE STATISTICS:
- Total recorded events: ${totalEvents}
- Total deaths across all events: ${totalDeaths.toLocaleString()}
- Total people affected: ${totalAffected.toLocaleString()}
- Total economic damage: $${totalDamage.toLocaleString()}K USD (in '000s)
- Average deaths per event: ${avgDeathsPerEvent}
- Frequency trend by decade: ${decadeTrend}

TOP ${topRecords.length} MOST RECENT/IMPACTFUL EVENTS:
${recordsText}
═══════════════════════════════════════════════════════`;

    return {
        records: topRecords,
        summary,
        stats: { totalEvents, totalDeaths, totalAffected, totalDamage, decadeCounts }
    };
}

module.exports = { loadDataset, filterHistoricalData };
