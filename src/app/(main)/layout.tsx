import { MainShell } from "@/components/layout/MainShell";

export default function MainGroupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <MainShell>{children}</MainShell>;
}