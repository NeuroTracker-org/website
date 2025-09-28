import { getAllPathologies } from "@/lib/pathologyData";

export default function handler(req, res) {
  try {
    const pathologies = getAllPathologies();
    res.status(200).json(pathologies);
  } catch (err) {
    console.error(">>> API /api/pathologies failed:", err);
    res.status(500).json({ error: "Erreur interne API pathologies" });
  }
}
