// pages/traitements/index.js
import { useState, useCallback } from "react";
import Head from "next/head";
import Link from "next/link";
import { getAllTreatments, getTreatmentsCount } from "../../lib/pathologyData";
import styles from "../../styles/treatments.module.css";
import slugify from "@/lib/slugify";

export default function TreatmentsIndexPage({ groups, treatmentsCount }) {
  const items = Array.isArray(groups) ? groups : [];
  const [openSlug, setOpenSlug] = useState(null);
  const treatmentsLength = treatmentsCount;

  const handleSummaryClick = useCallback((slug) => (e) => {
    e.preventDefault();
    setOpenSlug((prev) => (prev === slug ? null : slug));
  }, []);

  // Dispatcher les groupes dans 3 colonnes équilibrées
  const columns = [[], [], []];
  items.forEach((g, idx) => {
    columns[idx % 3].push(g);
  });

  return (
    <>
      <Head>
        <title>Traitements par catégories | NeuroTracker</title>
        <meta
          name="description"
          content="Explorez les traitements classés par catégories pharmacologiques (triptans, AINS, anti-CGRP, etc.)."
        />
      </Head>

      <main className={styles.pageTreatments}>
        <div className="wrap M">
          <div className={styles.pageHeader}>
            <h1>Traitements</h1>
            <p>
              {treatmentsLength} traitements recensés pour la prise en charge des migraines et céphalées.
              Classés par grandes catégories thérapeutiques, ces traitements permettent de
              comparer leurs usages, indications et rôles dans la prévention ou le soulagement des crises.
            </p>
          </div>

          <div className={styles.columns}>
            {columns.map((col, colIdx) => (
              <div key={colIdx} className={styles.column}>
                {col.map((g) => {
                  const isOpen = openSlug === g.slug;
                  return (
                    <details
                      key={g.slug}
                      open={isOpen}
                      className={`${styles.catBlock} ${
                        isOpen ? styles.isOpen : ""
                      }`}
                    >
                      <summary
                        className={styles.catSummary}
                        onClick={handleSummaryClick(g.slug)}
                        role="button"
                        aria-expanded={isOpen}
                        aria-controls={`panel-${g.slug}`}
                      >
                        <h2>
                          <span><i className={`far ${isOpen ? "fa-folder-open" : "fa-folder"}`}></i></span>
                          <div>
                            {g.category}
                            <small className={styles.catCount}>
                              ({g.count})
                            </small>
                          </div>
                        </h2>
                      </summary>

                      <ul
                        id={`panel-${g.slug}`}
                        className={styles.treatmentList}
                      >
                        {g.items.map((t) => (
                          <li key={t.slug} className={styles.treatmentItem}>
                            <Link
                              href={`/traitements/${t.slug}`}
                              className={styles.treatmentLink}
                            >
                              <i className="fas fa-chevron-right"></i>
                              {t.molecule_name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </details>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

export async function getStaticProps() {

  // Récupère le nombre total de traitements
  const treatmentsCount = getTreatmentsCount();

  // Récupère tous les traitements
  let treatments = [];
  try {
    treatments = getAllTreatments();
  } catch (e) {
    console.error("getStaticProps /traitements failed:", e);
    treatments = [];
  }

  // Regroupement par catégories
  const byCat = new Map();

  const pushInto = (categoryLabel, tr) => {
    const key = slugify(categoryLabel);
    if (!byCat.has(key)) {
      byCat.set(key, {
        category: categoryLabel,
        slug: key,
        items: [],
      });
    }
    byCat.get(key).items.push(tr);
  };

  for (const t of treatments) {
    const base = {
      slug: t.slug,
      molecule_name: t.molecule_name,
      description_molecule: t.description_molecule || "",
      brands: t.brands || [],
    };

    if (Array.isArray(t.categories) && t.categories.length > 0) {
      for (const c of t.categories) {
        pushInto(String(c), base);
      }
    } else {
      pushInto("Non catégorisés", base);
    }
  }

  const groups = Array.from(byCat.values())
    .map((g) => ({
      ...g,
      items: g.items.sort((a, b) =>
        a.molecule_name.localeCompare(b.molecule_name)
      ),
      count: g.items.length,
    }))
    .sort((a, b) => a.category.localeCompare(b.category));

  return { props: { groups, treatmentsCount } };
}
