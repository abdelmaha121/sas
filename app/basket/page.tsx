import Header from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BasketPageContent } from '@/components/basket/BasketPageContent';

export default function BasketPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <BasketPageContent />
      </main>
      <Footer />
    </div>
  );
}
