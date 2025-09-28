// lib/scoring.js

// ---- Helpers ----
export function getQualityFactor(trialType) {
  if (!trialType) return 1.0;
  const txt = trialType.toLowerCase();
  if (txt.includes("randomisé") && txt.includes("double-aveugle")) {
    if (txt.includes("multicentrique")) return 1.05;
    return 1.0;
  }
  if (txt.includes("ouvert")) return 0.9;
  return 0.95;
}

export function getSafetyScore(resume) {
  if (!resume) return 0;
  const txt = resume.toLowerCase();
  if (
    txt.includes("meilleure tolérance") ||
    txt.includes("bien toléré") ||
    txt.includes("comparable au placebo")
  )
    return 1;
  if (
    txt.includes("mauvaise tolérance") ||
    txt.includes("plus d'effets indésirables") ||
    txt.includes("alerte")
  )
    return -1;
  return 0;
}

export const weightsByType = {
  "Traitement de fond": { clin: 0.45, safe: 0.2, n: 0.15, trials: 0.1, time: 0.1 },
  "Traitement de crise": { clin: 0.55, safe: 0.15, n: 0.15, trials: 0.1, time: 0.05 },
  "Traitement aux urgences": { clin: 0.5, safe: 0.2, n: 0.15, trials: 0.1, time: 0.05 },
  Autre: { clin: 0.5, safe: 0.2, n: 0.15, trials: 0.1, time: 0.05 },
};

/**
 * Calcule le score global d’un traitement
 *
 * @param {Object} t - Le traitement (extrait de treatments.json)
 * @param {Array} group - Tous les traitements du même type (pour normalisation relative)
 * @returns {number} scoreGlobal (0–100)
 */
export function computeScoreGlobal(t, group) {
  const essais = Array.isArray(t.essais_cliniques) ? t.essais_cliniques : [];

  const annees = essais.map((e) => parseInt(e["Année"])).filter((a) => !isNaN(a));
  const minAnnee = annees.length > 0 ? Math.min(...annees) : null;
  const maxAnnee = annees.length > 0 ? Math.max(...annees) : null;
  const duree = minAnnee && maxAnnee ? maxAnnee - minAnnee + 1 : 0;

  const effectifTotal = essais.reduce((sum, e) => {
    const val = parseInt(e["Effectif (randomisé)"]);
    return !isNaN(val) ? sum + val : sum;
  }, 0);

  // Scores cliniques et sécurité pondérés par qualité
  let clinSum = 0;
  let safeSum = 0;
  essais.forEach((e) => {
    const quality = getQualityFactor(e["Type"]);
    clinSum += (e.Score || 0) * quality;
    safeSum += getSafetyScore(e["Résultat principal (résumé)"]) * quality;
  });

  const nbEssais = essais.length;
  const counts = {
    "+": essais.filter((e) => e.Score === 1).length,
    "-": essais.filter((e) => e.Score === -1).length,
    "?": essais.filter((e) => e.Score === 0).length,
  };

  // Moyenne clinique + pénalité d’hétérogénéité
  let S_clin = nbEssais > 0 ? clinSum / nbEssais : 0;
  const maxCluster = Math.max(counts["+"] || 0, counts["-"] || 0, counts["?"] || 0);
  const coherence = nbEssais > 0 ? maxCluster / nbEssais : 1;
  S_clin = (S_clin * coherence + 1) / 2; // remap [-1..+1] → [0..1]

  // Sécurité (moyenne pondérée)
  let S_safe = nbEssais > 0 ? safeSum / nbEssais : 0;
  S_safe = (S_safe + 1) / 2;

  // Normalisation relative (comparaison dans le même type de traitement)
  const maxNbEssais = Math.max(...group.map((tt) => tt.essais_cliniques?.length || 0));
  const maxEffectif = Math.max(
    ...group.map((tt) =>
      (tt.essais_cliniques || []).reduce((s, e) => {
        const v = parseInt(e["Effectif (randomisé)"]);
        return !isNaN(v) ? s + v : s;
      }, 0)
    )
  );
  const maxDuree = Math.max(
    ...group.map((tt) => {
      const years = (tt.essais_cliniques || [])
        .map((e) => parseInt(e["Année"]))
        .filter((a) => !isNaN(a));
      return years.length ? Math.max(...years) - Math.min(...years) + 1 : 0;
    })
  );

  const S_trials = maxNbEssais > 0 ? Math.log(nbEssais + 1) / Math.log(maxNbEssais + 1) : 0;
  const S_effectif = maxEffectif > 0 ? Math.log(effectifTotal + 1) / Math.log(maxEffectif + 1) : 0;
  const S_time = maxDuree > 0 ? duree / maxDuree : 0;

  // Pondérations
  const type = t.type_de_traitement || "Autre";
  const w = weightsByType[type] || weightsByType["Autre"];

  const scoreGlobal0_1 =
    w.clin * S_clin +
    w.safe * S_safe +
    w.n * S_effectif +
    w.trials * S_trials +
    w.time * S_time;

  return Math.round(scoreGlobal0_1 * 100);
}
