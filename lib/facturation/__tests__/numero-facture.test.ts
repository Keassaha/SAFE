import { beforeEach, describe, it, expect, vi } from "vitest";
import { formatInvoiceNumero } from "../numero-facture";

describe("formatInvoiceNumero — format inchangé", () => {
  it("formate année et séquence en ANNEE-XXX", () => {
    expect(formatInvoiceNumero(2025, 1)).toBe("2025-001");
    expect(formatInvoiceNumero(2025, 42)).toBe("2025-042");
    expect(formatInvoiceNumero(2025, 999)).toBe("2025-999");
  });

  it("pad avec des zéros pour les petites séquences", () => {
    expect(formatInvoiceNumero(2024, 1)).toBe("2024-001");
    expect(formatInvoiceNumero(2030, 10)).toBe("2030-010");
  });
});

/**
 * `getNextIssuedInvoiceNumero` attribue le numéro OFFICIEL à l'émission, basé
 * sur `max(séquence) + 1` parmi les factures déjà numérotées du cabinet/année.
 * Appelé avec un client de transaction, il acquiert un advisory lock Postgres
 * pour sérialiser les émissions concurrentes. Combiné à `@@unique([cabinetId,
 * numero])`, cela élimine collisions ET trous dans la séquence émise.
 */

// Hoisted pour que le mock vi.mock puisse les référencer (vi.mock est hoisté
// au top du fichier — toute variable utilisée dans la factory doit l'être aussi).
const { log, txClient, prismaMock } = vi.hoisted(() => {
  const logRef = {
    executeRawCalls: [] as Array<{ raw: string; args: unknown[] }>,
    findManyCalls: 0,
  };
  const makeFindMany = () =>
    vi.fn(async () => {
      logRef.findManyCalls += 1;
      return [] as Array<{ numero: string }>;
    });
  return {
    log: logRef,
    txClient: {
      $executeRaw: vi.fn(async (...args: unknown[]) => {
        const first = args[0];
        const strings = Array.isArray(first)
          ? (first as string[])
          : ((first as { strings?: string[] })?.strings ?? []);
        logRef.executeRawCalls.push({ raw: strings.join("?"), args: args.slice(1) });
        return 1;
      }),
      invoice: { findMany: makeFindMany() },
    },
    prismaMock: {
      invoice: { findMany: makeFindMany() },
    },
  };
});

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

beforeEach(() => {
  log.executeRawCalls.length = 0;
  log.findManyCalls = 0;
  txClient.$executeRaw.mockClear();
  txClient.invoice.findMany.mockClear();
  prismaMock.invoice.findMany.mockClear();
});

describe("getNextIssuedInvoiceNumero — séquence émise sans trou", () => {
  it("acquiert un advisory lock quand un client de transaction est fourni", async () => {
    const { getNextIssuedInvoiceNumero } = await import("@/lib/facturation/numero-facture");

    const numero = await getNextIssuedInvoiceNumero("cab1", txClient as unknown as Parameters<typeof getNextIssuedInvoiceNumero>[1]);

    expect(numero).toMatch(/^\d{4}-\d{3}$/);
    expect(txClient.$executeRaw).toHaveBeenCalledTimes(1);

    const sqlText = log.executeRawCalls[0]!.raw;
    expect(sqlText).toContain("pg_advisory_xact_lock");

    const interpolated = log.executeRawCalls[0]!.args.map(String).join(" ");
    expect(interpolated).toContain("invoice-numero:cab1:");
    expect(interpolated).toMatch(/cab1:\d{4}/);
  });

  it("la lecture des numéros existants se fait via le client de transaction (sous le verrou)", async () => {
    const { getNextIssuedInvoiceNumero } = await import("@/lib/facturation/numero-facture");

    await getNextIssuedInvoiceNumero("cab1", txClient as unknown as Parameters<typeof getNextIssuedInvoiceNumero>[1]);

    expect(txClient.invoice.findMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.invoice.findMany).not.toHaveBeenCalled();
  });

  it("le lock est acquis AVANT la lecture", async () => {
    let lockOrder = 0;
    let readOrder = 0;
    let counter = 0;
    txClient.$executeRaw.mockImplementationOnce(async () => {
      lockOrder = ++counter;
      return 1;
    });
    txClient.invoice.findMany.mockImplementationOnce(async () => {
      readOrder = ++counter;
      return [];
    });

    const { getNextIssuedInvoiceNumero } = await import("@/lib/facturation/numero-facture");
    await getNextIssuedInvoiceNumero("cab1", txClient as unknown as Parameters<typeof getNextIssuedInvoiceNumero>[1]);

    expect(lockOrder).toBeGreaterThan(0);
    expect(readOrder).toBeGreaterThan(0);
    expect(lockOrder).toBeLessThan(readOrder);
  });

  it("sans client de transaction (aperçu), n'acquiert pas de lock", async () => {
    const { getNextIssuedInvoiceNumero } = await import("@/lib/facturation/numero-facture");

    await getNextIssuedInvoiceNumero("cab1");

    expect(txClient.$executeRaw).not.toHaveBeenCalled();
    expect(prismaMock.invoice.findMany).toHaveBeenCalledTimes(1);
  });

  it("retourne max(séquence) + 1 (sans trou, tolère les trous existants)", async () => {
    const yr = new Date().getFullYear();
    txClient.invoice.findMany.mockResolvedValueOnce([
      { numero: `${yr}-007` },
      { numero: `${yr}-003` },
    ]);

    const { getNextIssuedInvoiceNumero } = await import("@/lib/facturation/numero-facture");
    const numero = await getNextIssuedInvoiceNumero("cab1", txClient as unknown as Parameters<typeof getNextIssuedInvoiceNumero>[1]);

    expect(numero).toBe(`${yr}-008`); // max=7 → 8
  });

  it("première facture de l'année → séquence 1", async () => {
    const yr = new Date().getFullYear();
    txClient.invoice.findMany.mockResolvedValueOnce([]);

    const { getNextIssuedInvoiceNumero } = await import("@/lib/facturation/numero-facture");
    const numero = await getNextIssuedInvoiceNumero("cab1", txClient as unknown as Parameters<typeof getNextIssuedInvoiceNumero>[1]);

    expect(numero).toBe(`${yr}-001`);
  });
});

/**
 * Filet de sécurité au niveau schéma : la contrainte unique
 * `@@unique([cabinetId, numero])` doit être présente sur le model Invoice.
 * Si quelqu'un retire cette ligne, ce test l'attrape — la collision de
 * numéros redeviendrait possible sous concurrence.
 */
describe("schema Invoice — contrainte unique cabinetId+numero", () => {
  it("le model Invoice expose @@unique([cabinetId, numero])", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const schemaPath = path.resolve(process.cwd(), "prisma/schema.prisma");
    const schema = await fs.readFile(schemaPath, "utf8");

    // Extraire le bloc model Invoice {...}
    const match = schema.match(/model Invoice \{[\s\S]*?\n\}/);
    expect(match).not.toBeNull();
    const block = match![0];

    expect(block).toMatch(/@@unique\(\[cabinetId, numero\]\)/);
  });

  it("la migration SQL crée bien l'index unique", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const migrationPath = path.resolve(
      process.cwd(),
      "prisma/migrations/20260505120000_add_invoice_unique_cabinet_numero/migration.sql",
    );
    const sql = await fs.readFile(migrationPath, "utf8");
    expect(sql).toMatch(/CREATE UNIQUE INDEX/);
    expect(sql).toContain('"Invoice"');
    expect(sql).toContain('"cabinetId"');
    expect(sql).toContain('"numero"');
  });
});
