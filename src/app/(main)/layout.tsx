import { AuthProvider } from "@/context/AuthContext";
import { LangBridge } from "@/context/LangContext";
import { MainShell } from "@/components/layout/MainShell";

export const dynamic = "force-dynamic";

export default function MainGroupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <LangBridge>
        <MainShell>{children}</MainShell>
      </LangBridge>
    </AuthProvider>
  );
}
