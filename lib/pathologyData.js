import fs from "fs";
import path from "path";

// Fichiers JSON
const TREATMENTS_PATH = path.join(process.cwd(), "data", "treatments.json");
const PATHOLOGIES_PATH = path.join(process.cwd(), "data", "headaches.json");

// Utilitaire : chargement JSON safe
function loadJsonSafe(p) {
  try {
    const raw = fs.readFileSync(p, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Erreur de lecture JSON:", p, err?.message);
    return null;
  }
}

function slugify(input) {
  return String(input || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// Utilitaire Capitalize 1ère lettre
function capitalizeFirstLetter(string) {
  if (!string || typeof string !== "string") return "";
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Utilitaire prix en euros
function formatPriceEUR(value) {
  if (value === "hors France") return "hors France";
  if (value === "libre") return "Libre";
  if (typeof value !== "number") return value;
  return value.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

// 🔹 Charge le fichier des traitements
function loadTreatments() {
  const raw = loadJsonSafe(TREATMENTS_PATH);
  return raw && typeof raw === "object" ? raw : {};
}

// 🔹 Charge le fichier des pathologies (TOP-LEVEL = OBJET, pas un tableau)
function loadPathologies() {
  const raw = loadJsonSafe(PATHOLOGIES_PATH);
  return raw && typeof raw === "object" ? raw : {};
}

/**
 * 🔹 Aplatis la structure OBJET de headaches_types_enriched.json :
 * {
 *   "Céphalées_primaires": {
 *     "Migraine": [ { name, description, traitements }, ... ],
 *     "Céphalée de tension": [ ... ]
 *   },
 *   "Céphalées trigémino-autonomiques (TACs)": { ... },
 *   ...
 * }
 *
 * → Retourne un tableau :
 * [{ name, slug, description, category, superCategory }, ...]
 */
export function getAllPathologies() {
  const raw = loadPathologies();
  const pathologies = [];

  for (const [superCategory, categoriesObj] of Object.entries(raw)) {
    if (!categoriesObj || typeof categoriesObj !== "object") continue;

    for (const [category, items] of Object.entries(categoriesObj)) {
      if (!Array.isArray(items)) continue;

      for (const item of items) {
        const name = item?.name || "";
        if (!name) continue;

        pathologies.push({
          name,
          slug: slugify(name),
          description: item?.description || "",
          category,
          superCategory,
        });
      }
    }
  }

  // Tri optionnel par nom lisible
  pathologies.sort((a, b) => a.name.localeCompare(b.name));
  return pathologies;
}

// Nombre de traitements
export function getTreatmentsCount() {
  const treatments = loadTreatments();
  return Object.keys(treatments || {}).length;
}

// 🔹 Liste tous les traitements
export function getAllTreatments() {
  const treatments = loadTreatments();
  return Object.entries(treatments).map(([molName, data]) => ({
    molecule_name: molName,
    slug: slugify(molName),
    description_molecule: data?.description_molecule || "",
    brands: Array.isArray(data?.marques) ? data.marques : [],
    prescription: capitalizeFirstLetter(data?.prescription) || "unknown",
    price: formatPriceEUR(data?.Prix) || "unknown",
    refund: data?.Remboursement || "unknown",
    type_de_traitement: data?.type_de_traitement || "unknown",
    categories: Array.isArray(data?.categories) ? data.categories : [],
    effets_indesirables: Array.isArray(data?.effets_indesirables) ? data.effets_indesirables : [],
    essais_cliniques: Array.isArray(data?.essais_cliniques) ? data.essais_cliniques : []
  }));
}

// 🔹 Récupère un traitement par son slug
export function getTreatmentBySlug(slug) {
  const treatments = loadTreatments();
  for (const [molName, data] of Object.entries(treatments)) {
    if (slugify(molName) === slug) {
      return {
        molecule_name: molName,
        slug,
        description_molecule: data?.description_molecule || "",
        brands: Array.isArray(data?.marques) ? data.marques : [],
        categories: Array.isArray(data?.categories) ? data.categories : [],
        essais_cliniques: Array.isArray(data?.essais_cliniques) ? data.essais_cliniques : [],
        prescription: capitalizeFirstLetter(data?.Prescription) || "unknown",
        price: formatPriceEUR(data?.Prix) || "unknown",
        refund: data?.Remboursement || "unknown",
        type_de_traitement: data?.type_de_traitement || "unknown",
        effets_indesirables: Array.isArray(data?.effets_indesirables) ? data.effets_indesirables : [],
      };
    }
  }
  return null;
}

// 🔹 Recherche simple sur nom ou description
export function searchTreatmentsByKeyword(query) {
  const q = slugify(query || "");
  if (!q) return [];
  return getAllTreatments().filter(
    (t) =>
      slugify(t.molecule_name).includes(q) ||
      slugify(t.description_molecule || "").includes(q)
  );
}

// 🔹 Récupère traitements liés à une pathologie
// (Version simple : matche si le nom EXACT de la pathologie est présent comme catégorie de traitement)
export function getTreatmentsByPathologySlug(slug) {
  const allTreatments = getAllTreatments();
  const allPathos = getAllPathologies();
  const pathology = allPathos.find((p) => p.slug === slug);
  if (!pathology) return null;

  const treatments = allTreatments.filter((t) =>
    (t.categories || []).some((cat) => slugify(cat) === slug)
  );

  return {
    ...pathology,
    count: treatments.length,
    treatments,
  };
}
