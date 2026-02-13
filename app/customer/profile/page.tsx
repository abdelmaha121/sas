'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { api } from '@/lib/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Calendar, Wallet, Bell, LogOut, Save, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Textarea } from '@/components/ui/textarea';
import Header from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function CustomerProfilePage() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();
  const { language } = useLanguage();

  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [bookingsCount, setBookingsCount] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletCurrency, setWalletCurrency] = useState('SAR');

  useEffect(() => {
    if (user) {
      setProfile({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
      });
    }
  }, [user]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      try {
        setNotificationsLoading(true);
        const response = await api.get('/notifications') as any;
        setNotifications(response.data.notifications);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        setNotificationsLoading(false);
      }
    };
    fetchNotifications();
  }, [user]);

  useEffect(() => {
    const fetchBookingsCount = async () => {
      if (!user) return;
      try {
        const response = await api.get('/bookings?limit=1') as any;
        setBookingsCount(response.data.pagination.total);
      } catch (error) {
        console.error('Failed to fetch bookings count:', error);
      }
    };
    fetchBookingsCount();
  }, [user]);

  useEffect(() => {
    const fetchWalletBalance = async () => {
      if (!user) return;
      try {
        const response = await api.get('/wallet') as any;
        setWalletBalance(response.data.wallet.balance);
        setWalletCurrency(response.data.wallet.currency);
      } catch (error) {
        console.error('Failed to fetch wallet balance:', error);
      }
    };
    fetchWalletBalance();
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!profile.firstName.trim()) {
      setMessage(language === 'ar' ? 'الاسم الأول مطلوب' : 'First name is required');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      await api.put('/customer/profile', {
        firstName: profile.firstName.trim(),
        lastName: profile.lastName.trim(),
        phone: profile.phone.trim(),
        address: profile.address.trim(),
      });

      setMessage(language === 'ar' ? 'تم تحديث الملف الشخصي بنجاح' : 'Profile updated successfully');
      await refreshUser();
    } catch (error: any) {
      setMessage(error.response?.data?.error || error.message || (language === 'ar' ? 'فشل التحديث' : 'Update failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">
            {language === 'ar' ? 'الرجاء تسجيل الدخول' : 'Please login'}
          </p>
          <Button onClick={() => router.push('/auth/login')}>
            {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
     <Header />

      <div className="container mx-auto max-w-4xl p-4">
        <h1 className="text-3xl font-bold mb-6">
          {language === 'ar' ? 'الملف الشخصي' : 'My Profile'}
        </h1>

        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal">
              <User className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'شخصي' : 'Personal'}
            </TabsTrigger>
            <TabsTrigger value="bookings">
              <Calendar className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'حجوزاتي' : 'My Bookings'}
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'إشعارات' : 'Notifications'}
            </TabsTrigger>
          </TabsList>

          {/* Personal Information */}
          <TabsContent value="personal">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">
                {language === 'ar' ? 'المعلومات الشخصية' : 'Personal Information'}
              </h2>

              {message && (
                <div className="mb-4 p-3 bg-green-100 text-green-800 rounded">
                  {message}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ar' ? 'الاسم الأول' : 'First Name'}
                    </label>
                    <Input
                      value={profile.firstName}
                      onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ar' ? 'اسم العائلة' : 'Last Name'}
                    </label>
                    <Input
                      value={profile.lastName}
                      onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                  </label>
                  <Input
                    type="email"
                    value={profile.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === 'ar' ? 'لا يمكن تغيير البريد الإلكتروني' : 'Email cannot be changed'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                  </label>
                  <Input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'العنوان' : 'Address'}
                  </label>
                  <Textarea
                    value={profile.address}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setProfile({ ...profile, address: e.target.value })}
                    placeholder={language === 'ar' ? 'أدخل عنوانك' : 'Enter your address'}
                    rows={3}
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  {loading
                    ? language === 'ar' ? 'جاري الحفظ...' : 'Saving...'
                    : language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
                </Button>
              </form>
            </Card>
          </TabsContent>

          {/* My Bookings */}
          <TabsContent value="bookings">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">
                {language === 'ar' ? 'حجوزاتي' : 'My Bookings'}
              </h2>
              <div className="text-center py-8">
                <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">
                  {language === 'ar' ? `عدد الحجوزات: ${bookingsCount}` : `Bookings Count: ${bookingsCount}`}
                </p>
                <p className="text-muted-foreground mb-4">
                  {language === 'ar' ? 'عرض حجوزاتك' : 'View your bookings'}
                </p>
                <Button onClick={() => router.push('/customer/bookings')}>
                  {language === 'ar' ? 'عرض الحجوزات' : 'View Bookings'}
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">
                {language === 'ar' ? 'إشعاراتي' : 'My Notifications'}
              </h2>
              {notificationsLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                  </p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {language === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border rounded-lg ${
                        !notification.is_read ? 'bg-blue-50 border-blue-200' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{notification.title}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <Eye className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        {/* Logout Button */}
        <Card className="p-6 mt-6">
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
          </Button>
        </Card>
      </div>
         <Footer />
    </div>
  );
}
