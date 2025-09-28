// pages/analyse.js

import React, { useState, useMemo, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";

// Data
import { getAllTreatments, getTreatmentsCount } from "../lib/pathologyData";

// Utils
import slugify from "@/lib/slugify";
import { computeScoreGlobal } from "@/lib/scoring";

// Components
import ModalScoreDetails from "@/components/ModalScoreDetails/ModalScoreDetails";

// Styles
import styles from "../styles/analysePage.module.css";





// ---- Helpers ----
function normalizePrice(value) {
    if (!value) return { numeric: null, special: true };
    const txt = String(value).toLowerCase();
    if (txt.includes("libre") || txt.includes("hors france")) {
        return { numeric: null, special: true };
    }
    const num = parseFloat(txt.replace(",", ".").replace(/[^\d.]/g, ""));
    if (isNaN(num)) return { numeric: null, special: true };
    return { numeric: num, special: false };
}

export default function AnalysePage({ rows, treatmentsCount }) {
    // --- Filtres ---
    const [activeFilterModal, setActiveFilterModal] = useState(null);
    const [selTreatmentTypes, setSelTreatmentTypes] = useState([]);
    const [selGenres, setSelGenres] = useState([]);
    const [showScoreDetails, setShowScoreDetails] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const maxWidth = 1024;

    useEffect(() => {
        if (typeof window === "undefined") return;

        const check = () => setIsMobile(window.innerWidth <= maxWidth);
        check(); // on l'appelle une fois au montage
        window.addEventListener("resize", check);

        return () => window.removeEventListener("resize", check);
    }, [maxWidth]);

    useEffect(() => {
        console.log("isMobile:", isMobile);
    }, [isMobile]);


    const toggleScoreDetails = () => {
        if (showScoreDetails) {
            setShowScoreDetails(false);
            document.body.style.overflow = "auto";
        } else {
            setShowScoreDetails(true);
            document.body.style.overflow = "hidden";
        }
    }

    const availableTreatmentTypes = useMemo(
        () => Array.from(new Set(rows.map((r) => r.type_de_traitement))).sort(),
        [rows]
    );

    const availableGenres = useMemo(
        () =>
            Array.from(new Set(rows.flatMap((r) => r.categories || []))).sort((a, b) =>
                a.localeCompare(b, "fr", { sensitivity: "base" })
            ),
        [rows]
    );

    const toggle = (state, setter, value) => {
        if (state.includes(value)) {
            setter(state.filter((v) => v !== value));
        } else {
            setter([...state, value]);
        }
    };

    const resetFilters = () => {
        setSelTreatmentTypes([]);
        setSelGenres([]);
    };

    const closeFilterModal = () => setActiveFilterModal(null);
    const handleFilterModal = (modal) => {
        if (activeFilterModal === modal) {
            closeFilterModal();
        } else {
            setActiveFilterModal(modal);
        }
    };

    const handleClickOutsideModal = (e) => {
        if (!e.target.closest(`.${styles.filterSection}`)) {
            closeFilterModal();
        }
    };

    useEffect(() => {
        document.addEventListener("click", handleClickOutsideModal);
        return () => {
            document.removeEventListener("click", handleClickOutsideModal);
        };
    }, []);

    // --- Tri ---
    const [sortConfig, setSortConfig] = useState({
        key: "molecule_name",
        direction: "asc",
    });

    const filteredRows = useMemo(() => {
        return rows.filter((r) => {
            if (selTreatmentTypes.length > 0 && !selTreatmentTypes.includes(r.type_de_traitement)) {
                return false;
            }
            if (selGenres.length > 0 && !r.categories.some((c) => selGenres.includes(c))) {
                return false;
            }
            return true;
        });
    }, [rows, selTreatmentTypes, selGenres]);

    const sortedRows = useMemo(() => {
        const sorted = [...filteredRows];
        if (sortConfig.key) {
            sorted.sort((a, b) => {
                let v1 = a[sortConfig.key];
                let v2 = b[sortConfig.key];

                if (v1 === null || v1 === undefined) v1 = "";
                if (v2 === null || v2 === undefined) v2 = "";

                if (sortConfig.key === "price") {
                    const p1 = normalizePrice(v1);
                    const p2 = normalizePrice(v2);
                    if (p1.special && !p2.special) return 1;
                    if (!p1.special && p2.special) return -1;
                    if (p1.special && p2.special) return 0;
                    if (p1.numeric < p2.numeric) return sortConfig.direction === "asc" ? -1 : 1;
                    if (p1.numeric > p2.numeric) return sortConfig.direction === "asc" ? 1 : -1;
                    return 0;
                }

                if (typeof v1 === "string" && typeof v2 === "string") {
                    const cmp = v1.localeCompare(v2, "fr", { sensitivity: "base" });
                    return sortConfig.direction === "asc" ? cmp : -cmp;
                }

                if (v1 < v2) return sortConfig.direction === "asc" ? -1 : 1;
                if (v1 > v2) return sortConfig.direction === "asc" ? 1 : -1;
                return 0;
            });
        }
        return sorted;
    }, [filteredRows, sortConfig]);

    const handleSort = (key) => {
        setSortConfig((prev) => {
            if (prev.key === key) {
                return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
            }
            return { key, direction: "asc" };
        });
    };

    const renderSortIcon = (key) => {
        if (sortConfig.key !== key) return <i className="fas fa-sort" />;
        return sortConfig.direction === "asc" ? (
            <i className="fas fa-sort-up" />
        ) : (
            <i className="fas fa-sort-down" />
        );
    };


    if (treatmentsCount === 0) {
        return (
            <>
                <Head>
                    <title>Analyse | NeuroTracker</title>
                    <meta name="description" content="Analyse comparative des traitements listés sur NeuroTracker." />
                </Head>
                <main className={styles.analysePage}>
                    <div className="wrap XL">
                        <div className={styles.pageHeader}>
                            <h1>Analyse des traitements</h1>
                            <p>Aucun traitement n'a encore été recensé pour la prise en charge des migraines et céphalées.</p>
                        </div>
                    </div>
                </main>
            </>
        );
    }

    return (
        <>
            <Head>
                <title>Analyse | NeuroTracker</title>
                <meta name="description" content="Analyse comparative des traitements listés sur NeuroTracker." />
            </Head>
            <ModalScoreDetails show={showScoreDetails} onClose={toggleScoreDetails} />

            <main className={styles.analysePage}>
                <div className="wrap XL">
                    <div className={styles.pageHeader}>
                        <h1>Analyse des traitements</h1>
                        <p>
                            Cette page présente une analyse des {treatmentsCount} traitements recensés pour la prise en charge des
                            migraines et céphalées.
                        </p>
                        <p>Le score global est une note sur 100 attribuée à chaque traitement. Il permet de comparer la solidité des preuves cliniques et la pertinence d’utilisation dans la migraine, en tenant compte de plusieurs facteurs.</p>
                        <button className="cta" onClick={toggleScoreDetails}>En savoir plus</button>
                    </div>

                    {/* Barre de filtres */}
                    <div className={styles.filterNav}>

                        {(selTreatmentTypes.length > 0 || selGenres.length > 0) && (
                            <div className={styles.resetFilters}>
                                <h4 className="cta" type="button" onClick={resetFilters}>
                                    <i className="fas fa-times"></i> Réinitialiser
                                </h4>
                            </div>
                        )}

                        <div className={styles.filterSection}>
                            <h4 onClick={() => handleFilterModal("treatment_type")}>
                                Type de traitement <i className="fas fa-caret-down"></i>
                            </h4>
                            <ul
                                className={`${styles.filterList} ${activeFilterModal === "treatment_type" ? styles.active : ""
                                    }`}
                            >
                                {availableTreatmentTypes.map((t) => {
                                    const active = selTreatmentTypes.includes(t);
                                    return (
                                        <li
                                            key={t}
                                            onClick={() => toggle(selTreatmentTypes, setSelTreatmentTypes, t)}
                                            className={`${styles.filterItem} ${active ? styles.active : ""}`}
                                        >
                                            <i className="fas fa-check"></i>
                                            <span>{t}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>

                        <div className={styles.filterSection}>
                            <h4 onClick={() => handleFilterModal("genres")}>
                                Catégories <i className="fas fa-caret-down"></i>
                            </h4>
                            <ul
                                className={`${styles.filterList} ${activeFilterModal === "genres" ? styles.active : ""
                                    }`}
                            >
                                {availableGenres.map((g) => {
                                    const active = selGenres.includes(g);
                                    return (
                                        <li
                                            key={g}
                                            onClick={() => toggle(selGenres, setSelGenres, g)}
                                            className={`${styles.filterItem} ${active ? styles.active : ""}`}
                                        >
                                            <i className="fas fa-check"></i>
                                            <span>{g}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>


                    {
                        !isMobile ?
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th onClick={() => handleSort("molecule_name")}>Molécule {renderSortIcon("molecule_name")}</th>
                                        <th>Type</th>
                                        <th onClick={() => handleSort("categories")}>Catégories {renderSortIcon("categories")}</th>
                                        <th>Marques</th>
                                        <th onClick={() => handleSort("price")}>Prix {renderSortIcon("price")}</th>
                                        <th onClick={() => handleSort("refund")}>Remboursement {renderSortIcon("refund")}</th>
                                        <th onClick={() => handleSort("nbEssais")}>Nb essais {renderSortIcon("nbEssais")}</th>
                                        <th onClick={() => handleSort("effectifTotal")}>Effectif total {renderSortIcon("effectifTotal")}</th>
                                        <th onClick={() => handleSort("scoreGlobal")}>Score global {renderSortIcon("scoreGlobal")}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedRows.map((r) => (
                                        <tr key={r.slug}>
                                            <td>
                                                <Link href={`/traitements/${r.slug}`}>{r.molecule_name}</Link>
                                            </td>
                                            <td>{r.type_de_traitement || "—"}</td>
                                            <td>
                                                {r.categories.length > 0 ? (
                                                    <Link href={`/traitements/category/${slugify(r.categories[0])}`}>
                                                        {r.categories.join(", ")}
                                                    </Link>
                                                ) : (
                                                    "—"
                                                )}
                                            </td>
                                            <td>{r.brands.join(", ") || "—"}</td>
                                            <td>{r.price || "—"}</td>
                                            <td>{r.refund || "—"}</td>
                                            <td>{r.nbEssais}</td>
                                            <td>{r.effectifTotal}</td>
                                            <td>
                                                <span
                                                    className={
                                                        r.scoreGlobal >= 66 ? "positive" : r.scoreGlobal < 33 ? "negative" : "neutral"
                                                    }
                                                >
                                                    {r.scoreGlobal}
                                                </span>
                                                <span className="grey">/100</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            :
                            <div className={styles.mobileTable}>
                                {sortedRows.map((r) => (
                                    <div className={`mobileRow ${styles.mobileRow}`} key={r.slug}>
                                        <h3>
                                            <Link href={`/traitements/${r.slug}`}>{r.molecule_name}</Link>
                                            <div className={styles.score}>
                                                <span className={
                                                    r.scoreGlobal >= 66 ? "positive" : r.scoreGlobal < 33 ? "negative" : "neutral"
                                                }>
                                                    {r.scoreGlobal}
                                                </span>
                                                <span className="grey">/100</span>
                                            </div>
                                        </h3>
                                        <div className={styles.rowContent}>
                                            <p><label>Type :</label> {r.type_de_traitement || "—"}</p>
                                            <p>
                                                <label>Catégories :</label>{" "}
                                                {r.categories.length > 0 ? (
                                                    <Link href={`/traitements/category/${slugify(r.categories[0])}`}>
                                                        {r.categories.join(", ")}
                                                    </Link>
                                                ) : (
                                                    "—"
                                                )}
                                            </p>
                                            <p><label>Marques :</label> {r.brands.join(", ") || "—"}</p>
                                            <p><label>Prix :</label> {r.price || "—"}</p>
                                            <p><label>Remboursement :</label> {r.refund || "—"}</p>
                                            <p><label>Nb essais :</label> {r.nbEssais}</p>
                                            <p><label>Effectif total :</label> {r.effectifTotal}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                    }
                </div>
            </main>
        </>
    );
}

// ----- getStaticProps -----
// (on garde ton calcul complet déjà présent dans ta version précédente)
export async function getStaticProps() {
    const treatmentsCount = getTreatmentsCount();
    let treatments = [];
    try {
        treatments = getAllTreatments();
    } catch (e) {
        console.error("getStaticProps /analyse failed:", e);
        treatments = [];
    }

    // Grouper par type
    const byType = {};
    for (const t of treatments) {
        const type = t.type_de_traitement || "Autre";
        if (!byType[type]) byType[type] = [];
        byType[type].push(t);
    }

    const rows = [];

    for (const [type, group] of Object.entries(byType)) {
        for (const t of group) {
            const scoreGlobal = computeScoreGlobal(t, group);

            rows.push({
                slug: t.slug,
                molecule_name: t.molecule_name,
                brands: t.brands || [],
                categories: t.categories || [],
                type_de_traitement: type,
                refund: t.refund || null,
                price: t.price || null,
                nbEssais: t.essais_cliniques?.length || 0,
                effectifTotal: (t.essais_cliniques || []).reduce((sum, e) => {
                    const val = parseInt(e["Effectif (randomisé)"]);
                    return !isNaN(val) ? sum + val : sum;
                }, 0),
                scoreGlobal,
            });
        }
    }

    return { props: { rows, treatmentsCount } };
}
