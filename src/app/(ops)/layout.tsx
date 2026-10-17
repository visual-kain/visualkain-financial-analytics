import { AppShell } from '@/components/layout/AppShell';
import { OpsDataProvider } from '@/context/OpsDataContext';

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  return (
    <OpsDataProvider>
      <AppShell>{children}</AppShell>
    </OpsDataProvider>
  );
}
