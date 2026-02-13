import Header from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ServiceDetailsContent } from '@/components/services/ServiceDetailsContent';

export default async function ServiceDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <ServiceDetailsContent serviceId={id} />
      </main>
      <Footer />
    </div>
  );
}
