export const SEGMENTS = [
  { name: "Champion",      min: 80, color: "#2E7D32" },
  { name: "Actif engagé",  min: 60, color: "#66BB6A" },
  { name: "Modéré",        min: 40, color: "#FFA726" },
  { name: "À risque",      min: 20, color: "#EF6C00" },
  { name: "Dormant",       min: 0,  color: "#C62828" },
];

export function segmentOf(score) {
  const s = Number.isFinite(score) && score >= 0 ? score : 0;
  return SEGMENTS.find((seg) => s >= seg.min) ?? SEGMENTS[SEGMENTS.length - 1];
}

export function applySegmentation(scored) {
  return scored.map((row) => {
    const seg = segmentOf(row.Score_Calculé);
    return { ...row, Segment: seg.name, Couleur_Segment: seg.color };
  });
}

export function computeStats(segmented) {
  const total = segmented.length;
  const byName = new Map(SEGMENTS.map((s) => [s.name, { nb: 0, ca_total: 0, sum_score: 0 }]));

  for (const row of segmented) {
    const bucket = byName.get(row.Segment);
    if (!bucket) continue;
    bucket.nb += 1;
    bucket.ca_total += Number(row.CA_Estimé_MDH ?? 0);
    bucket.sum_score += Number(row.Score_Calculé ?? 0);
  }

  const segments = {};
  for (const seg of SEGMENTS) {
    const b = byName.get(seg.name);
    segments[seg.name] = {
      nb: b.nb,
      pct: total > 0 ? Math.round((b.nb / total) * 100) : 0,
      ca_total_mdh: Math.round(b.ca_total * 10) / 10,
      score_moyen: b.nb > 0 ? Math.round(b.sum_score / b.nb) : 0,
      couleur: seg.color,
    };
  }

  return { total, segments };
}
