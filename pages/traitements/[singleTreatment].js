// pages/traitements/[singleTreatment].js

import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { getAllTreatments, getTreatmentBySlug } from "../../lib/pathologyData";
import { computeScoreGlobal } from "../../lib/scoring";

// Styles
import styles from "../../styles/singleTreatment.module.css";

// Components
import CustomCarousel from "../../components/CustomCarousel/CustomCarousel";
import ModalScoreDetails from "@/components/ModalScoreDetails/ModalScoreDetails";

// Libs
import slugify from "@/lib/slugify";


function TrialCard({ trial, index }) {
  return (
    <div className={styles.trialItem}>
      <h3 className={styles.trialTitle}>
        {
          trial["Score"] === 1 ? (
            <i className={`fas fa-check ${styles.positive}`} title="Résultat positif"></i>
          ) : trial["Score"] === -1 ? (
            <i className={`fas fa-times ${styles.negative}`} title="Résultat négatif"></i>
          ) : (
            <i className={`fas fa-question ${styles.neutral}`} title="Résultat neutre ou inconnu"></i>
          )
        }
        {trial["Essai"] || `Essai #${index + 1}`}
      </h3>
      <div className={styles.trialContent}>
        <div className={styles.trialMeta}>
          {trial["Année"] && (
            <p><label>Année : </label><span>{trial["Année"]}</span></p>
          )}
          {trial["Marque"] && (
            <p><label>Marque : </label><span>{trial["Marque"]}</span></p>
          )}
          {trial["Effectif (randomisé)"] && (
            <p><label>Effectif : </label><span>{trial["Effectif (randomisé)"]}</span></p>
          )}
        </div>
        {trial["Référence"] && (
          <div><label>Référence : </label><span>{trial["Référence"]}</span></div>
        )}
        {trial["Population"] && (
          <div className={styles.column}>
            <label>Population : </label><span>{trial["Population"]}</span>
          </div>
        )}
        {trial["Type"] && (
          <div className={styles.column}><label>Méthode : </label><span>{trial["Type"]}</span></div>
        )}
        {trial["Posologie"] && (
          <div className={styles.column}><label>Posologie : </label><span>{trial["Posologie"]}</span></div>
        )}
        {trial["Résultat principal (résumé)"] && (
          <div className={styles.trialResult}><label>Résultat : </label><span>{trial["Résultat principal (résumé)"]}</span></div>
        )}
      </div>
      <div className={styles.trialFooter}>
        {trial["Source(lien)"] && (
          <>
            <label>Source : </label>
            <a href={trial["Source(lien)"]} target="_blank" rel="noreferrer">
              <i className="fas fa-arrow-up-right-from-square"></i> Détails
            </a>
          </>
        )}
      </div>
    </div>
  );
}

export default function SingleTreatmentPage({ data, scoreGlobal }) {
  const [showScoreDetails, setShowScoreDetails] = useState(false);

  if (!data) {
    return (
      <main className={styles.pageSingleTreatment}>
        <h1>Traitement introuvable</h1>
        <p><Link href="/traitements">Revenir aux traitements</Link></p>
      </main>
    );
  }

  const {
    molecule_name,
    description_molecule,
    brands = [],
    categories = [],
    essais_cliniques = [],
    type_de_traitement,
    prescription,
    price,
    refund,
    effets_indesirables = [],
  } = data;


  // Analyse des essais cliniques
  const totalEssais = essais_cliniques.length;

  const annees = essais_cliniques
    .map(e => parseInt(e["Année"]))
    .filter(a => !isNaN(a));
  const minAnnee = Math.min(...annees);
  const maxAnnee = Math.max(...annees);

  const effectifTotal = essais_cliniques.reduce((sum, e) => {
    const val = parseInt(e["Effectif (randomisé)"]);
    return !isNaN(val) ? sum + val : sum;
  }, 0);

  // Comptage basé sur Score
  const counts = {
    "+": essais_cliniques.filter(e => e.Score === 1).length,
    "-": essais_cliniques.filter(e => e.Score === -1).length,
    "?": essais_cliniques.filter(e => e.Score === 0).length,
  };

  // Score global simple = positifs - négatifs
  const finalScore = counts["+"] - counts["-"];

  // Texte résumé
  const resumeTexte = `Les essais cliniques de ${molecule_name} ont été menés entre ${minAnnee} et ${maxAnnee}, avec un total de ${totalEssais} études et un effectif cumulé de ${effectifTotal} patients randomisés. Les résultats disponibles indiquent une majorité de ${counts["+"] > counts["-"] ? "résultats positifs" : "résultats négatifs"
    }.`;

  const scoreClass =
    typeof scoreGlobal === "number"
      ? scoreGlobal >= 66
        ? styles.positive
        : scoreGlobal < 33
          ? styles.negative
          : styles.neutral
      : "neutral";

  const toggleScoreDetails = () => {
    if (showScoreDetails) {
      setShowScoreDetails(false);
      document.body.style.overflow = "auto";
    } else {
      setShowScoreDetails(true);
      document.body.style.overflow = "hidden";
    }
  }

  return (
    <>
      <Head>
        <title>{`${Array.isArray(molecule_name) ? molecule_name.join(", ") : molecule_name} | NeuroTracker`}</title>
        <meta
          name="description"
          content={`Informations sur ${molecule_name}: description, marques, catégories et essais cliniques.`}
        />
      </Head>

      <ModalScoreDetails show={showScoreDetails} onClose={toggleScoreDetails} />

      <main className={styles.pageSingleTreatment}>
        <div className={styles.pageContent}>
          <div className="wrap XL">
            <div className={`${styles.heroContainer}`}>
              <section className={styles.mainContent}>

                <p className={styles.breadcrumb}>
                  <Link href="/traitements"><i className="far fa-arrow-left"></i>Traitements</Link> / <span>{molecule_name}</span>
                </p>

                <div className={styles.pageTitle}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                    <path d="M112 338.7L112 464C112 499.3 140.7 528 176 528C211.3 528 240 499.3 240 464L240 338.7L112 338.7zM394 428L443.8 500.6C464.3 530.4 503.7 537.2 532.3 516.8C561.4 496 569 454.2 548.1 423.8L500.1 353.8L394 428.1z" /><path d="M112 176C112 140.7 140.7 112 176 112C211.3 112 240 140.7 240 176L240 288L112 288L112 176zM112 464L112 338.7L240 338.7L240 464C240 499.3 211.3 528 176 528C140.7 528 112 499.3 112 464zM64 176L64 464C64 525.9 114.1 576 176 576C237.9 576 288 525.9 288 464L288 358.2L404.3 527.7C439.8 579.4 509.6 592 560.3 555.8C611 519.6 623.3 448.3 587.8 396.6L459.3 209.3C423.8 157.6 354 145 303.3 181.2C297.7 185.2 292.6 189.6 288 194.3L288 176C288 114.1 237.9 64 176 64C114.1 64 64 114.1 64 176zM315.4 313.3C294.5 282.9 302.1 241.1 331.2 220.3C359.7 199.9 399.2 206.6 419.7 236.5L473 314.2L366.9 388.5L315.4 313.4zM443.9 500.6L394.1 428L500.2 353.7L548.2 423.7C569.1 454.1 561.5 495.9 532.4 516.7C503.9 537.1 464.4 530.4 443.9 500.5z" />
                  </svg>
                  <h1 className={styles.title}>{molecule_name}</h1>
                </div>

                {description_molecule && (
                  <div className={`${styles.section} ${styles.description}`}>
                    <p>{description_molecule}</p>
                  </div>
                )}

                {categories.length > 0 && (
                  <div className={`${styles.section} ${styles.categoriesSection}`}>
                    <label><i className="far fa-layer-group"></i> Catégories :</label>
                    {
                      Array.isArray(categories) ? (
                        <ul className={styles.categories}>
                          {categories.map((category, index) => (
                            <li className={styles.category} key={index}>
                              <Link href={`/traitements/category/${slugify(category)}`}>
                                {category}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <ul className={styles.categories}>
                          <li>{categories.join(", ")}</li>
                        </ul>
                      )}
                  </div>
                )}

                {brands.length > 0 && (
                  <div className={`${styles.section} ${styles.brandsSection}`}>
                    <label><i className="far fa-tag"></i> Marques :</label>
                    {
                      Array.isArray(brands) ? (
                        <ul className={styles.brands}>
                          {brands.map((brand, index) => (
                            <li className={styles.brand} key={index}>{brand}</li>
                          ))}
                        </ul>
                      ) : (
                        <ul className={styles.brands}>
                          <li>{brands.join(", ")}</li>
                        </ul>
                      )}
                  </div>
                )}

              </section>

              <section className={styles.mainDetails}>
                <ul>
                  <li><label>Type de traitement</label><span>{type_de_traitement}</span></li>
                  <li><label>Prescription</label><span>{prescription}</span></li>
                  <li><label>Prix<small>(Estimation)</small></label><span>{price}</span></li>
                  <li><label>Remboursement</label><span>{refund}</span></li>
                </ul>
              </section>

            </div>

            {effets_indesirables.length > 0 && (
              <section className={`${styles.section} ${styles.sideEffectsSection}`}>
                <header>
                  <h2>Effets indésirables</h2>
                  <p>Les effets indésirables sont les réactions indésirables qui peuvent survenir lors de l’utilisation d’un traitement. Ils peuvent varier en fonction des individus et des traitements.</p>
                </header>
                <ul className={styles.sideEffects}>
                  {effets_indesirables.map((effect, index) => (
                    <li key={index} className={styles.effect}>
                      <small>{effect.Fréquence}</small>
                      <p>{effect.Effet}</p>
                      <Link href={effect.Source} target="_blank"><i className="far fa-external-link"></i></Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}


            <section className={styles.resultats}>
              <header>
                <h2>Résultats cliniques</h2>
                <p className={styles.resumeTexte}>{resumeTexte}</p>
              </header>
              <ul>
                <li className={styles.trials}><label>Nombre total d’essais</label><span>{totalEssais}</span></li>
                <li className={styles.period}><label>Période</label><span>{minAnnee} <i className="far fa-arrow-right"></i> {maxAnnee}</span></li>
                <li className={styles.count}><label>Effectif total</label> <span>{effectifTotal}</span></li>
                <li className={`${styles.result}`}><label>Résultats cliniques</label>
                  <div>
                    <span>{counts["+"]}/{counts["-"]}/{counts["?"]}</span>
                  </div>
                </li>
                <li className={`${styles.score} ${scoreClass}`}>
                  <button className={styles.scoreDetails} onClick={toggleScoreDetails}><i className="far fa-info"></i></button>
                  <label>Score global</label>
                  <div><span>{Number.isFinite(scoreGlobal) ? `${scoreGlobal}/100` : "—"}</span></div>
                </li>
              </ul>
            </section>


            <section className={styles.trialSection}>
              <div className={styles.section}>
                <h2>Essais cliniques <span>({essais_cliniques.length})</span></h2>
                {Array.isArray(essais_cliniques) && essais_cliniques.length > 0 ? (
                  <CustomCarousel visible={3} gap={16}>
                    {essais_cliniques.map((tr, i) => (
                      <TrialCard key={`trial-${i}`} trial={tr} index={i} />
                    ))}
                  </CustomCarousel>
                ) : (
                  <p>Aucun essai clinique trouvé.</p>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}

export async function getStaticPaths() {
  const treatments = getAllTreatments();
  return {
    paths: treatments.map((t) => ({ params: { singleTreatment: t.slug } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const data = getTreatmentBySlug(params.singleTreatment) || null;
  let scoreGlobal = null;

  if (data) {
    const allTreatments = getAllTreatments();
    const group = allTreatments.filter(
      t => t.type_de_traitement === data.type_de_traitement
    );
    scoreGlobal = computeScoreGlobal(data, group);
  }

  return { props: { data, scoreGlobal } };
}
