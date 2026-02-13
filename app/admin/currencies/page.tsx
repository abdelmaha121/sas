'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import AdminLayout from '@/components/admin/AdminLayout';
import { api } from '@/lib/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DollarSign, Search, Trash2, Edit, CheckSquare, X, AlertTriangle, Save, Plus, Eye, Check, XCircle } from 'lucide-react';
import { Currency } from '@/lib/types/database';

interface FormData {
  code: string;
  name: string;
  symbol: string;
  isDefault: boolean;
  isActive: boolean;
}

export default function AdminCurrenciesPage() {
  const { user } = useAuth();
  const { language } = useLanguage();

  // Restrict access to super admin only
  if (!user || user.role !== 'super_admin') {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold mb-2">
              {language === 'ar' ? 'وصول محظور' : 'Access Denied'}
            </h2>
            <p className="text-muted-foreground">
              {language === 'ar' ? 'هذه الصفحة متاحة للمسؤول الرئيسي فقط' : 'This page is only available to super administrators'}
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [currentCurrency, setCurrentCurrency] = useState<Currency | null>(null);
  const [selectedCurrencies, setSelectedCurrencies] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [formData, setFormData] = useState<FormData>({
    code: '',
    name: '',
    symbol: '',
    isDefault: false,
    isActive: true,
  });

  useEffect(() => {
    if (user) {
      loadCurrencies();
    }
  }, [user]);

  const loadCurrencies = async () => {
    try {
      setLoading(true);
      const data = await api.get<{ success: boolean; data: { currencies: Currency[] } }>('/admin/currencies');
      setCurrencies(data.data.currencies || []);
      setMessage(null);
    } catch (error: any) {
      setMessage({ type: 'error', text: language === 'ar' ? 'فشل تحميل قائمة العملات' : 'Failed to load currencies list' });
      setCurrencies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCurrency = async () => {
    if (!formData.code.trim() || !formData.name.trim() || !formData.symbol.trim()) {
      setMessage({
        type: 'error',
        text: language === 'ar' ? 'يرجى إدخال الكود والاسم والرمز' : 'Please enter code, name and symbol'
      });
      return;
    }

    try {
      setActionLoading(true);
      const payload = {
        code: formData.code.toUpperCase(),
        name: formData.name,
        symbol: formData.symbol,
        isDefault: formData.isDefault,
        isActive: formData.isActive,
      };

      await api.post('/admin/currencies', payload);
      setMessage({ type: 'success', text: language === 'ar' ? 'تم إنشاء العملة بنجاح' : 'Currency created successfully' });
      closeDialogs();
      await loadCurrencies();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || (language === 'ar' ? 'فشل إنشاء العملة' : 'Failed to create currency') });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditCurrency = async () => {
    if (!currentCurrency) return;
    try {
      setActionLoading(true);
      const payload = {
        code: formData.code.toUpperCase(),
        name: formData.name,
        symbol: formData.symbol,
        isDefault: formData.isDefault,
        isActive: formData.isActive,
      };

      await api.put(`/admin/currencies/${currentCurrency.id}`, payload);
      setMessage({ type: 'success', text: language === 'ar' ? 'تم تحديث بيانات العملة بنجاح' : 'Currency updated successfully' });
      closeDialogs();
      await loadCurrencies();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || (language === 'ar' ? 'فشل تحديث البيانات' : 'Failed to update currency') });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCurrency = async () => {
    const idsToDelete = selectedCurrencies.size > 0 ? Array.from(selectedCurrencies) : currentCurrency ? [currentCurrency.id] : [];
    if (idsToDelete.length === 0) return;
    try {
      setActionLoading(true);
      for (const id of idsToDelete) await api.delete(`/admin/currencies/${id}`);
      setMessage({ type: 'success', text: language === 'ar' ? `تم حذف ${idsToDelete.length} عملة بنجاح` : `Successfully deleted ${idsToDelete.length} currency(s)` });
      closeDialogs();
      setDeleteMode(false);
      await loadCurrencies();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || (language === 'ar' ? 'فشل حذف العملات' : 'Failed to delete currencies') });
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      symbol: '',
      isDefault: false,
      isActive: true,
    });
  };

  const closeDialogs = () => {
    setShowCreateDialog(false);
    setShowEditDialog(false);
    setShowDeleteDialog(false);
    setShowViewDialog(false);
    setCurrentCurrency(null);
    setSelectedCurrencies(new Set());
    resetForm();
  };

  const openEditDialog = (currency: Currency) => {
    setCurrentCurrency(currency);
    setFormData({
      code: currency.code || '',
      name: currency.name || '',
      symbol: currency.symbol || '',
      isDefault: currency.is_default,
      isActive: currency.is_active,
    });
    setShowEditDialog(true);
  };

  const openViewDialog = (currency: Currency) => {
    setCurrentCurrency(currency);
    setShowViewDialog(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setShowCreateDialog(true);
  };

  const openDeleteDialog = (currency: Currency) => {
    setCurrentCurrency(currency);
    setShowDeleteDialog(true);
  };

  const toggleSelectAll = () => {
    if (selectedCurrencies.size === filteredCurrencies.length) {
      setSelectedCurrencies(new Set());
    } else {
      setSelectedCurrencies(new Set(filteredCurrencies.map(c => c.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedCurrencies);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedCurrencies(newSelected);
  };

  const getStatusBadge = (isActive: boolean, isDefault: boolean) => {
    if (isDefault) {
      return { label: language === 'ar' ? 'افتراضي' : 'Default', className: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
    return isActive
      ? { label: language === 'ar' ? 'نشط' : 'Active', className: 'bg-green-50 text-green-700 border-green-200' }
      : { label: language === 'ar' ? 'غير نشط' : 'Inactive', className: 'bg-red-50 text-red-700 border-red-200' };
  };

  const filteredCurrencies = currencies.filter(currency => {
    const matchesSearch = searchQuery === '' ||
      (currency.name && currency.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (currency.code && currency.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (currency.symbol && currency.symbol.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && currency.is_active) ||
      (filterStatus === 'inactive' && !currency.is_active) ||
      (filterStatus === 'default' && currency.is_default);

    return matchesSearch && matchesStatus;
  });

  if (loading && (!currencies || currencies.length === 0)) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto max-w-7xl">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <DollarSign className="w-8 h-8" />
                {language === 'ar' ? 'إدارة العملات' : 'Currency Management'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {language === 'ar' ? `إجمالي العملات: ${currencies.length}` : `Total Currencies: ${currencies.length}`}
              </p>
            </div>
            <Button onClick={openCreateDialog} size="lg">
              <Plus className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'إضافة عملة جديدة' : 'Add New Currency'}
            </Button>
          </div>

          {message && (
            <Alert className={`mb-6 ${message.type === 'error' ? 'border-destructive' : 'border-green-500'}`}>
              <AlertDescription className={message.type === 'error' ? 'text-destructive' : 'text-green-700'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          <Card className="p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder={language === 'ar' ? 'بحث بالاسم أو الكود...' : 'Search by name or code...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger><SelectValue placeholder={language === 'ar' ? 'الحالة' : 'Status'} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'ar' ? 'جميع الحالات' : 'All Status'}</SelectItem>
                  <SelectItem value="active">{language === 'ar' ? 'نشط' : 'Active'}</SelectItem>
                  <SelectItem value="inactive">{language === 'ar' ? 'غير نشط' : 'Inactive'}</SelectItem>
                  <SelectItem value="default">{language === 'ar' ? 'افتراضي' : 'Default'}</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                {deleteMode && (
                  <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)} disabled={selectedCurrencies.size === 0}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    {language === 'ar' ? `حذف المحدد (${selectedCurrencies.size})` : `Delete Selected (${selectedCurrencies.size})`}
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => { setDeleteMode(!deleteMode); setSelectedCurrencies(new Set()); }}>
                  {deleteMode ? <X className="w-4 h-4 mr-2" /> : <CheckSquare className="w-4 h-4 mr-2" />}
                  {deleteMode ? (language === 'ar' ? 'إلغاء' : 'Cancel') : (language === 'ar' ? 'حذف متعدد' : 'Multi Delete')}
                </Button>
              </div>
            </div>
          </Card>

          <div className="space-y-4">
            {filteredCurrencies.length === 0 ? (
              <Card className="p-8 text-center">
                <DollarSign className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-lg">
                  {searchQuery || filterStatus !== 'all'
                    ? language === 'ar' ? 'لا توجد نتائج' : 'No results found'
                    : language === 'ar' ? 'لا توجد عملات حتى الآن' : 'No currencies yet'}
                </p>
              </Card>
            ) : (
              <>
                {deleteMode && (
                  <div className="flex items-center gap-2 px-4">
                    <button onClick={toggleSelectAll} className="flex items-center gap-2 p-2 hover:bg-accent rounded transition-colors">
                      <CheckSquare className="w-5 h-5" />
                      <span className="text-sm font-medium">
                        {selectedCurrencies.size === filteredCurrencies.length
                          ? language === 'ar' ? 'إلغاء تحديد الكل' : 'Deselect All'
                          : language === 'ar' ? 'تحديد الكل' : 'Select All'}
                      </span>
                    </button>
                  </div>
                )}

                {filteredCurrencies.map((currency) => (
                  <Card key={currency.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      {deleteMode && (
                        <input type="checkbox" checked={selectedCurrencies.has(currency.id)} onChange={() => toggleSelect(currency.id)} className="w-5 h-5 rounded border-gray-300 cursor-pointer flex-shrink-0" />
                      )}

                      <div className="flex items-center gap-4 flex-1 min-w-0 overflow-x-auto">
                        <div className="flex-shrink-0 min-w-[100px]">
                          <div className="text-lg font-bold text-primary">{currency.code}</div>
                        </div>

                        <div className="flex-shrink-0 min-w-[200px]">
                          <h3 className="text-base font-semibold">{currency.name}</h3>
                          <p className="text-sm text-muted-foreground">{currency.symbol}</p>
                        </div>

                        <div className="flex-shrink-0 min-w-[120px]">
                          <Badge variant="outline" className={getStatusBadge(currency.is_active, currency.is_default).className}>
                            {currency.is_default && <Check className="w-3 h-3 mr-1" />}
                            {getStatusBadge(currency.is_active, currency.is_default).label}
                          </Badge>
                        </div>
                      </div>

                      {!deleteMode && (
                        <div className="flex items-center gap-2 flex-shrink-0 min-w-[120px] justify-center">
                          <Button variant="ghost" size="sm" onClick={() => openViewDialog(currency)} className="h-9 w-9 p-0" title={language === 'ar' ? 'عرض' : 'View'}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(currency)} className="h-9 w-9 p-0" title={language === 'ar' ? 'تعديل' : 'Edit'}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(currency)} className="h-9 w-9 p-0 text-destructive hover:text-destructive" title={language === 'ar' ? 'حذف' : 'Delete'}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </>
            )}
          </div>

          {/* Create Currency Dialog */}
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{language === 'ar' ? 'إضافة عملة جديدة' : 'Add New Currency'}</DialogTitle>
                <DialogDescription>{language === 'ar' ? 'أدخل معلومات العملة الجديدة' : 'Enter new currency information'}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'كود العملة' : 'Currency Code'}<span className="text-destructive ml-1">*</span>
                  </label>
                  <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="USD" maxLength={3} />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'اسم العملة' : 'Currency Name'}<span className="text-destructive ml-1">*</span>
                  </label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder={language === 'ar' ? 'الدولار الأمريكي' : 'US Dollar'} />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'رمز العملة' : 'Currency Symbol'}<span className="text-destructive ml-1">*</span>
                  </label>
                  <Input value={formData.symbol} onChange={(e) => setFormData({ ...formData, symbol: e.target.value })} placeholder="$" />
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={formData.isDefault} onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })} className="w-4 h-4 rounded border-gray-300" />
                    <label className="text-sm font-medium">{language === 'ar' ? 'افتراضي' : 'Default'}</label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4 rounded border-gray-300" />
                    <label className="text-sm font-medium">{language === 'ar' ? 'نشط' : 'Active'}</label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={actionLoading}>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button onClick={handleCreateCurrency} disabled={actionLoading}>
                  {actionLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {language === 'ar' ? 'جارٍ الإضافة...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {language === 'ar' ? 'إضافة العملة' : 'Add Currency'}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Currency Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{language === 'ar' ? 'تعديل بيانات العملة' : 'Edit Currency'}</DialogTitle>
                <DialogDescription>{language === 'ar' ? 'قم بتعديل معلومات العملة' : 'Update currency information'}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'كود العملة' : 'Currency Code'}<span className="text-destructive ml-1">*</span>
                  </label>
                  <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="USD" maxLength={3} />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'اسم العملة' : 'Currency Name'}<span className="text-destructive ml-1">*</span>
                  </label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder={language === 'ar' ? 'الدولار الأمريكي' : 'US Dollar'} />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'رمز العملة' : 'Currency Symbol'}<span className="text-destructive ml-1">*</span>
                  </label>
                  <Input value={formData.symbol} onChange={(e) => setFormData({ ...formData, symbol: e.target.value })} placeholder="$" />
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={formData.isDefault} onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })} className="w-4 h-4 rounded border-gray-300" />
                    <label className="text-sm font-medium">{language === 'ar' ? 'افتراضي' : 'Default'}</label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4 rounded border-gray-300" />
                    <label className="text-sm font-medium">{language === 'ar' ? 'نشط' : 'Active'}</label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={actionLoading}>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button onClick={handleEditCurrency} disabled={actionLoading}>
                  {actionLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {language === 'ar' ? 'جارٍ التحديث...' : 'Updating...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* View Currency Dialog */}
          <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{language === 'ar' ? 'تفاصيل العملة' : 'Currency Details'}</DialogTitle>
              </DialogHeader>
              {currentCurrency && (
                <div className="space-y-4 py-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">{language === 'ar' ? 'كود العملة' : 'Currency Code'}</label>
                    <p className="text-lg font-bold">{currentCurrency.code}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{language === 'ar' ? 'اسم العملة' : 'Currency Name'}</label>
                    <p className="text-sm">{currentCurrency.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{language === 'ar' ? 'رمز العملة' : 'Currency Symbol'}</label>
                    <p className="text-lg">{currentCurrency.symbol}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{language === 'ar' ? 'الحالة' : 'Status'}</label>
                    <Badge variant="outline" className={getStatusBadge(currentCurrency.is_active, currentCurrency.is_default).className}>
                      {currentCurrency.is_default && <Check className="w-3 h-3 mr-1" />}
                      {getStatusBadge(currentCurrency.is_active, currentCurrency.is_default).label}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <label className="block text-sm font-medium mb-1">{language === 'ar' ? 'تاريخ الإنشاء' : 'Created At'}</label>
                      <p className="text-sm text-muted-foreground">{new Date(currentCurrency.created_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">{language === 'ar' ? 'آخر تحديث' : 'Updated At'}</label>
                      <p className="text-sm text-muted-foreground">{new Date(currentCurrency.updated_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</p>
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowViewDialog(false)}>{language === 'ar' ? 'إغلاق' : 'Close'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-5 h-5" />
                  {language === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}
                </DialogTitle>
                <DialogDescription>
                  {selectedCurrencies.size > 0
                    ? language === 'ar'
                      ? `هل أنت متأكد من حذف ${selectedCurrencies.size} عملة؟ لا يمكن التراجع عن هذا الإجراء.`
                      : `Are you sure you want to delete ${selectedCurrencies.size} currency(s)? This action cannot be undone.`
                    : language === 'ar'
                      ? 'هل أنت متأكد من حذف هذه العملة؟ لا يمكن التراجع عن هذا الإجراء.'
                      : 'Are you sure you want to delete this currency? This action cannot be undone.'
                  }
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={actionLoading}>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button variant="destructive" onClick={handleDeleteCurrency} disabled={actionLoading}>
                  {actionLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {language === 'ar' ? 'جارٍ الحذف...' : 'Deleting...'}
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      {language === 'ar' ? 'حذف' : 'Delete'}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AdminLayout>
  );
}
