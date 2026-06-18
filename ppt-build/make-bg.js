// Generates subtle premium dark backgrounds (SVG -> PNG) for the deck.
const sharp = require("sharp");

const hero = `
<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="g1" cx="14%" cy="-6%" r="55%">
      <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.34"/>
      <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="g2" cx="90%" cy="2%" r="50%">
      <stop offset="0%" stop-color="#22d3ee" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#22d3ee" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
      <path d="M60 0H0V60" fill="none" stroke="#ffffff" stroke-opacity="0.03" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="1920" height="1080" fill="#0A0C16"/>
  <rect width="1920" height="1080" fill="url(#grid)"/>
  <rect width="1920" height="1080" fill="url(#g1)"/>
  <rect width="1920" height="1080" fill="url(#g2)"/>
</svg>`;

const content = `
<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="g1" cx="100%" cy="-8%" r="48%">
      <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="g2" cx="-5%" cy="105%" r="42%">
      <stop offset="0%" stop-color="#22d3ee" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="#22d3ee" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1920" height="1080" fill="#0A0C16"/>
  <rect width="1920" height="1080" fill="url(#g1)"/>
  <rect width="1920" height="1080" fill="url(#g2)"/>
</svg>`;

(async () => {
  await sharp(Buffer.from(hero)).png().toFile("bg-hero.png");
  await sharp(Buffer.from(content)).png().toFile("bg-content.png");
  console.log("backgrounds written");
})();
