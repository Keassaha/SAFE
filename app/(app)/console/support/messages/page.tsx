import Link from "next/link";
import { MessagesSquare } from "lucide-react";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SupportRealtime } from "@/components/console/SupportRealtime";

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("fr-CA", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(d);
}

export default async function ConsoleMessagesPage() {
  const conversations = await prisma.supportConversation.findMany({
    orderBy: [{ statut: "asc" }, { lastMessageAt: "desc" }],
    include: {
      cabinet: { select: { nom: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: {
        select: { messages: { where: { isFromSafeInc: false, readAt: null } } },
      },
    },
  });

  const nonLus = conversations.reduce((n, c) => n + c._count.messages, 0);

  return (
    <div className="space-y-6">
      <SupportRealtime />
      <PageHeader
        title="Messages"
        description={`${conversations.length} discussion${conversations.length > 1 ? "s" : ""} · ${nonLus} non lu${nonLus > 1 ? "s" : ""}`}
      />

      <div className="flex items-center gap-2 text-sm">
        <span className="rounded-md bg-si-forest/[0.06] px-3 py-1.5 font-medium text-si-forest">Messages</span>
        <Link href="/console/support" className="rounded-md px-3 py-1.5 text-si-muted hover:bg-si-canvas">
          Billets
        </Link>
      </div>

      {conversations.length === 0 ? (
        <EmptyState
          title="Aucune discussion"
          description="Les demandes des cabinets clients arrivent ici. Ouvrez un fil pour répondre, puis transformez-le en billet pour organiser le travail."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-si-line">
              {conversations.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/console/support/messages/${c.id}`}
                    className="flex items-center gap-3 px-5 py-4 hover:bg-si-canvas/60"
                  >
                    <MessagesSquare className="h-5 w-5 shrink-0 text-si-muted" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium text-si-ink">{c.sujet}</span>
                        {c.statut === "ARCHIVEE" && (
                          <span className="shrink-0 rounded border border-si-line bg-si-canvas px-1.5 py-0.5 text-[10px] text-si-muted">
                            Archivé
                          </span>
                        )}
                      </div>
                      <div className="truncate text-xs text-si-muted">
                        {c.cabinet?.nom ?? "—"} · {c.messages[0]?.contenu ?? ""}
                      </div>
                    </div>
                    {c._count.messages > 0 && (
                      <span className="shrink-0 rounded-full bg-si-verified px-2 py-0.5 text-[11px] font-medium text-si-surface">
                        {c._count.messages}
                      </span>
                    )}
                    <span className="shrink-0 text-xs text-si-muted">{formatDate(c.lastMessageAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
