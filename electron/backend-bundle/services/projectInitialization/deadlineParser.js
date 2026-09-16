/**
 * Parse deadline strings from PRD extraction.
 * Does NOT hallucinate years for ambiguous dates.
 */

const MONTH_MAP = {
    january: 0, jan: 0,
    february: 1, feb: 1,
    march: 2, mar: 2,
    april: 3, apr: 3,
    may: 4,
    june: 5, jun: 5,
    july: 6, jul: 6,
    august: 7, aug: 7,
    september: 8, sept: 8, sep: 8,
    october: 9, oct: 9,
    november: 10, nov: 10,
    december: 11, dec: 11
};

function parseDeadlineDate(dateStr, confidence) {
    if (!dateStr || typeof dateStr !== 'string') return null;
    if (confidence === 'unresolved') return null;

    const trimmed = dateStr.trim();

    // ISO format
    const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
        const d = new Date(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}T12:00:00Z`);
        return isValidDate(d) ? d : null;
    }

    // DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmyMatch) {
        const d = new Date(`${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}T12:00:00Z`);
        return isValidDate(d) ? d : null;
    }

    // Month DD, YYYY
    const monthDayYear = trimmed.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/i);
    if (monthDayYear) {
        const month = MONTH_MAP[monthDayYear[1].toLowerCase()];
        if (month !== undefined) {
            const d = new Date(Date.UTC(parseInt(monthDayYear[3], 10), month, parseInt(monthDayYear[2], 10), 12));
            return isValidDate(d) ? d : null;
        }
    }

    // DD Month YYYY
    const dayMonthYear = trimmed.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/i);
    if (dayMonthYear) {
        const month = MONTH_MAP[dayMonthYear[2].toLowerCase()];
        if (month !== undefined) {
            const d = new Date(Date.UTC(parseInt(dayMonthYear[3], 10), month, parseInt(dayMonthYear[1], 10), 12));
            return isValidDate(d) ? d : null;
        }
    }

    // Only create reminders for explicit confidence with full year
    if (confidence !== 'explicit') return null;

    const fallback = new Date(trimmed);
    return isValidDate(fallback) ? fallback : null;
}

function isValidDate(d) {
    return d instanceof Date && !Number.isNaN(d.getTime());
}

function resolveProjectDeadline(deadlines) {
    const explicit = deadlines
        .filter((d) => d.confidence === 'explicit')
        .map((d) => ({ ...d, parsed: parseDeadlineDate(d.date, d.confidence) }))
        .filter((d) => d.parsed)
        .sort((a, b) => a.parsed - b.parsed);

    const finalDeadline = explicit.find((d) =>
        /final|project|completion|delivery|launch/i.test(d.title)
    );
    if (finalDeadline) return finalDeadline.parsed;

    return explicit.length > 0 ? explicit[explicit.length - 1].parsed : null;
}

module.exports = {
    parseDeadlineDate,
    resolveProjectDeadline
};
