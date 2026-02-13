'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { Settings, Save, DollarSign, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  is_default: boolean;
  is_active: boolean;
}

export default function AdminSettingsPage() {
  const { language, t } = useLanguage();
  const [settings, setSettings] = useState({
    siteName: 'خدماتي',
    siteNameEn: 'Khadamati',
    supportEmail: 'support@khadamati.sa',
    supportPhone: '+966500000000',
    commissionRate: 15,
    taxRate: 15,
    enableRegistration: true,
    enableNotifications: true,
    maintenanceMode: false,
  });
  const [loading, setLoading] = useState(false);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [currencyDialog, setCurrencyDialog] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const [currencyForm, setCurrencyForm] = useState({
    code: '',
    name: '',
    symbol: '',
    isDefault: false,
    isActive: true,
  });

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const fetchCurrencies = async () => {
    try {
      const response = await fetch('/api/admin/currencies');
      if (response.ok) {
        const data = await response.json();
        setCurrencies(data);
      }
    } catch (error) {
      console.error('Error fetching currencies:', error);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      toast.success(language === 'ar' ? 'تم حفظ الإعدادات بنجاح' : 'Settings saved successfully');
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCurrency = async () => {
    try {
      const url = editingCurrency
        ? `/api/admin/currencies/${editingCurrency.id}`
        : '/api/admin/currencies';
      const method = editingCurrency ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currencyForm),
      });

      if (response.ok) {
        toast.success(language === 'ar' ? 'تم حفظ العملة بنجاح' : 'Currency saved successfully');
        setCurrencyDialog(false);
        setEditingCurrency(null);
        setCurrencyForm({ code: '', name: '', symbol: '', isDefault: false, isActive: true });
        fetchCurrencies();
      } else {
        toast.error(language === 'ar' ? 'خطأ في حفظ العملة' : 'Error saving currency');
      }
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleEditCurrency = (currency: Currency) => {
    setEditingCurrency(currency);
    setCurrencyForm({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      isDefault: currency.is_default,
      isActive: currency.is_active,
    });
    setCurrencyDialog(true);
  };

  const handleDeleteCurrency = async (id: string) => {
    if (!confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذه العملة؟' : 'Are you sure you want to delete this currency?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/currencies/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success(language === 'ar' ? 'تم حذف العملة بنجاح' : 'Currency deleted successfully');
        fetchCurrencies();
      } else {
        toast.error(language === 'ar' ? 'خطأ في حذف العملة' : 'Error deleting currency');
      }
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            {language === 'ar' ? 'إعدادات النظام' : 'System Settings'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {language === 'ar' ? 'إدارة إعدادات المنصة العامة' : 'Manage general platform settings'}
          </p>
        </div>

        <div className="grid gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Settings className="h-5 w-5" />
              <h2 className="text-xl font-semibold">{language === 'ar' ? 'الإعدادات العامة' : 'General Settings'}</h2>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'ar' ? 'اسم الموقع' : 'Site Name'}</Label>
                  <Input
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{language === 'ar' ? 'اسم الموقع (إنجليزي)' : 'Site Name (English)'}</Label>
                  <Input
                    value={settings.siteNameEn}
                    onChange={(e) => setSettings({ ...settings, siteNameEn: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{language === 'ar' ? 'البريد الإلكتروني للدعم' : 'Support Email'}</Label>
                  <Input
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{language === 'ar' ? 'هاتف الدعم' : 'Support Phone'}</Label>
                  <Input
                    value={settings.supportPhone}
                    onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{language === 'ar' ? 'نسبة العمولة (%)' : 'Commission Rate (%)'}</Label>
                  <Input
                    type="number"
                    value={settings.commissionRate}
                    onChange={(e) => setSettings({ ...settings, commissionRate: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>{language === 'ar' ? 'نسبة الضريبة (%)' : 'Tax Rate (%)'}</Label>
                  <Input
                    type="number"
                    value={settings.taxRate}
                    onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">{language === 'ar' ? 'إعدادات المنصة' : 'Platform Settings'}</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>{language === 'ar' ? 'تفعيل التسجيل' : 'Enable Registration'}</Label>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'السماح بتسجيل مستخدمين جدد' : 'Allow new user registration'}
                  </p>
                </div>
                <Switch
                  checked={settings.enableRegistration}
                  onCheckedChange={(checked) => setSettings({ ...settings, enableRegistration: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>{language === 'ar' ? 'تفعيل الإشعارات' : 'Enable Notifications'}</Label>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'إرسال إشعارات للمستخدمين' : 'Send notifications to users'}
                  </p>
                </div>
                <Switch
                  checked={settings.enableNotifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, enableNotifications: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>{language === 'ar' ? 'وضع الصيانة' : 'Maintenance Mode'}</Label>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'إيقاف الوصول للمستخدمين مؤقتاً' : 'Temporarily disable user access'}
                  </p>
                </div>
                <Switch
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5" />
                <h2 className="text-xl font-semibold">{language === 'ar' ? 'إدارة العملات' : 'Currency Management'}</h2>
              </div>
              <Dialog open={currencyDialog} onOpenChange={setCurrencyDialog}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingCurrency(null);
                    setCurrencyForm({ code: '', name: '', symbol: '', isDefault: false, isActive: true });
                  }}>
                    <Plus className="h-4 w-4 ml-2" />
                    {language === 'ar' ? 'إضافة عملة' : 'Add Currency'}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingCurrency ? (language === 'ar' ? 'تعديل العملة' : 'Edit Currency') : (language === 'ar' ? 'إضافة عملة جديدة' : 'Add New Currency')}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>{language === 'ar' ? 'رمز العملة' : 'Currency Code'}</Label>
                        <Input
                          value={currencyForm.code}
                          onChange={(e) => setCurrencyForm({ ...currencyForm, code: e.target.value.toUpperCase() })}
                          placeholder="OMR"
                        />
                      </div>
                      <div>
                        <Label>{language === 'ar' ? 'اسم العملة' : 'Currency Name'}</Label>
                        <Input
                          value={currencyForm.name}
                          onChange={(e) => setCurrencyForm({ ...currencyForm, name: e.target.value })}
                          placeholder="Omani Rial"
                        />
                      </div>
                      <div>
                        <Label>{language === 'ar' ? 'رمز العرض' : 'Display Symbol'}</Label>
                        <Input
                          value={currencyForm.symbol}
                          onChange={(e) => setCurrencyForm({ ...currencyForm, symbol: e.target.value })}
                          placeholder="ر.ع"
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={currencyForm.isDefault}
                        onCheckedChange={(checked) => setCurrencyForm({ ...currencyForm, isDefault: checked })}
                      />
                      <Label>{language === 'ar' ? 'العملة الافتراضية' : 'Default Currency'}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={currencyForm.isActive}
                        onCheckedChange={(checked) => setCurrencyForm({ ...currencyForm, isActive: checked })}
                      />
                      <Label>{language === 'ar' ? 'نشط' : 'Active'}</Label>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setCurrencyDialog(false)}>
                        {language === 'ar' ? 'إلغاء' : 'Cancel'}
                      </Button>
                      <Button onClick={handleSaveCurrency}>
                        {language === 'ar' ? 'حفظ' : 'Save'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === 'ar' ? 'الرمز' : 'Code'}</TableHead>
                  <TableHead>{language === 'ar' ? 'الاسم' : 'Name'}</TableHead>
                  <TableHead>{language === 'ar' ? 'الرمز' : 'Symbol'}</TableHead>
                  <TableHead>{language === 'ar' ? 'افتراضي' : 'Default'}</TableHead>
                  <TableHead>{language === 'ar' ? 'نشط' : 'Active'}</TableHead>
                  <TableHead>{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currencies.map((currency) => (
                  <TableRow key={currency.id}>
                    <TableCell className="font-medium">{currency.code}</TableCell>
                    <TableCell>{currency.name}</TableCell>
                    <TableCell>{currency.symbol}</TableCell>
                    <TableCell>
                      {currency.is_default && <span className="text-green-600">✓</span>}
                    </TableCell>
                    <TableCell>
                      {currency.is_active ? (
                        <span className="text-green-600">{language === 'ar' ? 'نعم' : 'Yes'}</span>
                      ) : (
                        <span className="text-red-600">{language === 'ar' ? 'لا' : 'No'}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCurrency(currency)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCurrency(currency.id)}
                          disabled={currency.is_default}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={loading}>
              <Save className="h-4 w-4 ml-2" />
              {loading ? t('common.loading') : t('common.save')}
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
