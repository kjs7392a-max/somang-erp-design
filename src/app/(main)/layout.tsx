import { MainShell } from "@/components/layout/MainShell";
import { AuthProvider } from "@/context/AuthContext";

export default function MainGroupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <MainShell>{children}</MainShell>
    </AuthProvider>
  );
}