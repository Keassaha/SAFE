import { Sidebar } from "@/components/shell/sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[230px_1fr] min-h-screen">
      <Sidebar />
      <main className="overflow-x-hidden">{children}</main>
    </div>
  );
}
