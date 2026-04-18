import { cn } from "@/lib/utils/cn";

interface AppHeaderProps {
  title: string;
  right?: React.ReactNode;
  className?: string;
}

export default function AppHeader({ title, right, className }: AppHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex items-center justify-between h-14 px-4 bg-white border-b border-gray-200",
        className
      )}
    >
      <h1 className="text-base font-semibold text-gray-900">{title}</h1>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </header>
  );
}
