import { Button } from "@/components/ui/core";
import {
  ComplianceStrip,
  PriorityCard,
  TrustCard,
  KpiCard,
  Obligations,
} from "@/components/dashboard/sections";
import { getDashboardData } from "@/lib/data";

export default function DashboardPage() {
  const d = getDashboardData();

  return (
    <div className="px-9 pt-7 pb-9">
      <div className="flex items-end justify-between mb-6">
        <h1 className="font-serif text-[30px]">Bonjour, {d.user.name}</h1>
        <div className="font-mono text-[12.5px] text-muted text-right leading-relaxed">
          {d.today}
          <br />
          {d.syncedAt}
        </div>
      </div>

      <ComplianceStrip
        items={d.compliance}
        rightNote="Vérification continue activée"
      />

      <div className="grid grid-cols-[1.55fr_1fr] gap-5 mb-5">
        <PriorityCard priority={d.priority} upNext={d.upNext}>
          <div className="flex gap-[11px]">
            <Button variant="primary">{d.priority.primaryAction}</Button>
            <Button variant="ghost">{d.priority.secondaryAction}</Button>
          </div>
        </PriorityCard>

        <aside className="flex flex-col gap-5">
          <TrustCard
            badge={d.trust.badge}
            label={d.trust.label}
            amount={d.trust.amount}
            caption={d.trust.caption}
          />
          <KpiCard title="Le mois en cours" kpis={d.monthKpis} />
        </aside>
      </div>

      <Obligations items={d.obligations} />
    </div>
  );
}
