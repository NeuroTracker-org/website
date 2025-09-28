// components/SmartSearch.js
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import styles from "./SmartSearch.module.css";

/* Utils -------------------------------------------------------------------- */
function slugify(input) {
  return String(input || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s/g, "-")
    .replace(/-+/g, "-");
}
function norm(s) {
  return String(s || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
// version “squeezed” : tout collé, lettres/chiffres uniquement
function squeeze(s) {
  return norm(s).replace(/[^a-z0-9]+/g, "");
}
function tokenize(q) {
  return norm(q).split(/\s+/).filter(Boolean);
}
function highlightParts(text, query) {
  const q = norm(query).trim();
  if (!q) return [text];
  const parts = q.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return [text];
  const pattern = new RegExp(`(${parts.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "ig");
  const chunks = String(text).split(pattern);
  return chunks.map((chunk, i) =>
    pattern.test(chunk) ? <mark key={i} className={styles.hl}>{chunk}</mark> : <span key={i}>{chunk}</span>
  );
}

/* Indexation locale -------------------------------------------------------- */
async function buildIndex() {
  const [pRes, tRes] = await Promise.all([
    fetch("/api/pathologies"),
    fetch("/api/treatments"),
  ]).catch(() => [null, null]);

  const pathologies = pRes ? await pRes.json().catch(() => []) : [];
  const treatments  = tRes ? await tRes.json().catch(() => []) : [];

  const idx = [];

  // ===== Pathologies (fiches) =====
  if (Array.isArray(pathologies)) {
    for (const p of pathologies) {
      const title = p.name;
      const subtitle = p.category || p.superCategory || "";
      const tokens = norm([title, subtitle, p.description].filter(Boolean).join(" "));
      const squeezedTokens = squeeze([title, subtitle].filter(Boolean).join(" "));
      idx.push({
        type: "pathology",
        slug: p.slug,
        title,
        subtitle,
        tokens,
        squeezedTokens,
        weight: 4,
        href: `/pathologies/${p.slug}`,
      });
    }
  }

  // ===== Catégories de pathologies (sous-catégories) =====
  const pathoCatAgg = new Map(); // slug -> { title, count }
  for (const p of Array.isArray(pathologies) ? pathologies : []) {
    const label = p.category || "Autres";
    const s = slugify(label);
    const prev = pathoCatAgg.get(s) || { title: label, count: 0 };
    prev.count += 1;
    pathoCatAgg.set(s, prev);
  }
  for (const [pcSlug, v] of pathoCatAgg.entries()) {
    const title = v.title;
    idx.push({
      type: "pathologyCategory",
      slug: pcSlug,
      title,
      subtitle: `${v.count} pathologie(s)`,
      tokens: norm(title),
      squeezedTokens: squeeze(title),
      weight: 6,
      href: `/pathologies/category/${pcSlug}`,
    });
  }

  // ===== Traitements + marques + catégories de traitement =====
  const treatCatAgg = new Map(); // slug -> { title, count }
  if (Array.isArray(treatments)) {
    for (const t of treatments) {
      const title = t.molecule_name || t.slug;
      const subtitle = Array.isArray(t.categories) ? t.categories.join(" · ") : "";
      const tokens = norm([title, t.description_molecule, (t.categories||[]).join(" "), (t.brands||[]).join(" ")].join(" "));
      const squeezedTokens = squeeze([title, (t.categories||[]).join(" "), (t.brands||[]).join(" ")].join(" "));
      idx.push({
        type: "treatment",
        slug: t.slug,
        title,
        subtitle,
        tokens,
        squeezedTokens,
        weight: 5,
        href: `/traitements/${t.slug}`,
      });

      for (const b of t.brands || []) {
        const bTitle = b;
        idx.push({
          type: "brand",
          slug: slugify(b),
          title: bTitle,
          subtitle: `→ ${title}`,
          tokens: norm([bTitle, title].join(" ")),
          squeezedTokens: squeeze([bTitle, title].join(" ")),
          weight: 2,
          href: `/traitements/${t.slug}`,
        });
      }

      for (const c of t.categories || []) {
        const cSlug = slugify(c);
        const prev = treatCatAgg.get(cSlug) || { title: c, count: 0 };
        prev.count += 1;
        treatCatAgg.set(cSlug, prev);
      }
    }
  }
  for (const [cSlug, v] of treatCatAgg.entries()) {
    const title = v.title;
    idx.push({
      type: "category",
      slug: cSlug,
      title,
      subtitle: `${v.count} traitement(s)`,
      tokens: norm(title),
      squeezedTokens: squeeze(title),
      weight: 7, // ← un peu plus lourd pour qu’elles puissent passer devant quand ça matche fort
      href: `/traitements/category/${cSlug}`,
    });
  }

  return idx;
}

/* Scoring : tokens + “squeezed” + boosts exacts ---------------------------- */
function scoreItem(item, tokens, rawQuery) {
  if (tokens.length === 0) return 0;

  const txt = item.tokens || "";
  const sq  = item.squeezedTokens || "";
  const qn  = norm(rawQuery);
  const qs  = squeeze(rawQuery);

  let score = 0;

  for (const tk of tokens) {
    const pos = txt.indexOf(tk);
    const posSqueezed = sq.indexOf(tk.replace(/[^a-z0-9]+/g, "")); // token “resserré”

    // il faut que le token existe dans l'une des formes
    if (pos === -1 && posSqueezed === -1) return 0;

    // présence
    score += 1;

    // bonus si début de texte
    if (pos === 0 || posSqueezed === 0) score += 1;

    // bonus si début de titre
    if (item.title) {
      const tNorm = norm(item.title);
      const tSq = squeeze(item.title);
      if (tNorm.startsWith(tk) || tSq.startsWith(tk.replace(/[^a-z0-9]+/g, ""))) {
        score += 2;
      }
    }
  }

  // Bonus égalité stricte (normale) du titre
  if (norm(item.title || "") === qn) {
    // boost très fort pour pathoCat & cat de traitement
    if (item.type === "pathologyCategory" || item.type === "category") score += 1200;
    else score += 400;
  }

  // Bonus égalité stricte (squeezed) du titre
  if (squeeze(item.title || "") === qs) {
    if (item.type === "pathologyCategory" || item.type === "category") score += 1200;
    else score += 400;
  }

  // phrase match dans tokens (norm)
  if (qn && txt.includes(qn)) score += 8;

  // phrase match dans squeezedTokens (ex: “betabloquant” vs “bêta-bloquant”)
  if (qs && sq.includes(qs)) score += 12;

  score += item.weight || 0;
  return score;
}

/* Composant ---------------------------------------------------------------- */
export default function SmartSearch({
  placeholder = "Rechercher…",
  maxSuggestions = 12,
}) {
  const router = useRouter();
  const inputRef = useRef(null);

  const [q, setQ] = useState("");
  const [index, setIndex] = useState([]);
  const [openDrop, setOpenDrop] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [suggestsFlat, setSuggestsFlat] = useState([]);

  useEffect(() => {
    let mounted = true;
    buildIndex().then((idx) => { if (mounted) setIndex(idx); });
    return () => { mounted = false; };
  }, []);

  const suggests = useMemo(() => {
    const query = q.trim();
    if (!query) { setSuggestsFlat([]); return []; }
    const tokens = tokenize(query);
    const scored = index
      .map(it => ({ it, sc: scoreItem(it, tokens, query) }))
      .filter(({ sc }) => sc > 0)
      .sort((a, b) => b.sc - a.sc)
      .slice(0, maxSuggestions)
      .map(({ it }) => it);

    setSuggestsFlat(scored);

    // Ordre d’affichage : pathoCat → cat de traitement → pathologies → traitements → marques
    const groupsOrder = ["pathologyCategory", "category", "pathology", "treatment", "brand"];
    const grouped = groupsOrder.map(type => ({
      type,
      items: scored.filter(s => s.type === type),
    })).filter(g => g.items.length > 0);
    return grouped;
  }, [q, index, maxSuggestions]);

  const onSubmit = (e) => {
    e.preventDefault();
    if (!suggestsFlat.length) return;
    const sel = suggestsFlat[highlight] || suggestsFlat[0];
    if (sel?.href) {
      router.push(sel.href);
      setQ("");
      setOpenDrop(false);
    }
  };

  const onKeyDown = (e) => {
    if (!openDrop && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpenDrop(true);
      return;
    }
    if (!openDrop) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((prev) => (prev + 1) % Math.max(1, suggestsFlat.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((prev) => (prev - 1 + Math.max(1, suggestsFlat.length)) % Math.max(1, suggestsFlat.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const sel = suggestsFlat[highlight];
      if (sel?.href) {
        router.push(sel.href);
        setQ("");
        setOpenDrop(false);
      }
    } else if (e.key === "Escape") {
      setOpenDrop(false);
    }
  };

  return (
    <div className={styles.searchWrap}>
      <form className={styles.searchForm} onSubmit={onSubmit}>
        <input
          ref={inputRef}
          name="q"
          type="text"
          placeholder={placeholder}
          value={q}
          onChange={(e) => { setQ(e.target.value); if (e.target.value) setOpenDrop(true); }}
          onKeyDown={onKeyDown}
          onFocus={() => { if (suggestsFlat.length) setOpenDrop(true); }}
          onBlur={() => setTimeout(() => setOpenDrop(false), 120)}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={openDrop}
          aria-controls="smartsearch-suggests"
          role="combobox"
        />
        <button type="submit" aria-label="Rechercher">
          <i className="fas fa-search" />
        </button>
      </form>

      {openDrop && suggestsFlat.length > 0 && (
        <ul className={styles.suggestDropdown} id="smartsearch-suggests" role="listbox">
          {suggests.map((group) => (
            <li key={group.type} className={styles.groupBlock}>
              <div className={styles.groupTitle}>
                {group.type === "pathologyCategory" && <>Catégories de pathologies</>}
                {group.type === "category" && <>Catégories de traitement</>}
                {group.type === "pathology" && <>Pathologies</>}
                {group.type === "treatment" && <>Traitements</>}
                {group.type === "brand" && <>Marques</>}
              </div>

              <ul className={styles.groupList}>
                {group.items.map((s) => {
                  const flatIndex = suggestsFlat.findIndex(x => x === s);
                  const isActive = flatIndex === highlight;
                  return (
                    <li
                      key={`${s.type}:${s.slug}`}
                      className={`${styles.suggestItem} ${isActive ? styles.isActive : ""}`}
                      onMouseDown={(e) => { e.preventDefault(); s.href && router.push(s.href); setQ(""); setOpenDrop(false); }}
                      onMouseEnter={() => setHighlight(flatIndex)}
                      role="option"
                      aria-selected={isActive}
                    >
                      <div className={styles.suggestIcon}>
                        {s.type === "pathologyCategory" && <i className="far fa-sitemap" aria-hidden />}
                        {s.type === "category" && <i className="far fa-layer-group" aria-hidden />}
                        {s.type === "pathology" && <i className="far fa-head-side-brain" aria-hidden />}
                        {s.type === "treatment" && <i className="far fa-capsules" aria-hidden />}
                        {s.type === "brand" && <i className="far fa-tag" aria-hidden />}
                      </div>
                      <div className={styles.suggestMain}>
                        <div className={styles.suggestTitle}>
                          {highlightParts(s.title, q)}
                        </div>
                        {s.subtitle && (
                          <div className={styles.suggestSubtitle}>{s.subtitle}</div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
