// pages/outils/pro/scores.js
import { useState } from "react";
import Link from "next/link";
import styles from "../../styles/outilScores.module.css";

/* --- InputCounter --- */
function InputCounter({ value, setValue, min = 0, max = 365 }) {
  const inc = () => setValue((prev) => Math.min(max, (parseInt(prev) || 0) + 1));
  const dec = () => setValue((prev) => Math.max(min, (parseInt(prev) || 0) - 1));
  const onChange = (e) => {
    const v = parseInt(e.target.value) || 0;
    if (v >= min && v <= max) setValue(v);
  };

  return (
    <div className={styles.counter}>
      <button type="button" onClick={dec} aria-label="Diminuer"><i className="fas fa-minus" /></button>
      <input
        type="text"
        value={value}
        onChange={onChange}
        inputMode="numeric"
        pattern="[0-9]*"
      />
      <button type="button" onClick={inc} aria-label="Augmenter"><i className="fas fa-plus" /></button>
    </div>
  );
}

/* --- RadioGroup --- */
function RadioGroup({ name, value, setValue, options }) {
  return (
    <div className={styles.radioGroup}>
      {options.map((opt, i) => (
        <label
          key={i}
          className={`${styles.radioOption} ${value === opt.value ? styles.active : ""}`}
        >
          <span className={styles.radioCircle} aria-hidden="true" />
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => setValue(opt.value)}
          />
          <span>{opt.label}</span>
        </label>
      ))}
    </div>
  );
}

export default function ScoresPage() {
  // MIDAS
  const [midas1, setMidas1] = useState(0);
  const [midas2, setMidas2] = useState(0);
  const [midas3, setMidas3] = useState(0);
  const [midas4, setMidas4] = useState(0);
  const [midas5, setMidas5] = useState(0);
  const [midasScore, setMidasScore] = useState(null);
  const [midasGrade, setMidasGrade] = useState("");

  // HIT-6
  const [hit1, setHit1] = useState("");
  const [hit2, setHit2] = useState("");
  const [hit3, setHit3] = useState("");
  const [hit4, setHit4] = useState("");
  const [hit5, setHit5] = useState("");
  const [hit6, setHit6] = useState("");
  const [hitScore, setHitScore] = useState(null);
  const [hitImpact, setHitImpact] = useState("");

  const hitOptions = [
    { value: "6", label: "Jamais" },
    { value: "8", label: "Rarement" },
    { value: "10", label: "Parfois" },
    { value: "11", label: "Très souvent" },
    { value: "13", label: "Toujours" },
  ];

  const calculateMidas = () => {
    const total =
      (parseInt(midas1) || 0) +
      (parseInt(midas2) || 0) +
      (parseInt(midas3) || 0) +
      (parseInt(midas4) || 0) +
      (parseInt(midas5) || 0);
    setMidasScore(total);
    let grade = "";
    if (total <= 5) grade = "Aucune ou légère invalidité";
    else if (total <= 10) grade = "Invalidité légère";
    else if (total <= 20) grade = "Invalidité modérée";
    else grade = "Invalidité sévère";
    setMidasGrade(grade);
  };

  const calculateHit = () => {
    if ([hit1, hit2, hit3, hit4, hit5, hit6].some((val) => val === "")) {
      alert("Veuillez répondre à toutes les questions du HIT-6.");
      return;
    }
    const total =
      Number(hit1) +
      Number(hit2) +
      Number(hit3) +
      Number(hit4) +
      Number(hit5) +
      Number(hit6);
    setHitScore(total);
    let impact = "";
    if (total <= 49) impact = "faible ou nul";
    else if (total <= 55) impact = "modéré";
    else if (total <= 59) impact = "significatif";
    else impact = "sévère";
    setHitImpact(impact);
  };

  return (
    <main className={styles.scorePage}>
      <div className="wrap M">
        <div className={styles.pageHeader}>
          <h1>Calculateur de scores</h1>
          <p>
            Calcul des scores MIDAS et HIT-6 pour évaluer l&apos;impact des céphalées.
          </p>
        </div>

        <div className={styles.scoreTool}>
          <section>
            <div>
              <h2>Score MIDAS</h2>
              <p className={styles.scoreIntro}>
                Le questionnaire MIDAS (<em>Migraine Disability Assessment</em>) évalue le nombre de jours d’activité
                impactés par vos céphalées au cours des 3 derniers mois.
                Plus le score est élevé, plus l’invalidité fonctionnelle est importante.
              </p>

              <div className={styles.formGroup}>
                <p>Jours de travail/école manqués :</p>
                <InputCounter value={midas1} setValue={setMidas1} />
              </div>
              <div className={styles.formGroup}>
                <p>Jours de productivité réduite de moitié (travail/école) :</p>
                <InputCounter value={midas2} setValue={setMidas2} />
              </div>
              <div className={styles.formGroup}>
                <p>Jours d&apos;activités ménagères non effectuées :</p>
                <InputCounter value={midas3} setValue={setMidas3} />
              </div>
              <div className={styles.formGroup}>
                <p>Jours de productivité réduite de moitié (ménage) :</p>
                <InputCounter value={midas4} setValue={setMidas4} />
              </div>
              <div className={styles.formGroup}>
                <p>Jours d&apos;activités sociales manquées :</p>
                <InputCounter value={midas5} setValue={setMidas5} />
              </div>
              <button className="cta" onClick={calculateMidas}>
                Calculer MIDAS
              </button>
            </div>

            {midasScore !== null && (
              <div className={styles.ScoreResult}>
                <h4>Score MIDAS</h4>
                <p>
                  <strong>{midasScore}</strong>
                  <span>({midasGrade})</span>
                </p>
              </div>
            )}
          </section>
          <section>
            <div>
              <h2>Score HIT-6</h2>
              <p className={styles.scoreIntro}>
                Le questionnaire HIT-6 (<em>Headache Impact Test</em>) mesure l’impact des céphalées sur la vie quotidienne
                (douleur, fatigue, concentration, humeur, activités sociales).
                Un score élevé reflète un handicap plus sévère.
              </p>

              <div className={styles.formGroup}>
                <p>1. Lorsque vous avez des maux de tête, la douleur est-elle intense ?</p>
                <RadioGroup name="hit1" value={hit1} setValue={setHit1} options={hitOptions} />
              </div>
              <div className={styles.formGroup}>
                <p>2. Êtes-vous limité dans vos activités quotidiennes à cause de vos maux de tête ?</p>
                <RadioGroup name="hit2" value={hit2} setValue={setHit2} options={hitOptions} />
              </div>
              <div className={styles.formGroup}>
                <p>3. Ressentez-vous le besoin de vous allonger lorsque vous avez un mal de tête ?</p>
                <RadioGroup name="hit3" value={hit3} setValue={setHit3} options={hitOptions} />
              </div>
              <div className={styles.formGroup}>
                <p>4. Ces 4 dernières semaines, vous êtes-vous senti(e) fatigué(e) en raison de vos maux de tête ?</p>
                <RadioGroup name="hit4" value={hit4} setValue={setHit4} options={hitOptions} />
              </div>
              <div className={styles.formGroup}>
                <p>5. Ces 4 dernières semaines, avez-vous été agacé(e) ou « à bout » à cause de vos maux de tête ?</p>
                <RadioGroup name="hit5" value={hit5} setValue={setHit5} options={hitOptions} />
              </div>
              <div className={styles.formGroup}>
                <p>6. Ces 4 dernières semaines, votre concentration a-t-elle été diminuée à cause de vos maux de tête ?</p>
                <RadioGroup name="hit6" value={hit6} setValue={setHit6} options={hitOptions} />
              </div>
              <button className="cta" onClick={calculateHit}>Calculer HIT-6</button>
            </div>
            {hitScore !== null && (
              <div className={styles.ScoreResult}>
                <h4>Score HIT-6</h4>
                <p>
                  <strong>{hitScore}</strong>
                  <span>(impact {hitImpact})</span>
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
