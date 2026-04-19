import AppBottomNav from "@/components/layout/AppBottomNav";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-full flex flex-col">
      <div className="flex-1">{children}</div>
      <AppBottomNav />
    </div>
  );
}
