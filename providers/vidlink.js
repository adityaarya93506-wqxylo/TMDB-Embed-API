// providers/vidlink.js
// ✅ Multi-audio enabled (multiLang=1)

const axios = require('axios');

const VIDLINK_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Referer': 'https://vidlink.pro'
};

function qualityToNumber(quality) {
    if (quality === '4k') return 2160;
    if (quality === 'Auto' || quality === 'unknown') return 0;
    const parsed = parseInt(quality, 10);
    return isNaN(parsed) ? 0 : parsed;
}

function qualityLabel(quality) {
    if (quality === '4k') return '4K';
    if (quality === 'Auto' || quality === 'unknown') return 'Auto';
    return `${quality}p`;
}

async function getVidlinkStreams(tmdbId, mediaType = 'movie', seasonNum = null, episodeNum = null) {
    console.log(`[Vidlink] Fetching streams for TMDB ID: ${tmdbId}, Type: ${mediaType}`);

    try {
        // Step 1: Encrypt the TMDB ID via enc-dec.app
        const encRes = await axios.get(
            `https://enc-dec.app/api/enc-vidlink?text=${encodeURIComponent(String(tmdbId))}`,
            { timeout: 8000 }
        );
        const encodedTmdb = encRes.data && encRes.data.result;
        if (!encodedTmdb) {
            console.log('[Vidlink] Encryption step returned no result.');
            return [];
        }

        // Step 2: Fetch streams with multiLang=1 (MULTI-AUDIO ENABLED)
        const apiUrl = mediaType === 'tv'
            ? `https://vidlink.pro/api/b/tv/${encodedTmdb}/${seasonNum}/${episodeNum}?multiLang=1`
            : `https://vidlink.pro/api/b/movie/${encodedTmdb}?multiLang=1`;

        const apiRes = await axios.get(apiUrl, { headers: VIDLINK_HEADERS, timeout: 8000 });

        const streamData = apiRes.data && apiRes.data.stream;
        const multiLangData = apiRes.data && apiRes.data.multilang;

        const collectedStreams = [];

        // ─── Multi-audio tracks (if present) ───
        if (multiLangData && typeof multiLangData === 'object') {
            for (const [lang, data] of Object.entries(multiLangData)) {
                if (!data || !data.url) continue;
                collectedStreams.push({
                    name: 'Vidlink',
                    title: `Vidlink - Multi-Audio (${String(lang).toUpperCase()})`,
                    url: data.url,
                    quality: 'Auto',
                    provider: 'Vidlink',
                    audioLang: lang,
                    audioSupport: 'multi',
                    headers: { 'Referer': 'https://vidlink.pro' }
                });
            }
            if (collectedStreams.length > 0) {
                console.log(`[Vidlink] Got ${collectedStreams.length} multi-audio stream(s).`);
                return collectedStreams;
            }
        }

        // ─── Fallback: quality-based streams ───
        if (!streamData || !streamData.qualities) {
            console.log('[Vidlink] No quality streams in response.');
            return [];
        }

        const streams = Object.entries(streamData.qualities)
            .filter(([, entry]) => entry && entry.url)
            .sort((a, b) => qualityToNumber(b[0]) - qualityToNumber(a[0]))
            .map(([qualityKey, entry]) => ({
                name: 'Vidlink',
                title: `Vidlink - ${qualityLabel(qualityKey)}`,
                url: entry.url,
                quality: qualityKey,
                provider: 'Vidlink',
                audioSupport: 'single',
                headers: { 'Referer': 'https://vidlink.pro' }
            }));

        if (streams.length === 0) {
            console.log('[Vidlink] No usable stream URLs in response.');
            return [];
        }

        console.log(`[Vidlink] Got ${streams.length} stream(s) (single-audio fallback).`);
        return streams;
    } catch (err) {
        console.error(`[Vidlink] Error: ${err.message}`);
        return [];
    }
}

module.exports = { getVidlinkStreams };
