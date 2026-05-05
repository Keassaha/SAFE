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
 * Quand `getNextInvoiceNumero` est appelé avec un client de transaction,
 * il doit acquérir un advisory lock Postgres pour sérialiser les générations
 * de numéro concurrentes sur le même cabinet/année. Combiné avec la
 * contrainte unique `@@unique([cabinetId, numero])`, cela élimine la
 * possibilité d'avoir deux factures avec le même numéro.
 */

// Hoisted pour que le mock vi.mock puisse les référencer (vi.mock est hoisté
// au top du fichier — toute variable utilisée dans la factory doit l'être aussi).
const { log, txClient, prismaMock } = vi.hoisted(() => {
  const logRef = {
    executeRawCalls: [] as Array<{ raw: string; args: unknown[] }>,
    countCalls: 0,
  };
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
      invoice: {
        count: vi.fn(async () => {
          logRef.countCalls += 1;
          return 0;
        }),
      },
    },
    prismaMock: {
      invoice: {
        count: vi.fn(async () => {
          logRef.countCalls += 1;
          return 0;
        }),
      },
    },
  };
});

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

beforeEach(() => {
  log.executeRawCalls.length = 0;
  log.countCalls = 0;
  txClient.$executeRaw.mockClear();
  txClient.invoice.count.mockClear();
  prismaMock.invoice.count.mockClear();
});

describe("getNextInvoiceNumero — anti-collision", () => {
  it("acquiert un advisory lock quand un client de transaction est fourni", async () => {
    const { getNextInvoiceNumero } = await import("@/lib/facturation/numero-facture");

    const numero = await getNextInvoiceNumero("cab1", txClient as unknown as Parameters<typeof getNextInvoiceNumero>[1]);

    expect(numero).toMatch(/^\d{4}-\d{3}$/);
    expect(txClient.$executeRaw).toHaveBeenCalledTimes(1);

    const sqlText = log.executeRawCalls[0]!.raw;
    expect(sqlText).toContain("pg_advisory_xact_lock");

    // Argument interpolé : la clé contient "invoice-numero", le cabinetId et l'année
    const interpolated = log.executeRawCalls[0]!.args.map(String).join(" ");
    expect(interpolated).toContain("invoice-numero:cab1:");
    expect(interpolated).toMatch(/cab1:\d{4}/);
  });

  it("le compte est fait via le client de transaction (sous le verrou)", async () => {
    const { getNextInvoiceNumero } = await import("@/lib/facturation/numero-facture");

    await getNextInvoiceNumero("cab1", txClient as unknown as Parameters<typeof getNextInvoiceNumero>[1]);

    expect(txClient.invoice.count).toHaveBeenCalledTimes(1);
    expect(prismaMock.invoice.count).not.toHaveBeenCalled();
  });

  it("le lock est acquis AVANT le count", async () => {
    let lockOrder = 0;
    let countOrder = 0;
    let counter = 0;
    txClient.$executeRaw.mockImplementationOnce(async () => {
      lockOrder = ++counter;
      return 1;
    });
    txClient.invoice.count.mockImplementationOnce(async () => {
      countOrder = ++counter;
      return 0;
    });

    const { getNextInvoiceNumero } = await import("@/lib/facturation/numero-facture");
    await getNextInvoiceNumero("cab1", txClient as unknown as Parameters<typeof getNextInvoiceNumero>[1]);

    expect(lockOrder).toBeGreaterThan(0);
    expect(countOrder).toBeGreaterThan(0);
    expect(lockOrder).toBeLessThan(countOrder);
  });

  it("sans client de transaction (mode legacy), n'acquiert pas de lock", async () => {
    const { getNextInvoiceNumero } = await import("@/lib/facturation/numero-facture");

    await getNextInvoiceNumero("cab1");

    expect(txClient.$executeRaw).not.toHaveBeenCalled();
    expect(prismaMock.invoice.count).toHaveBeenCalledTimes(1);
  });

  it("retourne un numéro au format ANNEE-XXX cohérent avec count + 1", async () => {
    txClient.invoice.count.mockResolvedValueOnce(7);

    const { getNextInvoiceNumero } = await import("@/lib/facturation/numero-facture");
    const numero = await getNextInvoiceNumero("cab1", txClient as unknown as Parameters<typeof getNextInvoiceNumero>[1]);

    expect(numero).toMatch(/^\d{4}-008$/); // count=7 → sequence=8
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
