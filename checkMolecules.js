const fs = require("fs");

// Charger le fichier JSON
const rawData = fs.readFileSync("data/traitements_migraine_details.json", "utf8");
const data = JSON.parse(rawData);

// Extraire les molécules uniques
const uniqueMolecules = new Set(data.map(item => item.molecule));

// Affichage
console.log("Nombre de molécules uniques :", uniqueMolecules.size);
console.log("Liste :", Array.from(uniqueMolecules));
