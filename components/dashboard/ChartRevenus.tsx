"use client";

import { useTranslations } from "next-intl";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const COLORS = ["#1D473B", "#3D665F", "#5A8A7E"];

export function ChartRevenus({
  data,
}: {
  data: { month: string; value: number }[];
}) {
  const t = useTranslations("dashboard");

  if (data.length === 0) {
    return (
      <p className="text-neutral-muted text-sm py-8 text-center">
        {t("noEncashmentData")}
      </p>
    );
  }

  const formatted = data.map((d) => ({
    ...d,
    label: d.month.replace(/-/, " / "),
    display: new Intl.NumberFormat("fr-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 0,
    }).format(d.value),
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={formatted} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11 }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) =>
              new Intl.NumberFormat("fr-CA", {
                style: "currency",
                currency: "CAD",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(v)
            }
            tick={{ fontSize: 11 }}
            tickLine={false}
          />
          <Tooltip
            formatter={(value: number) => [
              new Intl.NumberFormat("fr-CA", {
                style: "currency",
                currency: "CAD",
              }).format(value),
              t("encashments"),
            ]}
            labelFormatter={(_, payload) =>
              payload[0]?.payload?.label ?? ""
            }
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {formatted.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
