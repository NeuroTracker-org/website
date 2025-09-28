const fs = require("fs");

// Charger le fichier JSON
const rawData = fs.readFileSync("data/treatments_cleaned_v3.json", "utf8");
const data = JSON.parse(rawData);

// Les molécules sont les clés principales du JSON
const uniqueMolecules = Object.keys(data);

// Afficher le résultat
console.log("Nombre de molécules uniques :", uniqueMolecules.length);
console.log("Liste des premières molécules :", uniqueMolecules.slice(0, 20));
