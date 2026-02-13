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
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Briefcase, Search, Trash2, Edit, CheckSquare, X, AlertTriangle, Save, DollarSign, Clock, Tag, Eye, Check, XCircle, Plus } from 'lucide-react';

interface Service {
  id: string;
  tenant_id: string;
  provider_id: string;
  category_id: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  base_price: number;
  currency: string;
  duration_minutes: number | null;
  pricing_type: 'fixed' | 'hourly' | 'custom';
  is_active: boolean;
  images: string[] | null;
  metadata: any;
  approval_status: 'pending' | 'approved' | 'rejected';
  category_name: string;
  category_name_ar: string;
  provider_name: string;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: string;
  name: string;
  name_ar: string | null;
}

interface Provider {
  id: string;
  business_name: string;
  user_id: string;
  is_active: boolean;
}

interface FormData {
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  basePrice: string;
  currency: string;
  currencyId: string;
  durationMinutes: string;
  pricingType: string;
  isActive: boolean;
  categoryId: string;
  providerId: string;
  paymentMethods: string[];
  bookingType: string;
  allowRecurring: boolean;
  allowUrgent: boolean;
  urgentFee: string;
  minAdvanceHours: string;
  freeCancellationHours: string;
  cancellationType: string;
  cancellationValue: string;
  availability: any;
}

export default function AdminServicesPage() {
  const { user } = useAuth();
  const { language } = useLanguage();

  const [services, setServices] = useState<any[]>([]); // Ensure initialized as empty array
  const [categories, setCategories] = useState<Category[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [currentService, setCurrentService] = useState<Service | null>(null);
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPricingType, setFilterPricingType] = useState<string>('all');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    basePrice: '',
    currency: 'OMR',
    currencyId: '',
    durationMinutes: '',
    pricingType: 'fixed',
    isActive: true,
    categoryId: '',
    providerId: '',
    paymentMethods: ['instant', 'cash_on_delivery'],
    bookingType: 'both',
    allowRecurring: false,
    allowUrgent: false,
    urgentFee: '',
    minAdvanceHours: '24',
    freeCancellationHours: '24',
    cancellationType: 'percentage',
    cancellationValue: '20',
    availability: null,
  });

  useEffect(() => {
    if (user) {
      loadServices();
      loadCategories();
      if (user.role === 'admin' || user.role === 'super_admin') {
        loadProviders();
      }
    }
  }, [user, includeInactive]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const params = includeInactive ? '?include_inactive=true' : '';
      const data = await api.get<{ success: boolean; data: { services: Service[] } }>(`/admin/services${params}`);
      setServices(data.data.services || []);
      setMessage(null);
    } catch (error: any) {
      setMessage({ type: 'error', text: language === 'ar' ? 'فشل تحميل قائمة الخدمات' : 'Failed to load services list' });
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await api.get<{ categories: Category[] }>(`/admin/categories?include_inactive=true`);
      setCategories(data.categories);
    } catch (error: any) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadProviders = async () => {
    try {
      const data = await api.get<{ providers: Provider[] }>(`/admin/providers?include_inactive=true`);
      setProviders(data.providers);
    } catch (error: any) {
      console.error('Failed to load providers:', error);
    }
  };

  const handleCreateService = async () => {
    if (!formData.name.trim() || !formData.basePrice.trim() || !formData.categoryId) {
      setMessage({
        type: 'error',
        text: language === 'ar' ? 'يرجى إدخال الاسم والسعر والتصنيف' : 'Please enter name, price and category'
      });
      return;
    }

    if ((user?.role === 'admin' || user?.role === 'super_admin') && !formData.providerId) {
      setMessage({
        type: 'error',
        text: language === 'ar' ? 'يرجى اختيار المزود' : 'Please select a provider'
      });
      return;
    }

    try {
      setActionLoading(true);
      const payload: any = {
        categoryId: formData.categoryId,
        name: formData.name,
        nameAr: formData.nameAr || null,
        description: formData.description || null,
        descriptionAr: formData.descriptionAr || null,
        basePrice: parseFloat(formData.basePrice),
        currency: formData.currency,
        durationMinutes: formData.durationMinutes ? parseInt(formData.durationMinutes) : null,
        pricingType: formData.pricingType,
        isActive: formData.isActive,
        paymentMethods: formData.paymentMethods,
        bookingType: formData.bookingType,
        allowRecurring: formData.allowRecurring,
        allowUrgent: formData.allowUrgent,
        urgentFee: formData.urgentFee ? parseFloat(formData.urgentFee) : null,
        minAdvanceHours: parseInt(formData.minAdvanceHours),
        freeCancellationHours: parseInt(formData.freeCancellationHours),
        cancellationType: formData.cancellationType,
        cancellationValue: parseFloat(formData.cancellationValue),
        availability: formData.availability,
      };

      if (user?.role === 'admin' || user?.role === 'super_admin') {
        payload.providerId = formData.providerId;
      }

      await api.post('/admin/services', payload);
      setMessage({ type: 'success', text: language === 'ar' ? 'تم إنشاء الخدمة بنجاح' : 'Service created successfully' });
      closeDialogs();
      await loadServices();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || (language === 'ar' ? 'فشل إنشاء الخدمة' : 'Failed to create service') });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditService = async () => {
    if (!currentService) return;
    try {
      setActionLoading(true);
      const payload: any = {
        name: formData.name,
        nameAr: formData.nameAr || null,
        description: formData.description || null,
        descriptionAr: formData.descriptionAr || null,
        basePrice: parseFloat(formData.basePrice),
        currency: formData.currency,
        currencyId: formData.currencyId || null,
        durationMinutes: formData.durationMinutes ? parseInt(formData.durationMinutes) : null,
        pricingType: formData.pricingType,
        isActive: formData.isActive,
        paymentMethods: formData.paymentMethods,
        bookingType: formData.bookingType,
        allowRecurring: formData.allowRecurring,
        allowUrgent: formData.allowUrgent,
        urgentFee: formData.urgentFee ? parseFloat(formData.urgentFee) : null,
        minAdvanceHours: parseInt(formData.minAdvanceHours),
        freeCancellationHours: parseInt(formData.freeCancellationHours),
        cancellationType: formData.cancellationType,
        cancellationValue: parseFloat(formData.cancellationValue),
        availability: formData.availability,
      };

      if (user?.role === 'admin' || user?.role === 'super_admin') {
        payload.providerId = formData.providerId;
      }

      await api.put(`/admin/services/${currentService.id}`, payload);
      setMessage({ type: 'success', text: language === 'ar' ? 'تم تحديث بيانات الخدمة بنجاح' : 'Service updated successfully' });
      closeDialogs();
      await loadServices();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || (language === 'ar' ? 'فشل تحديث البيانات' : 'Failed to update service') });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteService = async () => {
    const idsToDelete = selectedServices.size > 0 ? Array.from(selectedServices) : currentService ? [currentService.id] : [];
    if (idsToDelete.length === 0) return;
    try {
      setActionLoading(true);
      for (const id of idsToDelete) await api.delete(`/admin/services/${id}`);
      setMessage({ type: 'success', text: language === 'ar' ? `تم حذف ${idsToDelete.length} خدمة بنجاح` : `Successfully deleted ${idsToDelete.length} service(s)` });
      closeDialogs();
      setDeleteMode(false);
      await loadServices();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || (language === 'ar' ? 'فشل حذف الخدمات' : 'Failed to delete services') });
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveService = async (serviceId: string) => {
    try {
      await api.put(`/admin/services/${serviceId}`, { isActive: true });
      setMessage({ type: 'success', text: language === 'ar' ? 'تم الموافقة على الخدمة' : 'Service approved successfully' });
      await loadServices();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || (language === 'ar' ? 'فشل الموافقة على الخدمة' : 'Failed to approve service') });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', nameAr: '', description: '', descriptionAr: '', basePrice: '', currency: 'OMR',
      currencyId: '',
      durationMinutes: '', pricingType: 'fixed', isActive: true, categoryId: '', providerId: '',
      paymentMethods: ['online', 'cash'],
      bookingType: 'instant',
      allowRecurring: false,
      allowUrgent: false,
      urgentFee: '',
      minAdvanceHours: '24',
      freeCancellationHours: '24',
      cancellationType: 'percentage',
      cancellationValue: '20',
      availability: null,
    });
  };

  const closeDialogs = () => {
    setShowCreateDialog(false);
    setShowEditDialog(false);
    setShowDeleteDialog(false);
    setShowViewDialog(false);
    setCurrentService(null);
    setSelectedServices(new Set());
    resetForm();
  };

  const openEditDialog = (service: Service) => {
    setCurrentService(service);
    setFormData({
      name: service.name || '',
      nameAr: service.name_ar || '',
      description: service.description || '',
      descriptionAr: service.description_ar || '',
      basePrice: service.base_price?.toString() || '',
      currency: service.currency || 'OMR',
      currencyId: '',
      durationMinutes: service.duration_minutes?.toString() || '',
      pricingType: service.pricing_type || 'fixed',
      isActive: service.is_active,
      categoryId: service.category_id || '',
      providerId: service.provider_id || '',
      paymentMethods: (service as any).payment_methods || ['instant', 'cash_on_delivery'],
      bookingType: (service as any).booking_type || 'both',
      allowRecurring: (service as any).allow_recurring === 1,
      allowUrgent: (service as any).allow_urgent === 1,
      urgentFee: (service as any).urgent_fee?.toString() || '',
      minAdvanceHours: (service as any).min_advance_hours?.toString() || '24',
      freeCancellationHours: (service as any).free_cancellation_hours?.toString() || '24',
      cancellationType: (service as any).cancellation_type || 'percentage',
      cancellationValue: (service as any).cancellation_value?.toString() || '20',
      availability: (service as any).availability || null,
    });
    setShowEditDialog(true);
  };

  const openViewDialog = (service: Service) => {
    setCurrentService(service);
    setShowViewDialog(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setShowCreateDialog(true);
  };

  const openDeleteDialog = (service: Service) => {
    setCurrentService(service);
    setShowDeleteDialog(true);
  };

  const toggleSelectAll = () => {
    if (selectedServices.size === filteredServices.length) {
      setSelectedServices(new Set());
    } else {
      setSelectedServices(new Set(filteredServices.map(s => s.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedServices);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedServices(newSelected);
  };

  const getPricingTypeBadge = (type: string) => {
    const types: any = {
      fixed: { label: language === 'ar' ? 'سعر ثابت' : 'Fixed', variant: 'default' },
      hourly: { label: language === 'ar' ? 'بالساعة' : 'Hourly', variant: 'secondary' },
      custom: { label: language === 'ar' ? 'مخصص' : 'Custom', variant: 'outline' }
    };
    return types[type] || { label: type, variant: 'secondary' };
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive
      ? { label: language === 'ar' ? 'نشط' : 'Active', className: 'bg-green-50 text-green-700 border-green-200' }
      : { label: language === 'ar' ? 'غير نشط' : 'Inactive', className: 'bg-red-50 text-red-700 border-red-200' };
  };

  const filteredServices = (services || []).filter(service => {
    const matchesSearch = searchQuery === '' ||
      (service.name && service.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (service.name_ar && service.name_ar.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (service.description && service.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesSearch;
  });

  if (loading && (!services || services.length === 0)) {
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
                <Briefcase className="w-8 h-8" />
                {language === 'ar' ? 'إدارة الخدمات' : 'Services Management'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {language === 'ar' ? `إجمالي الخدمات: ${services.length}` : `Total Services: ${services.length}`}
              </p>
            </div>
            <Button onClick={openCreateDialog} size="lg">
              <Plus className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'إضافة خدمة جديدة' : 'Add New Service'}
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder={language === 'ar' ? 'بحث بالاسم أو التصنيف...' : 'Search by name or category...'}
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
                </SelectContent>
              </Select>

              <Select value={filterPricingType} onValueChange={setFilterPricingType}>
                <SelectTrigger><SelectValue placeholder={language === 'ar' ? 'نوع التسعير' : 'Pricing Type'} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'ar' ? 'جميع الأنواع' : 'All Types'}</SelectItem>
                  <SelectItem value="fixed">{language === 'ar' ? 'سعر ثابت' : 'Fixed'}</SelectItem>
                  <SelectItem value="hourly">{language === 'ar' ? 'بالساعة' : 'Hourly'}</SelectItem>
                  <SelectItem value="custom">{language === 'ar' ? 'مخصص' : 'Custom'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={includeInactive} onChange={(e) => setIncludeInactive(e.target.checked)} className="w-4 h-4 rounded border-gray-300" />
                <span className="text-sm">{language === 'ar' ? 'إظهار الخدمات غير النشطة' : 'Show inactive services'}</span>
              </label>
            </div>

            {deleteMode && (
              <div className="mt-4 flex items-center gap-2">
                <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)} disabled={selectedServices.size === 0}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  {language === 'ar' ? `حذف المحدد (${selectedServices.size})` : `Delete Selected (${selectedServices.size})`}
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setDeleteMode(false); setSelectedServices(new Set()); }}>
                  <X className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
              </div>
            )}

            {!deleteMode && filteredServices.length > 1 && (
              <div className="mt-4">
                <Button variant="outline" size="sm" onClick={() => { setDeleteMode(true); setSelectedServices(new Set()); }}>
                  <CheckSquare className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'حذف متعدد' : 'Multi Delete'}
                </Button>
              </div>
            )}
          </Card>

          <div className="space-y-4">
            {filteredServices.length === 0 ? (
              <Card className="p-8 text-center">
                <Briefcase className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-lg">
                  {searchQuery || filterStatus !== 'all' || filterPricingType !== 'all'
                    ? language === 'ar' ? 'لا توجد نتائج' : 'No results found'
                    : language === 'ar' ? 'لا يوجد خدمات حتى الآن' : 'No services yet'}
                </p>
              </Card>
            ) : (
              <>
                {deleteMode && (
                  <div className="flex items-center gap-2 px-4">
                    <button onClick={toggleSelectAll} className="flex items-center gap-2 p-2 hover:bg-accent rounded transition-colors">
                      <CheckSquare className="w-5 h-5" />
                      <span className="text-sm font-medium">
                        {selectedServices.size === filteredServices.length
                          ? language === 'ar' ? 'إلغاء تحديد الكل' : 'Deselect All'
                          : language === 'ar' ? 'تحديد الكل' : 'Select All'}
                      </span>
                    </button>
                  </div>
                )}

                {filteredServices.map((service) => (
                  <Card key={service.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      {deleteMode && (
                        <input type="checkbox" checked={selectedServices.has(service.id)} onChange={() => toggleSelect(service.id)} className="w-5 h-5 rounded border-gray-300 cursor-pointer flex-shrink-0" />
                      )}

                      <div className="flex items-center gap-4 flex-1 min-w-0 overflow-x-auto">
                        <div className="flex-shrink-0 min-w-[200px]">
                          <h3 className="text-base font-semibold">{language === 'ar' && service.name_ar ? service.name_ar : service.name}</h3>
                          {service.duration_minutes && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" />
                              {service.duration_minutes} {language === 'ar' ? 'دقيقة' : 'min'}
                            </p>
                          )}
                        </div>

                        <div className="flex-shrink-0 min-w-[150px]">
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {language === 'ar' && service.category_name_ar ? service.category_name_ar : service.category_name}
                          </Badge>
                        </div>

                        <div className="flex-shrink-0 min-w-[100px]">
                          <div className="flex items-center gap-1 font-semibold text-primary">
                            <DollarSign className="w-4 h-4" />
                            {service.base_price} {service.currency}
                          </div>
                        </div>

                        <div className="flex-shrink-0 min-w-[100px]">
                          <Badge variant={getPricingTypeBadge(service.pricing_type).variant as any}>
                            {getPricingTypeBadge(service.pricing_type).label}
                          </Badge>
                        </div>

                        <div className="flex-shrink-0 min-w-[100px]">
                          <Badge variant="outline" className={getStatusBadge(service.is_active).className}>
                            {service.is_active ? <Check className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                            {getStatusBadge(service.is_active).label}
                          </Badge>
                        </div>
                      </div>

                      {!deleteMode && (
                        <div className="flex items-center gap-2 flex-shrink-0 min-w-[120px] justify-center">
                          <Button variant="ghost" size="sm" onClick={() => openViewDialog(service)} className="h-9 w-9 p-0" title={language === 'ar' ? 'عرض' : 'View'}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(service)} className="h-9 w-9 p-0" title={language === 'ar' ? 'تعديل' : 'Edit'}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          {!service.is_active && (
                            <Button variant="ghost" size="sm" onClick={() => handleApproveService(service.id)} className="h-9 w-9 p-0 text-green-600 hover:text-green-700" title={language === 'ar' ? 'موافقة' : 'Approve'}>
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(service)} className="h-9 w-9 p-0 text-destructive hover:text-destructive" title={language === 'ar' ? 'حذف' : 'Delete'}>
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

          {/* Create Service Dialog */}
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{language === 'ar' ? 'إضافة خدمة جديدة' : 'Add New Service'}</DialogTitle>
                <DialogDescription>{language === 'ar' ? 'أدخل معلومات الخدمة الجديدة' : 'Enter new service information'}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ar' ? 'الاسم بالإنجليزية' : 'Name (English)'}<span className="text-destructive ml-1">*</span>
                    </label>
                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder={language === 'ar' ? 'أدخل اسم الخدمة' : 'Enter service name'} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">{language === 'ar' ? 'الاسم بالعربية' : 'Name (Arabic)'}</label>
                    <Input value={formData.nameAr} onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })} placeholder={language === 'ar' ? 'أدخل اسم الخدمة بالعربية' : 'Enter service name in Arabic'} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'التصنيف' : 'Category'}<span className="text-destructive ml-1">*</span>
                  </label>
                  <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'ar' ? 'اختر التصنيف' : 'Select category'} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {language === 'ar' && category.name_ar ? category.name_ar : category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(user?.role === 'admin' || user?.role === 'super_admin') && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ar' ? 'المزود' : 'Provider'}<span className="text-destructive ml-1">*</span>
                    </label>
                    <Select value={formData.providerId} onValueChange={(value) => setFormData({ ...formData, providerId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'ar' ? 'اختر المزود' : 'Select provider'} />
                      </SelectTrigger>
                      <SelectContent>
                        {providers.map((provider) => (
                          <SelectItem key={provider.id} value={provider.id}>
                            {provider.business_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ar' ? 'السعر الأساسي' : 'Base Price'}<span className="text-destructive ml-1">*</span>
                    </label>
                    <Input type="number" step="0.01" value={formData.basePrice} onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })} placeholder="0.00" />
                  </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{language === 'ar' ? 'العملة' : 'Currency'}</label>
                  <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OMR">{language === 'ar' ? 'ريال عماني' : 'OMR'}</SelectItem>
                      <SelectItem value="SAR">{language === 'ar' ? 'ريال سعودي' : 'SAR'}</SelectItem>
                      <SelectItem value="USD">{language === 'ar' ? 'دولار أمريكي' : 'USD'}</SelectItem>
                      <SelectItem value="EUR">{language === 'ar' ? 'يورو' : 'EUR'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">{language === 'ar' ? 'نوع التسعير' : 'Pricing Type'}</label>
                    <Select value={formData.pricingType} onValueChange={(value) => setFormData({ ...formData, pricingType: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">{language === 'ar' ? 'سعر ثابت' : 'Fixed'}</SelectItem>
                        <SelectItem value="hourly">{language === 'ar' ? 'بالساعة' : 'Hourly'}</SelectItem>
                        <SelectItem value="custom">{language === 'ar' ? 'مخصص' : 'Custom'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{language === 'ar' ? 'المدة بالدقائق (اختياري)' : 'Duration in minutes (optional)'}</label>
                  <Input type="number" value={formData.durationMinutes} onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })} placeholder={language === 'ar' ? 'أدخل المدة' : 'Enter duration'} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">{language === 'ar' ? 'الوصف بالإنجليزية' : 'Description (English)'}</label>
                    <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder={language === 'ar' ? 'أدخل وصف الخدمة' : 'Enter service description'} rows={3} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">{language === 'ar' ? 'الوصف بالعربية' : 'Description (Arabic)'}</label>
                    <Textarea value={formData.descriptionAr} onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })} placeholder={language === 'ar' ? 'أدخل وصف الخدمة بالعربية' : 'Enter service description in Arabic'} rows={3} />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4 rounded border-gray-300" />
                  <label className="text-sm font-medium">{language === 'ar' ? 'نشط' : 'Active'}</label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={actionLoading}>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button onClick={handleCreateService} disabled={actionLoading}>
                  {actionLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {language === 'ar' ? 'جارٍ الإضافة...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {language === 'ar' ? 'إضافة الخدمة' : 'Add Service'}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{language === 'ar' ? 'تفاصيل الخدمة' : 'Service Details'}</DialogTitle>
              </DialogHeader>
              {currentService && (
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">{language === 'ar' ? 'الاسم بالإنجليزية' : 'Name (English)'}</label>
                      <p className="text-sm">{currentService.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">{language === 'ar' ? 'الاسم بالعربية' : 'Name (Arabic)'}</label>
                      <p className="text-sm">{currentService.name_ar || '-'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{language === 'ar' ? 'التصنيف' : 'Category'}</label>
                    <p className="text-sm">{language === 'ar' && currentService.category_name_ar ? currentService.category_name_ar : currentService.category_name}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">{language === 'ar' ? 'السعر' : 'Price'}</label>
                      <p className="text-sm font-semibold">{currentService.base_price} {currentService.currency}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">{language === 'ar' ? 'نوع التسعير' : 'Pricing Type'}</label>
                      <Badge variant={getPricingTypeBadge(currentService.pricing_type).variant as any}>{getPricingTypeBadge(currentService.pricing_type).label}</Badge>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">{language === 'ar' ? 'المدة' : 'Duration'}</label>
                      <p className="text-sm">{currentService.duration_minutes ? `${currentService.duration_minutes} ${language === 'ar' ? 'دقيقة' : 'min'}` : '-'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{language === 'ar' ? 'الوصف بالإنجليزية' : 'Description (English)'}</label>
                    <p className="text-sm whitespace-pre-wrap">{currentService.description || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{language === 'ar' ? 'الوصف بالعربية' : 'Description (Arabic)'}</label>
                    <p className="text-sm whitespace-pre-wrap">{currentService.description_ar || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{language === 'ar' ? 'الحالة' : 'Status'}</label>
                    <Badge variant="outline" className={getStatusBadge(currentService.is_active).className}>
                      {currentService.is_active ? <Check className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                      {getStatusBadge(currentService.is_active).label}
                    </Badge>
                  </div>
                  {currentService.images && currentService.images.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium mb-2">{language === 'ar' ? 'الصور' : 'Images'}</label>
                      <div className="grid grid-cols-3 gap-2">
                        {currentService.images.map((img, idx) => (
                          <div key={idx} className="aspect-square rounded border overflow-hidden">
                            <img src={img} alt={`Image ${idx + 1}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <label className="block text-sm font-medium mb-1">{language === 'ar' ? 'تاريخ الإنشاء' : 'Created At'}</label>
                      <p className="text-sm text-muted-foreground">{new Date(currentService.created_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">{language === 'ar' ? 'آخر تحديث' : 'Updated At'}</label>
                      <p className="text-sm text-muted-foreground">{new Date(currentService.updated_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</p>
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowViewDialog(false)}>{language === 'ar' ? 'إغلاق' : 'Close'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{language === 'ar' ? 'تعديل بيانات الخدمة' : 'Edit Service'}</DialogTitle>
                <DialogDescription>{language === 'ar' ? 'قم بتعديل معلومات الخدمة والسعر والحالة' : 'Update service information, price and status'}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ar' ? 'الاسم بالإنجليزية' : 'Name (English)'}<span className="text-destructive ml-1">*</span>
                    </label>
                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder={language === 'ar' ? 'أدخل اسم الخدمة' : 'Enter service name'} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">{language === 'ar' ? 'الاسم بالعربية' : 'Name (Arabic)'}</label>
                    <Input value={formData.nameAr} onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })} placeholder={language === 'ar' ? 'أدخل اسم الخدمة بالعربية' : 'Enter service name in Arabic'} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'التصنيف' : 'Category'}<span className="text-destructive ml-1">*</span>
                  </label>
                  <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'ar' ? 'اختر التصنيف' : 'Select category'} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {language === 'ar' && category.name_ar ? category.name_ar : category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(user?.role === 'admin' || user?.role === 'super_admin') && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ar' ? 'المزود' : 'Provider'}<span className="text-destructive ml-1">*</span>
                    </label>
                    <Select value={formData.providerId} onValueChange={(value) => setFormData({ ...formData, providerId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'ar' ? 'اختر المزود' : 'Select provider'} />
                      </SelectTrigger>
                      <SelectContent>
                        {providers.map((provider) => (
                          <SelectItem key={provider.id} value={provider.id}>
                            {provider.business_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ar' ? 'السعر الأساسي' : 'Base Price'}<span className="text-destructive ml-1">*</span>
                    </label>
                    <Input type="number" step="0.01" value={formData.basePrice} onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })} placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">{language === 'ar' ? 'العملة' : 'Currency'}</label>
                    <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SAR">{language === 'ar' ? 'ريال سعودي' : 'SAR'}</SelectItem>
                        <SelectItem value="USD">{language === 'ar' ? 'دولار أمريكي' : 'USD'}</SelectItem>
                        <SelectItem value="EUR">{language === 'ar' ? 'يورو' : 'EUR'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">{language === 'ar' ? 'نوع التسعير' : 'Pricing Type'}</label>
                    <Select value={formData.pricingType} onValueChange={(value) => setFormData({ ...formData, pricingType: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">{language === 'ar' ? 'سعر ثابت' : 'Fixed'}</SelectItem>
                        <SelectItem value="hourly">{language === 'ar' ? 'بالساعة' : 'Hourly'}</SelectItem>
                        <SelectItem value="custom">{language === 'ar' ? 'مخصص' : 'Custom'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{language === 'ar' ? 'المدة بالدقائق (اختياري)' : 'Duration in minutes (optional)'}</label>
                  <Input type="number" value={formData.durationMinutes} onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })} placeholder={language === 'ar' ? 'أدخل المدة' : 'Enter duration'} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">{language === 'ar' ? 'الوصف بالإنجليزية' : 'Description (English)'}</label>
                    <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder={language === 'ar' ? 'أدخل وصف الخدمة' : 'Enter service description'} rows={3} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">{language === 'ar' ? 'الوصف بالعربية' : 'Description (Arabic)'}</label>
                    <Textarea value={formData.descriptionAr} onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })} placeholder={language === 'ar' ? 'أدخل وصف الخدمة بالعربية' : 'Enter service description in Arabic'} rows={3} />
                  </div>
                </div>

                {/* Payment Methods */}
                <div>
                  <label className="block text-sm font-medium mb-2">{language === 'ar' ? 'طرق الدفع' : 'Payment Methods'}</label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.paymentMethods.includes('online')}
                        onChange={(e) => {
                          const methods = e.target.checked
                            ? [...formData.paymentMethods, 'online']
                            : formData.paymentMethods.filter(m => m !== 'online');
                          setFormData({ ...formData, paymentMethods: methods });
                        }}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <label className="text-sm">{language === 'ar' ? 'دفع إلكتروني' : 'Online Payment'}</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.paymentMethods.includes('cash')}
                        onChange={(e) => {
                          const methods = e.target.checked
                            ? [...formData.paymentMethods, 'cash']
                            : formData.paymentMethods.filter(m => m !== 'cash');
                          setFormData({ ...formData, paymentMethods: methods });
                        }}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <label className="text-sm">{language === 'ar' ? 'دفع نقدي' : 'Cash Payment'}</label>
                    </div>
                  </div>
                </div>

                {/* Booking Type */}
                <div>
                  <label className="block text-sm font-medium mb-2">{language === 'ar' ? 'نوع الحجز' : 'Booking Type'}</label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="bookingType"
                        value="instant"
                        checked={formData.bookingType === 'instant'}
                        onChange={(e) => setFormData({ ...formData, bookingType: e.target.value })}
                        className="w-4 h-4"
                      />
                      <label className="text-sm">{language === 'ar' ? 'فوري' : 'Instant'}</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="bookingType"
                        value="request"
                        checked={formData.bookingType === 'request'}
                        onChange={(e) => setFormData({ ...formData, bookingType: e.target.value })}
                        className="w-4 h-4"
                      />
                      <label className="text-sm">{language === 'ar' ? 'بناءً على طلب' : 'On Request'}</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="bookingType"
                        value="both"
                        checked={formData.bookingType === 'both'}
                        onChange={(e) => setFormData({ ...formData, bookingType: e.target.value })}
                        className="w-4 h-4"
                      />
                      <label className="text-sm">{language === 'ar' ? 'كلاهما' : 'Both'}</label>
                    </div>
                  </div>
                </div>

                {/* Recurring & Urgent */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.allowRecurring}
                      onChange={(e) => setFormData({ ...formData, allowRecurring: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <label className="text-sm font-medium">{language === 'ar' ? 'السماح بالحجز المتكرر' : 'Allow Recurring'}</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.allowUrgent}
                      onChange={(e) => setFormData({ ...formData, allowUrgent: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <label className="text-sm font-medium">{language === 'ar' ? 'السماح بالخدمة المستعجلة' : 'Allow Urgent'}</label>
                  </div>
                </div>

                {/* Urgent Fee */}
                {formData.allowUrgent && (
                  <div>
                    <label className="block text-sm font-medium mb-2">{language === 'ar' ? 'رسوم الخدمة المستعجلة' : 'Urgent Service Fee'}</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.urgentFee}
                      onChange={(e) => setFormData({ ...formData, urgentFee: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                )}

                {/* Advance Booking */}
                <div>
                  <label className="block text-sm font-medium mb-2">{language === 'ar' ? 'الحد الأدنى للحجز المسبق (ساعات)' : 'Minimum Advance Booking (hours)'}</label>
                  <Input
                    type="number"
                    value={formData.minAdvanceHours}
                    onChange={(e) => setFormData({ ...formData, minAdvanceHours: e.target.value })}
                    placeholder="24"
                  />
                </div>

                {/* Cancellation Policy */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">{language === 'ar' ? 'سياسة الإلغاء' : 'Cancellation Policy'}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">{language === 'ar' ? 'ساعات الإلغاء المجاني' : 'Free Cancellation Hours'}</label>
                      <Input
                        type="number"
                        value={formData.freeCancellationHours}
                        onChange={(e) => setFormData({ ...formData, freeCancellationHours: e.target.value })}
                        placeholder="24"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">{language === 'ar' ? 'نوع الرسوم' : 'Fee Type'}</label>
                      <Select value={formData.cancellationType} onValueChange={(value) => setFormData({ ...formData, cancellationType: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">{language === 'ar' ? 'نسبة مئوية' : 'Percentage'}</SelectItem>
                          <SelectItem value="fixed">{language === 'ar' ? 'مبلغ ثابت' : 'Fixed Amount'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">{language === 'ar' ? 'قيمة الرسوم' : 'Fee Value'}</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.cancellationValue}
                      onChange={(e) => setFormData({ ...formData, cancellationValue: e.target.value })}
                      placeholder={formData.cancellationType === 'percentage' ? '20' : '10.00'}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4 rounded border-gray-300" />
                  <label className="text-sm font-medium">{language === 'ar' ? 'نشط' : 'Active'}</label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={actionLoading}>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button onClick={handleEditService} disabled={actionLoading}>
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

          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-5 h-5" />
                  {language === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}
                </DialogTitle>
                <DialogDescription>
                  {selectedServices.size > 0
                    ? language === 'ar'
                      ? `هل أنت متأكد من حذف ${selectedServices.size} خدمة؟ لا يمكن التراجع عن هذا الإجراء.`
                      : `Are you sure you want to delete ${selectedServices.size} service(s)? This action cannot be undone.`
                    : language === 'ar'
                      ? 'هل أنت متأكد من حذف هذه الخدمة؟ لا يمكن التراجع عن هذا الإجراء.'
                      : 'Are you sure you want to delete this service? This action cannot be undone.'
                  }
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={actionLoading}>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button variant="destructive" onClick={handleDeleteService} disabled={actionLoading}>
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
