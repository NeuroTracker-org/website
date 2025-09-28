// pages/pathologies/category/[singleCategory].js
import Head from "next/head";
import Link from "next/link";
import { getAllPathologies } from "../../../lib/pathologyData";
import styles from "../../../styles/pathologiesCategory.module.css";

/* Util local pour slugifier exactement comme ailleurs */
function slugify(input) {
    return String(input || "")
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

export default function PathologiesByCategoryPage({ category, pathologies }) {
    if (!category) {
        return (
            <main className={styles.pagePathologiesCategory}>
                <div className="wrap M">
                    <h1 className={styles.pageHeader}>Catégorie introuvable</h1>
                    <p><Link href="/pathologies">Revenir aux pathologies</Link></p>
                </div>
            </main>
        );
    }

    const items = Array.isArray(pathologies) ? pathologies : [];

    return (
        <>
            <Head>
                <title>{category.label} | Pathologies | NeuroTracker</title>
                <meta
                    name="description"
                    content={`Liste des pathologies classées dans la catégorie "${category.label}".`}
                />
            </Head>

            <main className={styles.pagePathologiesCategory}>
                <div className="wrap M">
                    <div className={styles.pageHeader}>
                        <p className={styles.breadcrumb}>
                            <Link href="/pathologies"><i className="fas fa-arrow-left"></i>Pathologies</Link> / <span>{category.label}</span>
                        </p>
                        <h1 className={styles.categoryTitle}>
                            {category.label}
                            <small className={styles.categoryCount}>({items.length})</small>
                        </h1>
                    </div>

                    <ul className={styles.pathologyList}>
                        {items.map((p) => (
                            <li key={p.slug} className={styles.pathologyItem}>
                                <Link href={`/pathologies/${p.slug}`}>
                                    <div className={styles.content}>
                                        <h2 className={styles.pathologyName}>
                                            {p.name}
                                        </h2>

                                        {p.description && (
                                            <p className={styles.pathologyDesc}>
                                                {p.description.length > 220
                                                    ? `${p.description.slice(0, 220)}…`
                                                    : p.description}
                                            </p>
                                        )}
                                    </div>

                                    <button className={styles.pathologyLink}>
                                        <i className="fas fa-arrow-right"></i>
                                    </button>
                                </Link>
                            </li>
                        ))}

                        {items.length === 0 && (
                            <li className={styles.pathologyItem}>
                                <p>Aucune pathologie dans cette catégorie.</p>
                            </li>
                        )}
                    </ul>
                </div>
            </main>
        </>
    );
}

/* SSG: on génère un path par sous-catégorie présente dans les données */
export async function getStaticPaths() {
    const all = getAllPathologies();
    const cats = new Map(); // slug -> label (sous-catégorie)

    for (const p of all) {
        const label = p.category || "Autres";
        const s = slugify(label);
        if (!cats.has(s)) cats.set(s, String(label));
    }

    return {
        paths: Array.from(cats.keys()).map((slug) => ({
            params: { singleCategory: slug },
        })),
        fallback: false,
    };
}

/* SSG: on filtre les pathologies par sous-catégorie (slug) */
export async function getStaticProps({ params }) {
    const all = getAllPathologies();

    const wantedSlug = params.singleCategory;
    let label = null;
    const items = [];

    for (const p of all) {
        const catLabel = p.category || "Autres";
        if (slugify(catLabel) === wantedSlug) {
            label = label || String(catLabel);
            items.push({
                slug: p.slug,
                name: p.name,
                description: p.description || "",
            });
        }
    }

    // tri alpha par nom de pathologie
    items.sort((a, b) => a.name.localeCompare(b.name));

    const category = label ? { label, slug: wantedSlug } : null;

    return {
        props: {
            category,
            pathologies: items,
        },
    };
}
