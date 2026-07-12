const fs = require('fs');

// Read meta data
const metaPath = '/home/alex/workspace/LinguaCode/public/data/scenarios/card-index-meta.json';
const metaContent = fs.readFileSync(metaPath, 'utf-8');
const meta = JSON.parse(metaContent);
const metaById = meta.metaById;

// Read cards
const cardsPath = '/home/alex/workspace/LinguaCode/public/data/cards/perl-interview-cards.json';
const cardsContent = fs.readFileSync(cardsPath, 'utf-8');
const cardsData = JSON.parse(cardsContent);

// Migrate metadata
let migratedCount = 0;
cardsData.cards.forEach((card, index) => {
  const id = card.id;
  if (metaById[id]) {
    cardsData.cards[index].meta = {
      knownLanguage: metaById[id].knownLanguage,
      learningLanguage: metaById[id].learningLanguage,
      difficulty: metaById[id].difficulty,
      tags: metaById[id].tags
    };
    migratedCount++;
  }
});

// Write back
fs.writeFileSync(cardsPath, JSON.stringify(cardsData, null, 2) + '\n', 'utf-8');
console.log('Migrated ' + migratedCount + ' cards');
