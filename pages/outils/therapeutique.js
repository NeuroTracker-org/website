// pages/outils/pro/therapeutique.js
import { useState, useMemo } from "react";
import Link from "next/link";
import styles from "../../styles/outilArbre.module.css";

/**
 * Algorithme thérapeutique (simplifié, basé sur recommandations courantes).
 * Chaque nœud = { text, options[{label, next|result}] }.
 */
const NODES = {
  start: {
    text: "Évaluer le patient migraineux. Type de crise habituelle ?",
    options: [
      { label: "Crises peu fréquentes et modérées", next: "crises_legere" },
      { label: "Crises fréquentes et/ou sévères", next: "crises_severe" },
    ],
  },

  crises_legere: {
    text: "Traitement de crise recommandé en 1ʳᵉ intention :",
    options: [
      { label: "Anti-inflammatoires (AINS)", result: "Utiliser un AINS (ibuprofène, naproxène, aspirine) dès le début de la crise." },
      { label: "Antalgiques simples", result: "Paracétamol ou association paracétamol-caféine en 1ʳᵉ intention si toléré." },
    ],
  },

  crises_severe: {
    text: "Si AINS insuffisant ou contre-indiqué → 2ᵉ intention :",
    options: [
      { label: "Triptans", next: "triptans" },
      { label: "Autres options", next: "autres_crise" },
    ],
  },

  triptans: {
    text: "Triptans disponibles. Choisir en fonction du patient (rapidité, durée d’action, tolérance) :",
    options: [
      { label: "Sumatriptan / Zolmitriptan", result: "Triptans recommandés en 2ᵉ intention. Attention aux contre-indications CV." },
      { label: "Autres triptans", result: "Almotriptan, naratriptan, rizatriptan, etc. Choix selon profil du patient." },
    ],
  },

  autres_crise: {
    text: "Cas particulier : crises prolongées ou résistantes",
    options: [
      { label: "Corticoïdes (cure courte)", result: "Ex : dexaméthasone pour statut migraineux. Réservé aux cas spécifiques." },
      { label: "Urgences / hospitalisation", result: "Perfusion IV (valproate, dihydroergotamine). Indiqué en urgence hospitalière." },
    ],
  },

  prophylaxie: {
    text: "≥ 4–8 crises par mois OU handicap fonctionnel significatif ?",
    options: [
      { label: "Oui", next: "traitement_fond" },
      { label: "Non", result: "Poursuivre traitement de crise seul + suivi régulier." },
    ],
  },

  traitement_fond: {
    text: "Traitement de fond à envisager :",
    options: [
      { label: "Bêta-bloquants", result: "Propranolol, métoprolol : 1ʳᵉ intention si absence de CI." },
      { label: "Antiépileptiques", result: "Topiramate ou acide valproïque (selon profil patient)." },
      { label: "Antidépresseurs tricycliques", result: "Amitriptyline, utile si comorbidité anxio-dépressive." },
      { label: "Anticorps monoclonaux anti-CGRP", result: "Erenumab, fremanezumab, galcanezumab : pour patients réfractaires." },
    ],
  },
};

export default function TherapeutiquePage() {
  const [current, setCurrent] = useState("start");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState(["start"]);

  const node = useMemo(() => NODES[current], [current]);

  const choose = (opt) => {
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
  };

  return (
    <main className={styles.proPage}>
      <div className="wrap M">
        <div className={styles.pageHeader}>
          <h1>Algorithme thérapeutique interactif</h1>
          <p>
            Orientation pour le choix du traitement de crise et de fond des migraines et céphalées.
            Basé sur recommandations habituelles, ne remplace pas le jugement clinique.
          </p>
        </div>

        <div className={styles.arbreContainer}>
          {result ? (
            <div className={styles.decisionResult}>
              <h3>Recommandation</h3>
              <p>{result}</p>
            </div>
          ) : (
            <div className={styles.decisionStep}>
              <p className={styles.questionText}>{node.text}</p>
              <ul className={styles.optionsList}>
                {node.options.map((opt, i) => (
                  <li key={i}>
                    <button onClick={() => choose(opt)} className="cta secondary">
                      <span className="dot"></span>
                      {opt.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className={styles.arbreNav}>
          <button onClick={back} disabled={history.length <= 1} className="cta secondary">
            <i className="fas fa-arrow-left" /> Précédent
          </button>
          <button onClick={reset} className="cta secondary">Recommencer</button>
        </div>
      </div>
    </main>
  );
}
