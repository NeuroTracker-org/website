// pages/pathologies/[singlePathology].js
import Head from "next/head";
import Link from "next/link";
import styles from "../../styles/singlePathology.module.css";
import { getAllPathologies } from "../../lib/pathologyData";
import slugify from "../../lib/slugify";

export default function SinglePathologyPage({ data, validCategories = [] }) {
  if (!data) {
    return (
      <main className="page-single-pathology">
        <h1>Pathologie introuvable</h1>
        <p>
          <Link href="/pathologies">Revenir aux pathologies</Link>
        </p>
      </main>
    );
  }

  const { name, description, causes = [], traitements = {} } = data;
  const { de_crise = [], de_fond = [], non_médicamenteux = [] } = traitements;

  const renderTreatmentsList = (arr, prefix) => (
    <ul>
      {arr.map((t, i) => {
        const label = String(t).trim();
        const slug = slugify(label);

        // Vérifie si la catégorie est valide
        const isValid =
          validCategories.includes(slug) ||
          validCategories.includes(label);

        return (
          <li key={`${prefix}-${i}`}>
            {isValid ? (
              <Link href={`/traitements/category/${slug}`}>{label}</Link>
            ) : (
              <span>{label}</span>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      <Head>
        <title>{name} | NeuroTracker</title>
        <meta
          name="description"
          content={`Informations sur ${name} : description, causes et traitements.`}
        />
      </Head>

      <main className={styles.pageSinglePathology}>
        <div className="wrap XL">
          <div className={styles.pageHeader}>
            <p className={styles.breadcrumb}>
              <Link href="/pathologies">
                <i className="fas fa-arrow-left"></i>Pathologies
              </Link>{" "}
              / <span>{name}</span>
            </p>
            <div className={styles.pageTitle}>
              <h1>{name}</h1>
              <p>{description}</p>
            </div>
          </div>

          <article className={styles.pathologyCard}>
            {causes.length > 0 && (
              <section className={styles.sectionCauses}>
                <h2>Causes</h2>
                <ul>{causes.map((c, i) => <li key={i}>{c}</li>)}</ul>
              </section>
            )}

            <section className={styles.sectionTreatments}>
              <h2>Traitements</h2>
              {de_crise.length > 0 && (
                <div>
                  <h3>De crise</h3>
                  {renderTreatmentsList(de_crise, "crise")}
                </div>
              )}
              {de_fond.length > 0 && (
                <div>
                  <h3>De fond</h3>
                  {renderTreatmentsList(de_fond, "fond")}
                </div>
              )}
              {non_médicamenteux.length > 0 && (
                <div>
                  <h3>Non médicamenteux</h3>
                  {renderTreatmentsList(non_médicamenteux, "nonmed")}
                </div>
              )}

              {de_crise.length === 0 &&
                de_fond.length === 0 &&
                non_médicamenteux.length === 0 && (
                  <div>
                    <p>Aucun traitement renseigné.</p>
                  </div>
                )}
            </section>
          </article>
        </div>
      </main>
    </>
  );
}

/* --- SSG --- */
export async function getStaticPaths() {
  const pathologies = getAllPathologies();
  return {
    paths: pathologies.map((p) => ({ params: { singlePathology: p.slug } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const fs = await import("fs");
  const path = await import("path");
  const slug = params.singlePathology;

  // --- Charger headaches.json
  const FILE = path.join(process.cwd(), "data", "headaches.json");
  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch (e) {
    console.error("[singlePathology] read headaches.json:", e);
    return { props: { data: null, validCategories: [] } };
  }

  // --- Charger treatments.json et extraire toutes les catégories uniques
  const TREATMENTS_FILE = path.join(process.cwd(), "data", "treatments.json");
  let treatmentsRaw = [];
  try {
    const parsed = JSON.parse(fs.readFileSync(TREATMENTS_FILE, "utf8"));
    treatmentsRaw = Object.values(parsed); // ✅ transforme l'objet en tableau
  } catch (e) {
    console.error("[singlePathology] read treatments.json:", e);
    treatmentsRaw = [];
  }

  const categoriesSet = new Set();
  for (const t of treatmentsRaw) {
    if (Array.isArray(t.categories)) {
      t.categories.forEach((c) => {
        categoriesSet.add(slugify(String(c)));
        categoriesSet.add(String(c).trim()); // garde aussi le label brut
      });
    }
  }
  const validCategories = Array.from(categoriesSet);

  console.log(
    `${validCategories}`
  );

  // --- Trouver la pathologie
  let pathology = null;
  const visitItem = (item) => {
    if (item && typeof item.name === "string" && slugify(item.name) === slug) {
      const t = item.traitements || {};
      pathology = {
        name: item.name || "",
        description: item.description || "",
        causes: Array.isArray(item.causes) ? item.causes : [],
        traitements: {
          de_crise: Array.isArray(t.de_crise) ? t.de_crise : [],
          de_fond: Array.isArray(t.de_fond) ? t.de_fond : [],
          non_médicamenteux: Array.isArray(t.non_médicamenteux)
            ? t.non_médicamenteux
            : [],
        },
      };
      return true;
    }
    return false;
  };

  const walkUnknownShape = (node) => {
    if (!node || pathology) return;
    if (Array.isArray(node)) {
      for (const el of node) {
        if (pathology) break;
        if (Array.isArray(el?.categories)) {
          for (const sub of el.categories) {
            if (pathology) break;
            if (Array.isArray(sub?.items)) {
              for (const it of sub.items) {
                if (visitItem(it)) return;
              }
            }
          }
        }
        if (!pathology) walkUnknownShape(el);
      }
      return;
    }
    if (typeof node === "object") {
      if (typeof node.name === "string" && visitItem(node)) return;
      for (const child of Object.values(node)) {
        if (pathology) break;
        walkUnknownShape(child);
      }
    }
  };

  walkUnknownShape(raw);

  return { props: { data: pathology, validCategories } };
}
