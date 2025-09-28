// pages/traitements/category/[singleCategory].js
import Head from "next/head";
import Link from "next/link";
import { getAllTreatments } from "../../../lib/pathologyData";
import styles from "../../../styles/treatmentsCategory.module.css";

import slugify from "../../../lib/slugify";


export default function TreatmentsByCategoryPage({ category, treatments }) {
  if (!category) {
    return (
      <>
        <Head>
          <title>Catégorie introuvable | Traitements | NeuroTracker</title>
          <meta name="description" content="Catégorie de traitements introuvable." />
        </Head>
        <main className={styles.pageTreatmentsCategory}>
          <div className="wrap M">
            <h1 className={styles.pageHeader}>Catégorie introuvable</h1>
            <p><Link href="/traitements">Revenir aux traitements</Link></p>
          </div>
        </main>
      </>
    );
  }

  const items = Array.isArray(treatments) ? treatments : [];

  return (
    <>
      <Head>
        <title>{category.label} | Traitements | NeuroTracker</title>
        <meta
          name="description"
          content={`Liste des traitements classés dans la catégorie "${category.label}".`}
        />
      </Head>

      <main className={styles.pageTreatmentsCategory}>

        <div className="wrap M">

          <div className={styles.pageHeader}>
            <p className={styles.breadcrumb}>
              <Link href="/traitements"><i className="far fa-arrow-left"></i>Traitements</Link> / <span>{category.label}</span>
            </p>
            <h1 className={styles.categoryTitle}>
              {category.label}
              <small className={styles.categoryCount}>({items.length})</small>
            </h1>
          </div>

          <ul className={styles.treatmentList}>
            {items.map((t) => (
              <li key={t.slug} className={styles.treatmentItem}>
                <Link href={`/traitements/${t.slug}`} className={styles.treatmentLink}>
                  <div className={styles.content}>
                    <h2>
                      {t.molecule_name}
                    </h2>
                    <div className={styles.brandsList}>
                      <label>Marques :</label>
                      {t.brands?.length > 0 && (
                        <div className={styles.treatmentBrands}>
                          {t.brands.join(" · ")}
                        </div>
                      )}
                    </div>
                    {t.description_molecule && (
                      <p className={styles.treatmentDesc}>
                        {t.description_molecule.length > 200
                          ? `${t.description_molecule.slice(0, 200)}…`
                          : t.description_molecule}
                      </p>
                    )}
                  </div>

                  <button><i className="far fa-chevron-right"></i></button>
                </Link>
              </li>
            ))}

            {items.length === 0 && (
              <li className={styles.treatmentItem}>
                <p>Aucun traitement dans cette catégorie.</p>
              </li>
            )}
          </ul>
        </div>
      </main>
    </>
  );
}

/* SSG: on génère un path par catégorie présente dans les données */
export async function getStaticPaths() {
  const treatments = getAllTreatments();
  const cats = new Map(); // slug -> label

  for (const t of treatments) {
    for (const c of t.categories || []) {
      const s = slugify(c);
      if (!cats.has(s)) cats.set(s, String(c));
    }
  }

  return {
    paths: Array.from(cats.keys()).map((slug) => ({
      params: { singleCategory: slug },
    })),
    fallback: false,
  };
}

/* SSG: on filtre les traitements par catégorie (slug) */
export async function getStaticProps({ params }) {
  const all = getAllTreatments();

  const wantedSlug = params.singleCategory;
  let label = null;
  const items = [];

  for (const t of all) {
    const cats = Array.isArray(t.categories) ? t.categories : [];
    for (const c of cats) {
      if (slugify(c) === wantedSlug) {
        label = label || String(c);
        items.push({
          slug: t.slug,
          molecule_name: t.molecule_name,
          description_molecule: t.description_molecule || "",
          brands: t.brands || [],
        });
        break;
      }
    }
  }

  // tri alpha par nom de molécule
  items.sort((a, b) => a.molecule_name.localeCompare(b.molecule_name));

  const category = label ? { label, slug: wantedSlug } : null;

  return {
    props: {
      category,
      treatments: items,
    },
  };
}
