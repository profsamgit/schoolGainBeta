import { Header } from '@/components/layout/header';
import { AppSidebar } from '@/components/layout/sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppSidebar>
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
        <footer className="p-4 text-center text-xs text-muted-foreground border-t">
          TDS - CETI Frei Jose Apicella 2026
        </footer>
      </div>
    </AppSidebar>
  );
}
