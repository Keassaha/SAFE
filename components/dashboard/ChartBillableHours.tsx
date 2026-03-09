"use client";

import { useTranslations } from "next-intl";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const COLORS = ["var(--safe-chart-primary)", "var(--safe-chart-secondary)", "var(--safe-gold-700)"];

export function ChartBillableHours({
  billedPercent,
  label,
}: {
  billedPercent: number;
  label?: string;
}) {
  const td = useTranslations("dashboard");
  const displayLabel = label ?? td("billableHoursLabel");
  const data = [
    { name: td("billedLabel"), value: Math.min(100, Math.max(0, billedPercent)) },
    { name: td("remainingLabel"), value: Math.min(100, Math.max(0, 100 - billedPercent)) },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center">
        <p className="safe-text-secondary text-sm">{td("noDataLabel")}</p>
      </div>
    );
  }

  return (
    <div className="h-40 w-full flex flex-col items-center">
      <div className="relative w-32 h-32">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={36}
              outerRadius={48}
              paddingAngle={0}
              dataKey="value"
              stroke="none"
            >
              {data.map((_, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index % COLORS.length]}
                  className="outline-none"
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold safe-text-metric">
            {Math.round(billedPercent)}%
          </span>
        </div>
      </div>
      {displayLabel ? (
        <p className="text-sm safe-text-secondary mt-2">{displayLabel}</p>
      ) : null}
    </div>
  );
}
