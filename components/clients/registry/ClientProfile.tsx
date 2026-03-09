"use client";

import { useState } from "react";
import {
  ClientProfileTabs,
  DEFAULT_PROFILE_TABS,
  type ClientProfileTabId,
} from "./ClientProfileTabs";
import { ClientOverview } from "./ClientOverview";
import { ClientCases } from "./ClientCases";
import { ClientBilling } from "./ClientBilling";
import { ClientTrustAccount } from "./ClientTrustAccount";
import { ClientCompliance } from "./ClientCompliance";
import { ClientProfileAlerts } from "./ClientProfileAlerts";
import { type ActivityItem } from "./ClientHistoryTab";
import {
  ClientDossierFinancier,
  type TimeEntryFinancialRow,
  type InvoiceFinancialRow,
} from "./ClientDossierFinancier";

export type ClientProfileData = {
  id: string;
  typeClient: string;
  status: string;
  raisonSociale: string;
  prenom: string | null;
  nom: string | null;
  email: string | null;
  telephone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  country: string | null;
  langue: string | null;
  createdAt: Date;
  notesConfidentielles: string | null;
  trustAccountBalance: number;
  trustAccountId: string | null;
  allowTrustPayments: boolean;
  lastTrustTransactionDate: Date | null;
  conflictChecked: boolean;
  conflictCheckDate: Date | null;
  conflictNotes: string | null;
  identityVerified: boolean;
  verificationDate: Date | null;
  retainerSigned: boolean;
  documentRefs: string | null;
  overdueInvoicesCount: number;
  verificationIdentiteHref: string;
  cases: Array<{
    id: string;
    reference: string | null;
    numeroDossier: string | null;
    intitule: string;
    statut: string;
    type: string | null;
  }>;
  totalBilled?: number;
  totalReceived?: number;
  balanceDue?: number;
  invoiceCount?: number;
  paymentCount?: number;
  transactions?: Array<{ date: Date; label: string; amount: number }>;
  activityItems?: ActivityItem[];
  /** Carte client : temps effectué, factures (pour l’onglet Carte client) */
  timeEntriesFinancial?: TimeEntryFinancialRow[];
  invoicesFinancial?: InvoiceFinancialRow[];
};

interface ClientProfileProps {
  data: ClientProfileData;
  canEditBilling: boolean;
}

export function ClientProfile({
  data,
  canEditBilling,
}: ClientProfileProps) {
  const [activeTab, setActiveTab] = useState<ClientProfileTabId>("overview");

  const tabs = DEFAULT_PROFILE_TABS.map((t) =>
    t.id === "cases"
      ? { ...t, count: data.cases.length }
      : t.id === "financier"
        ? {
            ...t,
            count:
              (data.timeEntriesFinancial?.length ?? 0) +
              (data.invoicesFinancial?.length ?? 0),
          }
        : t
  );

  const overviewData = {
    typeClient: data.typeClient,
    primary_email: data.email,
    phone_primary: data.telephone,
    address_line_1: data.addressLine1,
    address_line_2: data.addressLine2,
    city: data.city,
    province: data.province,
    postalCode: data.postalCode,
    country: data.country,
    langue: data.langue,
    createdAt: data.createdAt,
    notesConfidentielles: data.notesConfidentielles,
  };

  return (
    <div className="space-y-6">
      <ClientProfileTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === "overview" && (
        <div className="space-y-6">
          <ClientProfileAlerts
            retainerSigned={data.retainerSigned}
            conflictChecked={data.conflictChecked}
            identityVerified={data.identityVerified}
            overdueInvoicesCount={data.overdueInvoicesCount}
            verificationIdentiteHref={data.verificationIdentiteHref}
          />
          <ClientBilling
            totalBilled={data.totalBilled ?? 0}
            totalReceived={data.totalReceived ?? 0}
            balanceDue={data.balanceDue ?? 0}
            invoiceCount={data.invoiceCount}
            paymentCount={data.paymentCount}
            transactions={data.transactions}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ClientOverview data={overviewData} />
            <div className="space-y-4">
              <ClientTrustAccount
                clientId={data.id}
                balance={data.trustAccountBalance}
                trustAccountId={data.trustAccountId}
                allowTrustPayments={data.allowTrustPayments}
                lastTransactionDate={data.lastTrustTransactionDate}
              />
              <ClientCompliance
                conflictChecked={data.conflictChecked}
                conflictCheckDate={data.conflictCheckDate}
                conflictNotes={data.conflictNotes}
                identityVerified={data.identityVerified}
                verificationDate={data.verificationDate}
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === "cases" && (
        <ClientCases cases={data.cases} clientId={data.id} />
      )}

      {activeTab === "financier" && (
        <ClientDossierFinancier
          totalBilled={data.totalBilled ?? 0}
          totalReceived={data.totalReceived ?? 0}
          balanceDue={data.balanceDue ?? 0}
          invoiceCount={data.invoiceCount ?? 0}
          paymentCount={data.paymentCount ?? 0}
          timeEntries={data.timeEntriesFinancial ?? []}
          invoices={data.invoicesFinancial ?? []}
          transactions={data.transactions ?? []}
        />
      )}
    </div>
  );
}
