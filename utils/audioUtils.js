// utils/audioUtils.js
// ─── Zylo Multi-Audio Helpers ───

// Providers जो multi-audio देते हैं (priority order — top = best)
const MULTI_AUDIO_PROVIDERS = [
  'netmirror',    // सबसे बेहतर — Netflix + Prime + Hotstar multi-audio
  'vidlink',      // multiLang=1 के बाद multi-audio
  'showbox',
  '4khdhub',
];

// Providers जो single-audio देते हैं
const SINGLE_AUDIO_PROVIDERS = [
  'vixsrc',
  'videasy',
  'streamflix',
  'castletv',
  'dahmermovies',
  'hdghartv',
  'onetouchtv',
  'vaplayer',
  'zxcstreams',
];

/**
 * Stream को priority score दे — जितना ज़्यादा, उतना ऊपर
 */
function streamPriority(stream) {
  if (!stream || typeof stream !== 'object') return 0;

  const provider = String(
    stream.provider || stream.name || ''
  ).toLowerCase();
  const url = String(stream.url || '').toLowerCase();

  // 1. Provider score (multi-audio providers को 100, बाकी को 20)
  let providerScore = 20;
  const multiIdx = MULTI_AUDIO_PROVIDERS.findIndex((p) =>
    provider.includes(p)
  );
  if (multiIdx >= 0) {
    providerScore = 100 - multiIdx * 5;
  }

  // 2. HLS master / playlist → multi-audio likely
  let hlsScore = 0;
  if (url.includes('master')) hlsScore = 30;
  else if (url.includes('/hls/')) hlsScore = 25;
  else if (url.includes('.m3u8')) hlsScore = 20;

  // 3. Quality score (1080p = 10.8, 720p = 7.2 आदि)
  let qualityScore = 0;
  const qMatch = String(stream.quality || '').match(/(\d+)p/i);
  if (qMatch) qualityScore = parseInt(qMatch[1], 10) / 100;

  // 4. Explicit audioSupport flag
  let audioFlagScore = 0;
  if (stream.audioSupport === 'multi') audioFlagScore = 50;
  else if (stream.audioSupport === 'single') audioFlagScore = 0;

  return providerScore + hlsScore + qualityScore + audioFlagScore;
}

/**
 * Streams को priority से sort करो (multi-audio + best quality ऊपर)
 */
function sortStreamsByPriority(streams) {
  if (!Array.isArray(streams)) return streams;
  return [...streams].sort((a, b) => streamPriority(b) - streamPriority(a));
}

/**
 * Language code → emoji flag
 */
function langToFlag(lang) {
  const map = {
    en: '🇬🇧', hi: '🇮🇳', ta: '🇮🇳', te: '🇮🇳',
    ml: '🇮🇳', bn: '🇮🇳', mr: '🇮🇳', kn: '🇮🇳',
    es: '🇪🇸', fr: '🇫🇷', de: '🇩🇪', ja: '🇯🇵',
    ko: '🇰🇷', zh: '🇨🇳', ar: '🇸🇦', ru: '🇷🇺',
    pt: '🇵🇹', it: '🇮🇹', th: '🇹🇭', vi: '🇻🇳',
  };
  return map[String(lang || '').toLowerCase().split('-')[0]] || '🌐';
}

module.exports = {
  MULTI_AUDIO_PROVIDERS,
  SINGLE_AUDIO_PROVIDERS,
  streamPriority,
  sortStreamsByPriority,
  langToFlag,
};
