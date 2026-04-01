import { AcsSidebar } from "@/components/layout/AcsSidebar";

export default function AcsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <AcsSidebar />
      <main
        className="flex-1 overflow-auto"
        style={{ marginLeft: "var(--sidebar-width)" }}
      >
        {children}
      </main>
    </div>
  );
}
