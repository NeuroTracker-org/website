// pages/outils/pro/arbre.js
import { useState, useMemo } from "react";
import Link from "next/link";
import slugify from "@/lib/slugify";
import styles from "../../styles/outilArbre.module.css";

/**
 * Helper : fabrique un lien <Link> vers /pathologies/[slug] à partir d'un titre
 */
function PathologyLink({ title }) {
  const slug = slugify(title);
  if (title === "Autre céphalée") {
    return (
      <button className={styles.resultBtn} title={`Voir les autres céphalées`}>
        <Link href={`/pathologies`}><i className="fas fa-arrow-right"></i>{title}</Link>
      </button>
    )
  }
  return (
    <button className={styles.resultBtn} title={`Voir la fiche "${title}"`}>
      <Link href={`/pathologies/${slug}`}><i className="fas fa-arrow-right"></i>{title}</Link>
    </button>
  );
}

/**
 * Notes:
 * - Arbre "entonnoir" : on filtre par drapeaux rouges, chronicité, phénotype,
 *   durée des crises, signes autonomiques, caractéristiques des douleurs brèves,
 *   neuralgies, déclencheurs spécifiques, secondaires fréquentes…
 * - Les libellés de résultats correspondent exactement aux entrées de headaches.json
 *   (ex: "Migraine avec aura", "Céphalée de toux", "Céphalée en grappe (cluster headache)",
 *   "Hémicranie paroxystique (épisodique ou chronique)", "Céphalée de froid ou de glace", etc.).
 * - Si aucun item ne colle, on renvoie "Autre céphalée".
 */

/* ======== Définition de l’arbre ======== */
const NODES = {
  /* 0 — Drapeaux rouges */
  start: {
    text:
      "Signes d’alerte (‘red flags’) : début en coup de tonnerre, fièvre/raideur de nuque, déficit focal/confusion/convulsions, immunodépression/cancer, œdème papillaire, grossesse/post-partum ?",
    options: [
      { label: "Oui", next: "red_flags_detail" },
      { label: "Non", next: "pattern" },
    ],
  },

  red_flags_detail: {
    text: "Précisez le drapeau rouge principal",
    options: [
      {
        label: "Coup de tonnerre (max <1 min)",
        // On propose deux causes majeures couvertes par ton taxo
        next: "thunder_path",
      },
      { label: "Fièvre/raideur de nuque", result: "Céphalée post-méningite" },
      {
        label: "Déficit neuro / confusion / convulsions",
        next: "neuro_deficit_branch",
      },
      {
        label: "Grossesse / post-partum",
        // pas d’entrée dédiée dans headaches.json → on sort en “Autre”
        result: "Autre céphalée",
      },
      {
        label: "Immunodépression / cancer / papille",
        result: "Autre céphalée",
      },
      { label: "Finalement aucun", next: "pattern" },
    ],
  },

  thunder_path: {
    text:
      "Début en coup de tonnerre : contexte évocateur ?",
    options: [
      {
        label: "Signes vasculaires / contextes RCVS (déclencheurs, récidives rapprochées)",
        result: "Céphalée post-syndrome de vasoconstriction réversible (RCVS)",
      },
      {
        label: "Tableau hémorragique (HSA/ICH) / céphalée brutale persistante",
        result: "Céphalée post-AVC hémorragique",
      },
      { label: "Autre / indéterminé", result: "Autre céphalée" },
    ],
  },

  neuro_deficit_branch: {
    text: "Contexte d’événements cérébrovasculaires ?",
    options: [
      { label: "AVC ischémique", result: "Céphalée post-AVC ischémique" },
      { label: "AVC hémorragique", result: "Céphalée post-AVC hémorragique" },
      { label: "Dissection carotidienne suspecte", result: "Dissection carotidienne" },
      { label: "Autre / indéterminé", result: "Autre céphalée" },
    ],
  },

  /* 1 — Motif : crises vs douleur continue */
  pattern: {
    text: "Le tableau est-il dominé par des CRISES (accès) ou par une douleur QUOTIDIENNE/CONTINUE ?",
    options: [
      { label: "Crises", next: "freq" },
      { label: "Douleur surtout continue", next: "continuous_branch" },
    ],
  },

  /* 2 — Fréquence mensuelle */
  freq: {
    text: "Fréquence des céphalées (jours avec céphalée par mois) ?",
    options: [
      { label: "< 15 jours/mois", next: "duration_lt15" },
      { label: "≥ 15 jours/mois (≥ 3 mois)", next: "chronic_core" },
    ],
  },

  /* 3 — Détail chronicité (≥15 j/mois) ANNOTATION MOH */
  chronic_core: {
    text:
      "Usage d’antalgiques : triptans/ergots/opiacés ≥10 j/mois OU AINS/paracétamol ≥15 j/mois (≥3 mois) ?",
    options: [
      // Ne PAS en faire une “conclusion” — on annote (MOH) et on continue
      { label: "Oui (abus possible)", next: "chronic_phenotype_mig_tens", annotate: { moh: true } },
      { label: "Non", next: "chronic_phenotype_mig_tens", annotate: { moh: false } },
    ],
  },

  chronic_phenotype_mig_tens: {
    text:
      "Phénotype prédominant sur la plupart des jours : pulsatile/unilatéral + nausée/photo/phono (plutôt MIGRAINEUX) ou bilatéral/pression, non aggravé par effort, sans nausée (plutôt TENSIONNEL) ?",
    options: [
      { label: "Plutôt migraineux (≥8 j/mois avec caractéristiques migraineuses)", result: "Migraine chronique" },
      { label: "Plutôt tensionnel", result: "Céphalée de tension chronique" },
      {
        label: "Autre / mixte",
        next: "chronic_rare_primary",
      },
    ],
  },

  chronic_rare_primary: {
    text:
      "Douleur continue stricte unilatérale avec poussées et réponse typique à l’indométhacine ?",
    options: [
      { label: "Oui", result: "Hémicranie continue" },
      { label: "Non / incertain", result: "Autre céphalée" },
    ],
  },

  /* 4 — Crises <15 j/mois : DUREE */
  duration_lt15: {
    text: "Durée typique des CRISES ?",
    options: [
      { label: "4–72 h (souvent 4–24h)", next: "migraine_features" },
      { label: "30 min – 7 jours", next: "tension_branch_lt15" },
      { label: "15–180 min", next: "tac_core" },
      { label: "Secondes – < 2 min", next: "short_attacks_core" },
    ],
  },

  /* 4a — Migraine épisodique */
  migraine_features: {
    text:
      "Pendant les crises : douleur unilatérale, pulsatile, modérée/sévère, aggravée par l’effort, avec nausée et/ou photo-phono-phobie ?",
    options: [
      { label: "Oui", next: "aura_node" },
      { label: "Partiel / ambigu", next: "migraine_probable_vs_tension" },
    ],
  },
  aura_node: {
    text:
      "Aura réversible (visuelle/sensitive/dysphasique), progression ≥5 min, durée <60 min, suivie de céphalée ?",
    options: [
      { label: "Oui", result: "Migraine avec aura" },
      { label: "Non", result: "Migraine sans aura" },
    ],
  },
  migraine_probable_vs_tension: {
    text:
      "Douleur bilatérale «en étau/pression», légère/modérée, pas d’aggravation à l’effort, sans nausée ?",
    options: [
      { label: "Oui", next: "tension_subtype_lt15" },
      { label: "Non", result: "Migraine sans aura" },
    ],
  },

  /* 4b — Tension-type <15 j/mois */
  tension_branch_lt15: {
    text:
      "Caractéristiques tensionnelles : bilatérale, pression/serrement, légère/modérée, non aggravée à l’effort, sans nausée (± photo OU phonophobie, pas les deux) ?",
    options: [
      { label: "Oui", next: "tension_subtype_lt15" },
      { label: "Non / atypique", next: "migraine_features" },
    ],
  },
  tension_subtype_lt15: {
    text: "Sous-type (fréquence) :",
    options: [
      { label: "< 1 jour/mois (≈ < 12 j/an)", result: "Céphalée de tension épisodique peu fréquente" },
      { label: "1–14 jours/mois", result: "Céphalée de tension épisodique fréquente" },
    ],
  },

  /* 4c — TACs */
  tac_core: {
    text:
      "Crises très douloureuses orbitotemporales unilatérales avec signes autonomiques ipsilatéraux (larmoiement, congestion nasale, ptosis, rougeur oculaire) ou agitation ?",
    options: [
      { label: "Oui", next: "tac_duration" },
      { label: "Non", next: "migraine_features" },
    ],
  },
  tac_duration: {
    text: "Durée/fréquence des crises TAC :",
    options: [
      { label: "15–180 min, 1–8/j, par périodes de semaines (salves)", result: "Céphalée en grappe (cluster headache)" },
      { label: "2–30 min, ≥5/j", result: "Hémicranie paroxystique (épisodique ou chronique)" },
      { label: "Douleur CONTINUE unilatérale avec exacerbations", result: "Hémicranie continue" },
      { label: "Secondes, multiples tirs, conjonctivite+larmoiement marqués", result: "SUNCT" },
      { label: "Secondes, autonomiques moins marqués (ou rhinorrhée/douleur brûlante)", result: "SUNA" },
      { label: "Autre / incertain", next: "migraine_features" },
    ],
  },

  /* 4d — Crises très courtes (secondes–<2 min, NON-TAC)  */
  short_attacks_core: {
    text:
      "Crises ultra-brèves : douleur électrique par «décharge», déclenchée par la mastication/toucher/air ?",
    options: [
      { label: "Oui, dans une hémiface (V)", result: "Névralgie du trijumeau (V)" },
      { label: "Oui, occiput/cu cuir chevelu postérieur", result: "Névralgie occipitale" },
      { label: "Non, plutôt tirs orbitaires avec conjonctivite/larmoiement", result: "SUNCT" },
      { label: "Non, plutôt tirs orbitaires avec autonomiques plus discrets", result: "SUNA" },
    ],
  },

  /* 5 — Douleur continue prédominante (hors ≥15 j/mois déjà géré) */
  continuous_branch: {
    text:
      "Douleur quasi-quotidienne / continue. Caractéristiques unilatérales continues avec poussées et réponse à l’indométhacine ?",
    options: [
      { label: "Oui", result: "Hémicranie continue" },
      { label: "Non", next: "continuous_secondary_screen" },
    ],
  },

  /* 6 — Secondaires fréquentes (forme continue/posturale/dentaire/sinus/oculaire/colonne) */
  continuous_secondary_screen: {
    text:
      "Contexte évocateur d’une cause secondaire : posturale (pire debout mieux couché → fuite LCR), pression intracrânienne élevée (HII), sinusite, dentaire/ATM, glaucome, rachis cervical ?",
    options: [
      { label: "Orthostatique (pire debout)", result: "Céphalée post-hypotension du LCR (fuite)" },
      { label: "Pression intracrânienne élevée (œdème papillaire, ↑pression)", result: "Céphalée post-hypertension intracrânienne idiopathique" },
      { label: "Sinusite (douleur fronto-faciale + rhinorrhée/poussee ORL)", result: "Sinusite" },
      { label: "Glaucome aigu (douleur œil, halos, baisse acuité)", result: "Glaucome aigu" },
      { label: "Dentaire/ATM", result: "Douleurs dentaires (pulpites, ATM…)" },
      { label: "Cervical (arthrose, myalgies, mobilité limitée)", result: "Céphalée cervicogénique (suspicion)" },
      { label: "Aucune de ces causes", next: "other_primary_triggers" },
    ],
  },

  /* 7 — Déclencheurs très spécifiques (primaires) */
  other_primary_triggers: {
    text: "Déclencheur très spécifique identifié ?",
    options: [
      { label: "Toux/éternuement/effort de Valsalva", result: "Céphalée de toux" },
      { label: "Exercice physique soutenu", result: "Céphalée liée à l’effort" },
      { label: "Froid/glace (ingestion ou exposition)", result: "Céphalée de froid ou de glace" },
      { label: "Survient du sommeil (personnes âgées, café aide)", result: "Céphalée hypnique" },
      { label: "Tirs brefs «coup de poignard» sans autre signe", result: "Céphalée en coup de poignard" },
      { label: "Aucun de ces déclencheurs", result: "Autre céphalée" },
    ],
  },

  /* 8 — Post-traumatique & post-infectieux & post-viraux (chemin alternatif si pertinent) */
  // (Chemin non exposé automatiquement ici ; ces diagnostics sortent déjà via red flags/secondary/continuous ; à garder si tu veux un accès direct.)
};

/* ======== Composant ======== */
export default function ArbrePage() {
  const [current, setCurrent] = useState("start");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState(["start"]);
  const [annotations, setAnnotations] = useState({ moh: null }); // abus médicamenteux (info, pas conclusion)

  const node = useMemo(() => NODES[current], [current]);

  const choose = (opt) => {
    // Gestion annotation (MOH) si présente
    if (opt.annotate && typeof opt.annotate.moh !== "undefined") {
      setAnnotations((a) => ({ ...a, moh: opt.annotate.moh }));
    }
    if (opt.result) {
      setResult(opt.result);
      setHistory((h) => [...h, "résultat"]);
    } else if (opt.next) {
      setCurrent(opt.next);
      setHistory((h) => [...h, opt.next]);
      setResult(null);
    }
  };

  const back = () => {
    if (history.length <= 1) return;
    const h = [...history];
    h.pop();
    const prev = h[h.length - 1];
    if (prev === "résultat" && h.length > 1) h.pop();
    const newId = h[h.length - 1] || "start";
    setHistory(h);
    setCurrent(newId);
    setResult(null);
  };

  const reset = () => {
    setCurrent("start");
    setResult(null);
    setHistory(["start"]);
    setAnnotations({ moh: null });
  };

  return (
    <main className={styles.proPage}>
      <div className="wrap M">
        <div className={styles.pageHeader}>
          <h1>Arbre décisionnel</h1>
          <p>Orientation clinique — ne remplace pas un avis spécialisé.</p>
        </div>

        <div className={styles.arbreContainer}>
          {result ? (
            <div className={styles.decisionResult}>
              <div>
                <h3>Conclusion <PathologyLink title={result} /></h3>
              </div>
              <div>
                {(annotations.moh === true || annotations.moh === false) && (
                  <div className={styles.nextSteps}>
                    <h4>Facteurs/Contexte détectés</h4>
                    <ul>
                      {annotations.moh === true && (
                        <li>
                          Possible <strong>abus médicamenteux</strong> (MOH). À évaluer et prendre en charge,
                          mais la classification principale reste ci-dessus.
                        </li>
                      )}
                      {annotations.moh === false && (
                        <li>Pas de critère d’abus médicamenteux détecté dans les réponses.</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              <div className={styles.nextSteps}>
                <h4>Prochaines étapes (suggestions)</h4>
                <ul>
                  <li>Vérifier les critères complets ICHD-3 de la pathologie ciblée.</li>
                  <li>Évaluer comorbidités, facteurs déclenchants, et charge de symptômes.</li>
                  <li>Adapter la PEC : éducation, traitement de crise et de fond, sevrage si nécessaire.</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className={styles.decisionStep}>
              <p className={styles.questionText}>{node.text}</p>
              <ul className={styles.optionsList}>
                {node.options.map((opt, i) => {
                  // Palette boutons (vert/rouge pour oui/non – fallback "secondary")
                  const cls =
                    opt.label.includes("Oui")
                      ? "green"
                      : opt.label.includes("Non")
                        ? "red"
                        : "secondary";
                  return (
                    <li key={i}>
                      <button onClick={() => choose(opt)} className={`cta ${cls}`}>
                        <span className={`dot`} />
                        {opt.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <div className={styles.arbreNav}>
          <button onClick={back} disabled={history.length <= 1} className="cta secondary">
            <i className="fas fa-arrow-left" /> Précédent
          </button>
          <button onClick={reset} className="cta secondary">
            Recommencer
          </button>
        </div>
      </div>
    </main>
  );
}
