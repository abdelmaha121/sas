'use client';

import Link from 'next/link';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';
import { useLanguage } from '@/lib/contexts/LanguageContext';

export function Footer() {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const t = {
    platformName: isAr ? 'منصة الخدمات' : 'Services Platform',
    description: isAr
      ? 'منصة رائدة لربط العملاء بمقدمي الخدمات المعتمدين. نوفر لك خدمات موثوقة وعالية الجودة في جميع المجالات.'
      : 'A leading platform connecting customers with trusted service providers. We deliver reliable, high-quality services across all fields.',

    quickLinks: isAr ? 'روابط سريعة' : 'Quick Links',
    about: isAr ? 'من نحن' : 'About Us',
    services: isAr ? 'الخدمات' : 'Services',
    providers: isAr ? 'مقدمو الخدمات' : 'Providers',
    howItWorks: isAr ? 'كيف تعمل' : 'How It Works',
    becomeProvider: isAr ? 'انضم كمزود خدمة' : 'Become a Provider',
    careers: isAr ? 'الوظائف' : 'Careers',

    support: isAr ? 'الدعم والمساعدة' : 'Support',
    help: isAr ? 'مركز المساعدة' : 'Help Center',
    faq: isAr ? 'الأسئلة الشائعة' : 'FAQ',
    contact: isAr ? 'تواصل معنا' : 'Contact Us',
    terms: isAr ? 'الشروط والأحكام' : 'Terms & Conditions',
    privacy: isAr ? 'سياسة الخصوصية' : 'Privacy Policy',
    refund: isAr ? 'سياسة الاسترجاع' : 'Refund Policy',

    reachUs: isAr ? 'تواصل معنا' : 'Get in Touch',
    address: isAr
      ? 'طريق 23 يونيو - صلالة - محافظة ظفار\nسلطنة عمان'
      : '23 June Street - Salalah - Dhofar Governorate\nSultanate of Oman',

    newsletter: isAr ? 'اشترك في النشرة البريدية' : 'Subscribe to Newsletter',
    emailPlaceholder: isAr ? 'بريدك الإلكتروني' : 'Your email address',
    subscribe: isAr ? 'اشترك' : 'Subscribe',

    rights: isAr
      ? 'جميع الحقوق محفوظة بواسطة الجمري.'
      : 'All rights reserved by Al-Jamri.',

    cookies: isAr ? 'سياسة الكوكيز' : 'Cookies Policy',
  };

  return (
    <footer
      className="bg-card border-t border-border mt-auto"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary">
                <span className="text-2xl font-bold text-white">خد</span>
              </div>
              <span className="text-lg font-bold">{t.platformName}</span>
            </div>

            <p className="text-muted-foreground text-sm mb-4">
              {t.description}
            </p>

            <div className="flex gap-3">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                <Link
                  key={i}
                  href="#"
                  className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Icon className="h-5 w-5" />
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">{t.quickLinks}</h3>
            <ul className="space-y-3">
              <li><Link href="/about" className="footer-link">{t.about}</Link></li>
              <li><Link href="/services" className="footer-link">{t.services}</Link></li>
              <li><Link href="/providers" className="footer-link">{t.providers}</Link></li>
              <li><Link href="/how-it-works" className="footer-link">{t.howItWorks}</Link></li>
              <li><Link href="/become-provider" className="footer-link">{t.becomeProvider}</Link></li>
              <li><Link href="/careers" className="footer-link">{t.careers}</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-lg mb-4">{t.support}</h3>
            <ul className="space-y-3">
              <li><Link href="/help" className="footer-link">{t.help}</Link></li>
              <li><Link href="/faq" className="footer-link">{t.faq}</Link></li>
              <li><Link href="/contact" className="footer-link">{t.contact}</Link></li>
              <li><Link href="/terms" className="footer-link">{t.terms}</Link></li>
              <li><Link href="/privacy" className="footer-link">{t.privacy}</Link></li>
              <li><Link href="/refund" className="footer-link">{t.refund}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-lg mb-4">{t.reachUs}</h3>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="text-muted-foreground whitespace-pre-line">
                  {t.address}
                </span>
              </li>

              <li className="flex gap-3">
                <Phone className="h-5 w-5 text-primary" />
                <a href="tel:+96897238047" className="footer-link">
                  +968 9723 8047
                </a>
              </li>

              <li className="flex gap-3">
                <Mail className="h-5 w-5 text-primary" />
                <a href="mailto:info@services.om" className="footer-link">
                  info@services.om
                </a>
              </li>
            </ul>

            <div className="mt-6">
              <h4 className="font-medium mb-2">{t.newsletter}</h4>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder={t.emailPlaceholder}
                  className="flex-1 px-4 py-2 rounded-xl border border-input bg-background text-sm"
                />
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium">
                  {t.subscribe}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} {t.platformName}. {t.rights}
          </p>

          <div className="flex gap-6 text-sm">
            <Link href="/terms" className="footer-link">{t.terms}</Link>
            <Link href="/privacy" className="footer-link">{t.privacy}</Link>
            <Link href="/cookies" className="footer-link">{t.cookies}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
