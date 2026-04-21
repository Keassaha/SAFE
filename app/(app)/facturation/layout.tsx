"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";

interface FacturationLayoutProps {
  children: React.ReactNode;
}

export default function FacturationLayout({ children }: FacturationLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("facturation");
  const [mounted, setMounted] = useState(false);

  const getActiveTab = () => {
    if (pathname.includes("/honoraires")) return "honoraires";
    if (pathname.includes("/suivi")) return "suivi";
    if (pathname.includes("/paiements")) return "paiements";
    return "honoraires";
  };

  const [activeTab, setActiveTab] = useState(getActiveTab());

  useEffect(() => {
    setMounted(true);
    setActiveTab(getActiveTab());
  }, [pathname]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    router.push(`/facturation/${tab}`);
  };

  if (!mounted) return <>{children}</>;

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full">
          <TabsTrigger value="honoraires">
            {t("tabs.honoraires")}
          </TabsTrigger>
          <TabsTrigger value="suivi">
            {t("tabs.suivi")}
          </TabsTrigger>
          <TabsTrigger value="paiements">
            {t("tabs.paiements")}
          </TabsTrigger>
        </TabsList>
      </Tabs>
      {children}
    </div>
  );
}
