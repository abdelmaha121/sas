import Header from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ServicesPageContent } from '@/components/services/ServicesPageContent';

export default function ServicesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <ServicesPageContent />
      </main>
      <Footer />
    </div>
  );
}
