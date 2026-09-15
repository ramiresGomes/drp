"use client";

import { useState } from "react";
import { COMPETENCY_LABELS } from "@/lib/labels";

export function CompetencyFields({ defaults = [] }: { defaults?: string[] }) {
  const [selected, setSelected] = useState<string[]>(defaults);

  function toggle(value: string) {
    setSelected((current) => {
      if (current.includes(value)) return current.filter((item) => item !== value);
      if (value === "MUSICO") return [...current.filter((item) => item !== "CANTOR"), value];
      if (value === "CANTOR") return [...current.filter((item) => item !== "MUSICO"), value];
      return [...current, value];
    });
  }

  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-medium">Competências</legend>
      <p className="text-xs text-muted-foreground">Músico e cantor são exclusivos entre si.</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {Object.entries(COMPETENCY_LABELS).map(([value, label]) => (
          <label key={value} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="competencies"
              value={value}
              checked={selected.includes(value)}
              onChange={() => toggle(value)}
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
