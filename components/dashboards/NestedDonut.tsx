"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import type { CategoryMix } from "@/lib/dashboard/unit-aset";

interface NestedDonutProps {
  mix: CategoryMix;
}

export function NestedDonut({ mix }: NestedDonutProps) {
  // Outer ring: condition × category (4 slices + optional Unknown)
  const outer = [
    {
      name: "Harta Modal · Rosak",
      value: mix.harta_modal_rosak,
      fill: "var(--dim-condition-rosak)",
    },
    {
      name: "Harta Modal · Usang",
      value: mix.harta_modal_usang,
      fill: "var(--dim-condition-usang)",
    },
    {
      name: "Aset Rendah · Rosak",
      value: mix.aset_rendah_rosak,
      fill: "var(--dim-condition-rosak)",
    },
    {
      name: "Aset Rendah · Usang",
      value: mix.aset_rendah_usang,
      fill: "var(--dim-condition-usang)",
    },
  ];
  if (mix.tidak_dinyatakan > 0) {
    outer.push({
      name: "Tidak Dinyatakan",
      value: mix.tidak_dinyatakan,
      fill: "var(--fg-muted)",
    });
  }
  // Inner ring: category totals
  const hartaModalTotal = mix.harta_modal_rosak + mix.harta_modal_usang;
  const asetRendahTotal = mix.aset_rendah_rosak + mix.aset_rendah_usang;
  const inner = [
    {
      name: "Harta Modal",
      value: hartaModalTotal,
      fill: "var(--dim-category-modal)",
    },
    {
      name: "Aset Rendah",
      value: asetRendahTotal,
      fill: "var(--dim-category-rendah)",
    },
  ];
  if (mix.tidak_dinyatakan > 0) {
    inner.push({
      name: "Tidak Dinyatakan",
      value: mix.tidak_dinyatakan,
      fill: "var(--fg-muted)",
    });
  }

  const total = outer.reduce((s, o) => s + o.value, 0);
  const empty = total === 0;

  return (
    <div className="h-56 w-full flex items-center gap-4">
      <div className="flex-1 h-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Pie
              data={inner}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={28}
              outerRadius={50}
              paddingAngle={1}
              isAnimationActive={false}
            >
              {inner.map((e, i) => (
                <Cell key={i} fill={e.fill} stroke="var(--surface)" strokeWidth={2} />
              ))}
            </Pie>
            <Pie
              data={outer}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={56}
              outerRadius={84}
              paddingAngle={1}
              isAnimationActive={false}
            >
              {outer.map((e, i) => (
                <Cell key={i} fill={e.fill} stroke="var(--surface)" strokeWidth={2} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {!empty && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-title-2 font-bold text-[var(--fg)] tabular-nums">{total}</span>
            <span className="text-caption text-[var(--fg-muted)]">jumlah</span>
          </div>
        )}
      </div>
      <ul className="flex flex-col gap-1.5 text-caption min-w-0">
        {inner.map((seg, i) => (
          <li key={i} className="flex items-center gap-2 min-w-0">
            <span
              className="inline-block w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ backgroundColor: seg.fill }}
              aria-hidden
            />
            <span className="text-[var(--fg-muted)] truncate">{seg.name}</span>
            <span className="ml-auto text-[var(--fg)] tabular-nums font-semibold">
              {seg.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
