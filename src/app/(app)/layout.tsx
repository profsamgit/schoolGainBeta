import { Header } from '@/components/layout/header';
import { AppSidebar } from '@/components/layout/sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppSidebar>
      <div className="flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
      </div>
    </AppSidebar>
  );
}
