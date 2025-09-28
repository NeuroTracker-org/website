// pages/pathologies/index.js
import { useState, useCallback } from "react";
import Head from "next/head";
import Link from "next/link";
import { getAllPathologies } from "../../lib/pathologyData";
import styles from "../../styles/pathologies.module.css";
import slugify from "../../lib/slugify";

/* Utils */

// Affichage propre (remplace les underscores, compresse espaces)
function prettyLabel(s) {
  return String(s || "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function PathologiesIndexPage({ groups }) {
  const items = Array.isArray(groups) ? groups : [];
  const [openSlug, setOpenSlug] = useState(null);

  const handleSummaryClick = useCallback((slug) => (e) => {
    e.preventDefault();
    setOpenSlug((prev) => (prev === slug ? null : slug));
  }, []);

  // Répartir en 3 colonnes
  const columns = [[], [], []];
  items.forEach((g, idx) => {
    columns[idx % 3].push(g);
  });

  return (
    <>
      <Head>
        <title>Pathologies par catégories | NeuroTracker</title>
        <meta
          name="description"
          content="Explorez les pathologies classées par catégories et sous-catégories (migraines, céphalées, etc.)."
        />
      </Head>

      <main className={styles.mainPathologies}>
        <div className="wrap M">
          <div className={styles.pageHeader}>
            <h1>
              <span>Pathologies</span>
            </h1>
            <p>
              Principales formes de migraines et de céphalées répertoriées par NeuroTracker.
              Chaque fiche présente une description, les causes connues ainsi que les options
              de prise en charge disponibles, afin de mieux comprendre et comparer les
              différents types de pathologies.
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
                      className={`${styles.catBlock} ${isOpen ? styles.isOpen : ""}`}
                    >
                      <summary
                        className={styles.catSummary}
                        onClick={handleSummaryClick(g.slug)}
                        role="button"
                        aria-expanded={isOpen}
                        aria-controls={`panel-${g.slug}`}
                      >
                        <h2>
                          <span>
                            <i className={`far ${isOpen ? "fa-folder-open" : "fa-folder"}`} />
                          </span>
                          <div>
                            <div className={styles.catTitle}>{g.category}<small className={styles.catCount}>{g.count}</small></div>
                          </div>
                        </h2>
                      </summary>


                      <ul id={`panel-${g.slug}`} className={styles.pathologyList}>
                        {g.items.map((p) => (
                          <li key={p.slug} className={styles.pathologyItem}>
                            <Link href={`/pathologies/${p.slug}`} className={styles.pathologyLink}>
                              <i className="fas fa-chevron-right" />
                              {p.name}
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
  let pathologies = [];
  try {
    pathologies = getAllPathologies();
  } catch (e) {
    console.error("getStaticProps /pathologies failed:", e);
    pathologies = [];
  }

  // Regrouper par (superCategory, category) normalisés et dédupliquer
  const byPair = new Map();

  const pushInto = (superCategoryRaw, categoryRaw, item) => {
    const superCategory = prettyLabel(superCategoryRaw || "Divers");
    const category = prettyLabel(categoryRaw || "Autres");

    // clé de regroupement dédupliquée par slug (couple super/sub)
    const key = `${slugify(superCategory)}__${slugify(category)}`;

    if (!byPair.has(key)) {
      byPair.set(key, {
        superCategory,
        category,
        slug: key,
        items: [],
      });
    }

    // éviter les doublons de pathologies dans le même groupe
    const group = byPair.get(key);
    if (!group.items.some((x) => x.slug === item.slug)) {
      group.items.push(item);
    }
  };

  for (const p of pathologies) {
    pushInto(p.superCategory, p.category, {
      slug: p.slug,
      name: p.name,
      description: p.description || "",
    });
  }

  const groups = Array.from(byPair.values())
    .map((g) => ({
      ...g,
      items: g.items.sort((a, b) => a.name.localeCompare(b.name)),
      count: g.items.length,
    }))
    .sort((a, b) => {
      const s = a.superCategory.localeCompare(b.superCategory);
      return s !== 0 ? s : a.category.localeCompare(b.category);
    });

  return { props: { groups } };
}
