// pages/pro.js

import { UseEffect, useState } from "react";
import Head from "next/head";

import Link from "next/link";

import styles from "../styles/Pro.module.css";

export default function Pro() {
    const outils = [
        {
            title: "Arbre décisionnel interactif",
            path: "/outils/arbre",
            description: "Un outil pour vous aider à poser un diagnostic différentiel."
        },
        {
            title: "Algorithme thérapeutique",
            path: "/outils/therapeutique",
            description: "Un outil pour vous guider dans le choix du traitement des céphalées."
        },
        {
            title: "Calculateur de scores",
            path: "/outils/scores",
            description: "Un outil pour vous aider à évaluer l'impact des céphalées (MIDAS, HIT-6)."
        }
    ];

    return (
        <>
        <Head>
            <title>Outils Pro - NeuroTracker</title>
            <meta name="description" content="Des outils en ligne pour les professionnels de santé afin d'évaluer et de traiter les céphalées." />
        </Head>
        <main className={`${styles.proPage}`}>
            <div className="wrap M">
                <div className={styles.pageHeader}>
                    <h1>Professionnels de santé</h1>
                    <p>Des outils en ligne pour vous aider dans votre pratique clinique.</p>
                </div>
                <ul className={styles.outilList}>
                    {outils.map((o) => (
                        <li
                            key={o.path}
                            className={styles.outilItem}
                        >
                            <Link href={o.path}>
                                <h3>{o.title}</h3>
                                <p>{o.description}</p>
                                <button>
                                    <i className="fas fa-arrow-right"></i>
                                </button>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </main>
        </>
    );
}
