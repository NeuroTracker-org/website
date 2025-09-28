// pages/about.js

import React from 'react';

import GlowGridCanvas from "@/components/GlowGridCanvas/GlowGridCanvas";

import styles from '../styles/about.module.css';

const About = () => {
    return (
        <>
            <main className={styles.aboutPage}>
                <div className={`${styles.content} wrap M`}>
                    <header className={styles.header}>
                        <h1>
                            À propos de
                            <div className={styles.logo}>
                                <img src="/wordmark.svg" alt="NeuroTracker" />
                            </div>
                        </h1>
                        <p>
                            NeuroTracker est une <strong>plateforme de suivi et d&apos;analyse</strong>
                            dédiée aux <em>migraines et céphalées</em> qui propose des outils cliniques pour les professionnels de santé
                            et une application innovante pour les patients, afin de mieux comprendre,
                            suivre et traiter les troubles.
                        </p>
                    </header>

                    {/* SECTION PRO */}
                    <div className={styles.innerContent}>
                        <section className={styles.card}>
                            <h2>Outils pour les professionnels</h2>
                            <ul>
                                <li>
                                    <i className="fas fa-sitemap"></i>{" "}
                                    <strong>Arbre décisionnel interactif :</strong> aide au diagnostic
                                    différentiel des céphalées.
                                </li>
                                <li>
                                    <i className="fas fa-prescription-bottle-medical"></i>{" "}
                                    <strong>Algorithme thérapeutique :</strong> guide dans le choix et
                                    l&apos;ajustement des traitements.
                                </li>
                                <li>
                                    <i className="fas fa-calculator"></i>{" "}
                                    <strong>Calculateur de scores :</strong> évalue l&apos;impact des
                                    céphalées avec les échelles MIDAS et HIT-6.
                                </li>
                            </ul>
                        </section>

                        {/* SECTION APP PATIENT */}
                        <section className={styles.card}>
                            <h2>L&apos;application NeuroTracker</h2>
                            <ul>
                                <li>
                                    Conçue pour les patients, l&apos;application mobile{" "}
                                    <strong>facilite le suivi quotidien</strong> :
                                </li>
                                <li>
                                    <i className="fas fa-notes-medical"></i> Enregistrer facilement les
                                    crises et traitements.
                                </li>
                                <li>
                                    <i className="fas fa-chart-line"></i> Visualiser l&apos;évolution et
                                    identifier les tendances.
                                </li>
                                <li>
                                    <i className="fas fa-lightbulb"></i> Comprendre les facteurs déclenchants
                                    et mieux gérer ses céphalées.
                                </li>
                            </ul>
                        </section>

                        {/* SECTION PHILOSOPHIE */}
                        <section className={styles.card}>
                            <h2>Philosophie du projet</h2>
                            <ul>
                                <li>
                                    NeuroTracker est un projet <strong>Open Source</strong> :
                                    le code est librement accessible sur GitHub et toute la communauté
                                    peut contribuer à son amélioration.
                                </li>
                                <li>
                                    L&apos;utilisation est <strong>100% anonyme</strong>, sans création de compte.
                                    Chaque utilisateur reste <strong>propriétaire de ses données</strong>.
                                </li>
                                <li>
                                    <a
                                        href="https://github.com/NeuroTracker-org"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.githubLink}
                                    >
                                        <i className="fab fa-github"></i>Voir le code sur GitHub
                                    </a>
                                </li>
                            </ul>
                        </section>
                    </div>
                </div>
            </main>
            <div className={styles.glowGrid}>
                <GlowGridCanvas />
            </div>

        </>
    );
};
export default About;
