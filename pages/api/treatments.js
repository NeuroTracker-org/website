import {
  getAllTreatments,
  getTreatmentBySlug,
  getTreatmentsByPathologySlug,
  searchTreatmentsByKeyword,
} from "@/lib/pathologyData";

export default function handler(req, res) {
  const { slug, pathology, search } = req.query;

  if (slug) {
    const data = getTreatmentBySlug(slug);
    if (!data) return res.status(404).json({ error: "Traitement non trouvé." });
    return res.status(200).json(data);
  }

  if (pathology) {
    const data = getTreatmentsByPathologySlug(pathology);
    if (!data) return res.status(404).json({ error: "Pathologie non trouvée." });
    return res.status(200).json(data);
  }

  if (search) {
    const results = searchTreatmentsByKeyword(search);
    return res.status(200).json(results);
  }

  const all = getAllTreatments();
  return res.status(200).json(all);
}
