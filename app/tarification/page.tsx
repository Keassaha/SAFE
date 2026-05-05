import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { TarificationContent } from "@/components/tarification/TarificationContent";

export default function TarificationPage() {
  return (
    <div
      className="flex flex-col min-h-screen font-sans text-text-body antialiased"
      style={{ background: "var(--dashboard-bg-base, var(--safe-neutral-page, #F7F2E8))" }}
    >
      <Navbar />
      <main className="flex-1 mt-[80px]">
        <TarificationContent />
      </main>
      <Footer />
    </div>
  );
}
