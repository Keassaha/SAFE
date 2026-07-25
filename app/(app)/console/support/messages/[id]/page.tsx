import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText } from "lucide-react";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { ConversationThread } from "@/components/console/ConversationThread";

function formatDateTime(d: Date): string {
  return new Intl.DateTimeFormat("fr-CA", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(d);
}

function formatSize(b: number): string {
  return b < 1024 * 1024 ? `${Math.round(b / 1024)} Ko` : `${(b / 1024 / 1024).toFixed(1)} Mo`;
}

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const convo = await prisma.supportConversation.findUnique({
    where: { id },
    include: {
      cabinet: { select: { nom: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { nom: true } },
          pieces: { select: { id: true, nom: true, mimeType: true, sizeBytes: true } },
        },
      },
      tickets: {
        orderBy: { createdAt: "desc" },
        select: { id: true, titre: true, statut: true },
      },
    },
  });

  if (!convo) notFound();

  // Pré-remplissage du billet : sujet + messages du client concaténés.
  const suggestedTitre = convo.sujet;
  const suggestedDescription = convo.messages
    .filter((m) => !m.isFromSafeInc)
    .map((m) => m.contenu)
    .join("\n\n");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={convo.sujet}
        description={`${convo.cabinet?.nom ?? "—"} · ${convo.messages.length} message${convo.messages.length > 1 ? "s" : ""}`}
        backHref="/console/support/messages"
        backLabel="Tous les messages"
      />

      {/* Billets déjà dérivés de ce fil */}
      {convo.tickets.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-si-muted">Billets :</span>
          {convo.tickets.map((t) => (
            <Link
              key={t.id}
              href={`/console/support/${t.id}`}
              className="rounded border border-si-line bg-si-canvas px-2 py-0.5 text-xs text-si-ink hover:border-si-verified"
            >
              {t.titre} · {t.statut}
            </Link>
          ))}
        </div>
      )}

      {/* Fil de messages */}
      <Card>
        <CardContent className="space-y-3 px-6 py-5">
          {convo.messages.map((m) => (
            <div key={m.id} className={`flex ${m.isFromSafeInc ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-lg px-4 py-2.5 ${m.isFromSafeInc ? "bg-si-verified/[0.08] border border-si-verified/20" : "bg-si-canvas border border-si-line"}`}>
                <div className="mb-0.5 flex items-center gap-2">
                  <span className="text-xs font-medium text-si-ink">
                    {m.isFromSafeInc ? "SAFE Inc." : convo.cabinet?.nom ?? "Client"} · {m.author?.nom ?? ""}
                  </span>
                  <span className="text-[11px] text-si-muted">{formatDateTime(m.createdAt)}</span>
                </div>
                {m.contenu && <p className="whitespace-pre-wrap text-sm text-si-ink">{m.contenu}</p>}
                {m.pieces.length > 0 && (
                  <div className="mt-1.5 flex flex-col gap-1.5">
                    {m.pieces.map((p) =>
                      p.mimeType.startsWith("image/") ? (
                        <a key={p.id} href={`/api/support/attachments/${p.id}`} target="_blank" rel="noreferrer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={`/api/support/attachments/${p.id}`} alt={p.nom} className="max-h-48 rounded-md border border-si-line object-cover" />
                        </a>
                      ) : (
                        <a
                          key={p.id}
                          href={`/api/support/attachments/${p.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 rounded-md border border-si-line bg-si-surface px-2 py-1.5 text-xs text-si-ink hover:border-si-verified"
                        >
                          <FileText className="h-4 w-4 shrink-0 text-si-muted" />
                          <span className="truncate">{p.nom}</span>
                          <span className="ml-auto shrink-0 text-[10px] text-si-muted">{formatSize(p.sizeBytes)}</span>
                        </a>
                      ),
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <ConversationThread
        conversationId={convo.id}
        statut={convo.statut}
        suggestedTitre={suggestedTitre}
        suggestedDescription={suggestedDescription}
      />
    </div>
  );
}
