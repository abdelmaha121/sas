'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import ProviderLayout from '@/components/provider/ProviderLayout';
import { api } from '@/lib/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  DollarSign,
  Clock,
  Tag,
  MoreVertical,
  CheckSquare,
  X,
  AlertTriangle,
  Save,
  Image as ImageIcon,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';

interface Service {
  id: string;
  category_id: string;
  category_name: string;
  category_name_ar: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  base_price: number;
  currency: string;
  currency_id?: string;
  duration_minutes: number | null;
  pricing_type: string;
  booking_type: 'instant' | 'request' | 'both';
  allow_recurring: boolean;
  allow_urgent: boolean;
  urgent_fee?: number;
  min_advance_hours: number;
  free_cancellation_hours: number;
  cancellation_type: 'percentage' | 'fixed';
  cancellation_value: number;
  images: string[] | null;
  availability?: any;
  payment_methods: string[];
  is_active: number;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  name_ar: string;
}

export default function ProviderServicesPage() {
  const { user } = useAuth();
  const { language } = useLanguage();

  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentService, setCurrentService] = useState<Service | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    categoryId: '',
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    basePrice: '',
    currency: 'SAR',
    currencyId: '',
    durationMinutes: '',
    pricingType: 'fixed',
    bookingType: 'both' as 'instant' | 'request' | 'both',
    allowRecurring: false,
    allowUrgent: false,
    urgentFee: '',
    minAdvanceHours: '24',
    freeCancellationHours: '24',
    cancellationType: 'percentage' as 'percentage' | 'fixed',
    cancellationValue: '20',
    availability: null as any,
    images: [] as string[],
    paymentMethods: ['instant'] as string[],
    isActive: true
  });

  useEffect(() => {
    if (user) {
      loadServices();
      loadCategories();
    }
  }, [user]);

  useEffect(() => {
    filterServicesList();
  }, [services, searchQuery, filterCategory, filterStatus]);

  const loadCategories = async () => {
    try {
      // يمكنك تعديل هذا لجلب التصنيفات من API مخصص
      const data = await api.get<{ categories: Category[] }>('/service-categories');
      setCategories(data.categories || []);
    } catch (error: any) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadServices = async () => {
    try {
      setLoading(true);
      const data = await api.get<{ services: Service[] }>('/provider/services?include_inactive=true');
      setServices(data.services);
      setMessage(null);
    } catch (error: any) {
      console.error('Failed to load services:', error);
      setMessage({ 
        type: 'error', 
        text: language === 'ar' ? 'فشل تحميل قائمة الخدمات' : 'Failed to load services list' 
      });
    } finally {
      setLoading(false);
    }
  };

  const filterServicesList = () => {
    let filtered = [...services];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (service) =>
          service.name.toLowerCase().includes(query) ||
          (service.name_ar && service.name_ar.toLowerCase().includes(query)) ||
          (service.description && service.description.toLowerCase().includes(query))
      );
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter((service) => service.category_id === filterCategory);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(
        (service) => service.is_active === (filterStatus === 'active' ? 1 : 0)
      );
    }

    setFilteredServices(filtered);
  };

  const handleAddService = async () => {
    if (!formData.categoryId || !formData.name.trim() || !formData.basePrice) {
      setMessage({
        type: 'error',
        text: language === 'ar' ? 'يرجى إدخال التصنيف والاسم والسعر' : 'Please enter category, name and price'
      });
      return;
    }

    // Validate ENUM values
    if (!['instant', 'request', 'both'].includes(formData.bookingType)) {
      setMessage({
        type: 'error',
        text: language === 'ar' ? 'نوع الحجز غير صحيح' : 'Invalid booking type'
      });
      return;
    }

    if (!['percentage', 'fixed'].includes(formData.cancellationType)) {
      setMessage({
        type: 'error',
        text: language === 'ar' ? 'نوع الإلغاء غير صحيح' : 'Invalid cancellation type'
      });
      return;
    }

    try {
      setActionLoading(true);
      await api.post('/provider/services', {
        categoryId: formData.categoryId,
        name: formData.name,
        nameAr: formData.nameAr || null,
        description: formData.description || null,
        descriptionAr: formData.descriptionAr || null,
        basePrice: parseFloat(formData.basePrice),
        currency: formData.currency,
        currencyId: formData.currencyId || null,
        durationMinutes: formData.durationMinutes ? parseInt(formData.durationMinutes) : null,
        pricingType: formData.pricingType,
        bookingType: formData.bookingType,
        allowRecurring: formData.allowRecurring,
        allowUrgent: formData.allowUrgent,
        urgentFee: formData.urgentFee ? parseFloat(formData.urgentFee) : null,
        minAdvanceHours: parseInt(formData.minAdvanceHours),
        freeCancellationHours: parseInt(formData.freeCancellationHours),
        cancellationType: formData.cancellationType,
        cancellationValue: parseFloat(formData.cancellationValue),
        availability: formData.availability,
        images: formData.images.length > 0 ? formData.images : null,
        paymentMethods: formData.paymentMethods,
        isActive: formData.isActive
      });

      setMessage({
        type: 'success',
        text: language === 'ar' ? 'تم إضافة الخدمة بنجاح' : 'Service added successfully'
      });
      setShowAddDialog(false);
      resetForm();
      await loadServices();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || (language === 'ar' ? 'فشل إضافة الخدمة' : 'Failed to add service')
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditService = async () => {
    if (!currentService) return;

    // Validate ENUM values
    if (!['instant', 'request', 'both'].includes(formData.bookingType)) {
      setMessage({
        type: 'error',
        text: language === 'ar' ? 'نوع الحجز غير صحيح' : 'Invalid booking type'
      });
      return;
    }

    if (!['percentage', 'fixed'].includes(formData.cancellationType)) {
      setMessage({
        type: 'error',
        text: language === 'ar' ? 'نوع الإلغاء غير صحيح' : 'Invalid cancellation type'
      });
      return;
    }

    try {
      setActionLoading(true);
      await api.put(`/provider/services/${currentService.id}`, {
        categoryId: formData.categoryId,
        name: formData.name,
        nameAr: formData.nameAr || null,
        description: formData.description || null,
        descriptionAr: formData.descriptionAr || null,
        basePrice: parseFloat(formData.basePrice),
        currency: formData.currency,
        currencyId: formData.currencyId || null,
        durationMinutes: formData.durationMinutes ? parseInt(formData.durationMinutes) : null,
        pricingType: formData.pricingType,
        bookingType: formData.bookingType,
        allowRecurring: formData.allowRecurring,
        allowUrgent: formData.allowUrgent,
        urgentFee: formData.urgentFee ? parseFloat(formData.urgentFee) : null,
        minAdvanceHours: parseInt(formData.minAdvanceHours),
        freeCancellationHours: parseInt(formData.freeCancellationHours),
        cancellationType: formData.cancellationType,
        cancellationValue: parseFloat(formData.cancellationValue),
        availability: formData.availability,
        images: formData.images.length > 0 ? formData.images : null,
        paymentMethods: formData.paymentMethods,
        isActive: formData.isActive
      });

      setMessage({
        type: 'success',
        text: language === 'ar' ? 'تم تحديث بيانات الخدمة بنجاح' : 'Service updated successfully'
      });
      setShowEditDialog(false);
      setCurrentService(null);
      resetForm();
      await loadServices();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || (language === 'ar' ? 'فشل تحديث البيانات' : 'Failed to update service')
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteServices = async () => {
    const idsToDelete = selectedServices.size > 0 
      ? Array.from(selectedServices) 
      : currentService ? [currentService.id] : [];

    if (idsToDelete.length === 0) return;

    try {
      setActionLoading(true);
      
      // حذف كل خدمة على حدة لأن الـ API يستخدم DELETE لخدمة واحدة
      for (const id of idsToDelete) {
        await api.delete(`/provider/services/${id}`);
      }
      
      setMessage({ 
        type: 'success', 
        text: language === 'ar' 
          ? `تم حذف ${idsToDelete.length} خدمة بنجاح` 
          : `Successfully deleted ${idsToDelete.length} service(s)` 
      });
      setShowDeleteDialog(false);
      setSelectedServices(new Set());
      setCurrentService(null);
      await loadServices();
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.message || (language === 'ar' ? 'فشل حذف الخدمات' : 'Failed to delete services') 
      });
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      categoryId: '',
      name: '',
      nameAr: '',
      description: '',
      descriptionAr: '',
      basePrice: '',
      currency: 'SAR',
      currencyId: '',
      durationMinutes: '',
      pricingType: 'fixed',
      bookingType: 'both' as 'instant' | 'request' | 'both',
      allowRecurring: false,
      allowUrgent: false,
      urgentFee: '',
      minAdvanceHours: '24',
      freeCancellationHours: '24',
      cancellationType: 'percentage' as 'percentage' | 'fixed',
      cancellationValue: '20',
      availability: null as any,
      images: [],
      paymentMethods: ['instant', 'cash_on_delivery'],
      isActive: true
    });
  };

  const openEditDialog = (service: Service) => {
    setCurrentService(service);
    setFormData({
      categoryId: service.category_id,
      name: service.name,
      nameAr: service.name_ar || '',
      description: service.description || '',
      descriptionAr: service.description_ar || '',
      basePrice: service.base_price.toString(),
      currency: service.currency || 'SAR',
      currencyId: service.currency_id || '',
      durationMinutes: service.duration_minutes?.toString() || '',
      pricingType: service.pricing_type || 'fixed',
      bookingType: service.booking_type || 'both',
      allowRecurring: service.allow_recurring || false,
      allowUrgent: service.allow_urgent || false,
      urgentFee: service.urgent_fee?.toString() || '',
      minAdvanceHours: service.min_advance_hours?.toString() || '24',
      freeCancellationHours: service.free_cancellation_hours?.toString() || '24',
      cancellationType: service.cancellation_type || 'percentage',
      cancellationValue: service.cancellation_value?.toString() || '20',
      availability: service.availability || null,
      images: service.images || [],
      paymentMethods: service.payment_methods || ['instant'],
      isActive: service.is_active === 1
    });
    setShowEditDialog(true);
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
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedServices(newSelected);
  };

  const getPricingTypeBadge = (type: string) => {
    const types: any = {
      fixed: { label: language === 'ar' ? 'ثابت' : 'Fixed', variant: 'default' },
      hourly: { label: language === 'ar' ? 'بالساعة' : 'Hourly', variant: 'secondary' },
      custom: { label: language === 'ar' ? 'مخصص' : 'Custom', variant: 'outline' }
    };
    return types[type] || { label: type, variant: 'secondary' };
  };

  if (loading) {
    return (
      <ProviderLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">
              {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </p>
          </div>
        </div>
      </ProviderLayout>
    );
  }

  return (
    <ProviderLayout>
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Package className="w-8 h-8" />
                {language === 'ar' ? 'إدارة الخدمات' : 'Services Management'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {language === 'ar' 
                  ? `إجمالي الخدمات: ${services.length}` 
                  : `Total Services: ${services.length}`}
              </p>
            </div>
            <Button onClick={() => { resetForm(); setShowAddDialog(true); }} size="lg">
              <Plus className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'إضافة خدمة جديدة' : 'Add New Service'}
            </Button>
          </div>

          {/* Messages */}
          {message && (
            <Alert className={`mb-6 ${message.type === 'error' ? 'border-destructive' : 'border-green-500'}`}>
              <AlertDescription className={message.type === 'error' ? 'text-destructive' : 'text-green-700'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          {/* Filters and Search */}
          <Card className="p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder={language === 'ar' ? 'بحث بالاسم أو الوصف...' : 'Search by name or description...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'ar' ? 'التصنيف' : 'Category'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'ar' ? 'جميع التصنيفات' : 'All Categories'}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {language === 'ar' ? cat.name_ar : cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'ar' ? 'الحالة' : 'Status'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'ar' ? 'جميع الحالات' : 'All Status'}</SelectItem>
                  <SelectItem value="active">{language === 'ar' ? 'نشط' : 'Active'}</SelectItem>
                  <SelectItem value="inactive">{language === 'ar' ? 'غير نشط' : 'Inactive'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedServices.size > 0 && (
              <div className="mt-4 flex items-center gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {language === 'ar' 
                    ? `حذف المحدد (${selectedServices.size})` 
                    : `Delete Selected (${selectedServices.size})`}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedServices(new Set())}
                >
                  <X className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'إلغاء التحديد' : 'Clear Selection'}
                </Button>
              </div>
            )}
          </Card>

          {/* Services List */}
          <div className="space-y-4">
            {filteredServices.length === 0 ? (
              <Card className="p-8 text-center">
                <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-lg">
                  {searchQuery || filterCategory !== 'all' || filterStatus !== 'all'
                    ? language === 'ar' ? 'لا توجد نتائج' : 'No results found'
                    : language === 'ar' ? 'لا يوجد خدمات حتى الآن' : 'No services yet'}
                </p>
                {!searchQuery && filterCategory === 'all' && filterStatus === 'all' && (
                  <Button onClick={() => { resetForm(); setShowAddDialog(true); }} className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    {language === 'ar' ? 'إضافة أول خدمة' : 'Add First Service'}
                  </Button>
                )}
              </Card>
            ) : (
              <>
                {filteredServices.length > 1 && (
                  <div className="flex items-center gap-2 px-4">
                    <button
                      onClick={toggleSelectAll}
                      className="flex items-center gap-2 p-2 hover:bg-accent rounded transition-colors"
                    >
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
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={selectedServices.has(service.id)}
                        onChange={() => toggleSelect(service.id)}
                        className="mt-1 w-5 h-5 rounded border-gray-300 cursor-pointer"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <h3 className="text-lg font-semibold">
                                {language === 'ar' && service.name_ar ? service.name_ar : service.name}
                              </h3>
                              <Badge variant="outline">
                                <Tag className="w-3 h-3 mr-1" />
                                {language === 'ar' ? service.category_name_ar : service.category_name}
                              </Badge>
                              <Badge variant={getPricingTypeBadge(service.pricing_type).variant as any}>
                                {getPricingTypeBadge(service.pricing_type).label}
                              </Badge>
                              {service.is_active ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  <Eye className="w-3 h-3 mr-1" />
                                  {language === 'ar' ? 'نشط' : 'Active'}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                  <EyeOff className="w-3 h-3 mr-1" />
                                  {language === 'ar' ? 'غير نشط' : 'Inactive'}
                                </Badge>
                              )}
                            </div>

                            {(service.description || service.description_ar) && (
                              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                {language === 'ar' && service.description_ar ? service.description_ar : service.description}
                              </p>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                <span className="font-medium" dir="ltr">
                                  {service.base_price} {service.currency}
                                </span>
                              </div>
                              {service.duration_minutes && (
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                  <span>
                                    {service.duration_minutes} {language === 'ar' ? 'دقيقة' : 'min'}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {service.booking_type === 'instant' ? (language === 'ar' ? 'فوري' : 'Instant') :
                                   service.booking_type === 'request' ? (language === 'ar' ? 'طلب' : 'Request') :
                                   (language === 'ar' ? 'كلاهما' : 'Both')}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                {service.allow_recurring && (
                                  <Badge variant="secondary" className="text-xs">
                                    {language === 'ar' ? 'متكرر' : 'Recurring'}
                                  </Badge>
                                )}
                                {service.allow_urgent && (
                                  <Badge variant="destructive" className="text-xs">
                                    {language === 'ar' ? 'عاجل' : 'Urgent'}
                                  </Badge>
                                )}
                                {service.payment_methods && service.payment_methods.length > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    {service.payment_methods.length} {language === 'ar' ? 'دفع' : 'pay'}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(service)}>
                                <Edit className="w-4 h-4 mr-2" />
                                {language === 'ar' ? 'تعديل' : 'Edit'}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setCurrentService(service);
                                  setShowDeleteDialog(true);
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {language === 'ar' ? 'حذف' : 'Delete'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </>
            )}
          </div>

          {/* Add Service Dialog */}
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {language === 'ar' ? 'إضافة خدمة جديدة' : 'Add New Service'}
                </DialogTitle>
                <DialogDescription>
                  {language === 'ar' 
                    ? 'أدخل معلومات الخدمة الجديدة' 
                    : 'Enter new service information'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ar' ? 'التصنيف' : 'Category'}
                      <span className="text-destructive ml-1">*</span>
                    </label>
                    <Select value={formData.categoryId} onValueChange={(value) => setFormData({...formData, categoryId: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'ar' ? 'اختر التصنيف' : 'Select category'} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {language === 'ar' ? cat.name_ar : cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ar' ? 'نوع التسعير' : 'Pricing Type'}
                    </label>
                    <Select value={formData.pricingType} onValueChange={(value) => setFormData({...formData, pricingType: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">{language === 'ar' ? 'ثابت' : 'Fixed'}</SelectItem>
                        <SelectItem value="hourly">{language === 'ar' ? 'بالساعة' : 'Hourly'}</SelectItem>
                        <SelectItem value="custom">{language === 'ar' ? 'مخصص' : 'Custom'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ar' ? 'اسم الخدمة (إنجليزي)' : 'Service Name (English)'}
                      <span className="text-destructive ml-1">*</span>
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder={language === 'ar' ? 'أدخل اسم الخدمة' : 'Enter service name'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ar' ? 'اسم الخدمة (عربي)' : 'Service Name (Arabic)'}
                    </label>
                    <Input
                      value={formData.nameAr}
                      onChange={(e) => setFormData({...formData, nameAr: e.target.value})}
                      placeholder={language === 'ar' ? 'أدخل اسم الخدمة بالعربي' : 'Enter Arabic name'}
                      dir="rtl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ar' ? 'الوصف (إنجليزي)' : 'Description (English)'}
                    </label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder={language === 'ar' ? 'أدخل وصف الخدمة' : 'Enter service description'}
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ar' ? 'الوصف (عربي)' : 'Description (Arabic)'}
                    </label>
                    <Textarea
                      value={formData.descriptionAr}
                      onChange={(e) => setFormData({...formData, descriptionAr: e.target.value})}
                      placeholder={language === 'ar' ? 'أدخل الوصف بالعربي' : 'Enter Arabic description'}
                      rows={3}
                      dir="rtl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ar' ? 'السعر الأساسي' : 'Base Price'}
                      <span className="text-destructive ml-1">*</span>
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.basePrice}
                      onChange={(e) => setFormData({...formData, basePrice: e.target.value})}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ar' ? 'العملة' : 'Currency'}
                    </label>
                    <Select value={formData.currency} onValueChange={(value) => setFormData({...formData, currency: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SAR">SAR - {language === 'ar' ? 'ريال سعودي' : 'Saudi Riyal'}</SelectItem>
                        <SelectItem value="USD">USD - {language === 'ar' ? 'دولار أمريكي' : 'US Dollar'}</SelectItem>
                        <SelectItem value="EUR">EUR - {language === 'ar' ? 'يورو' : 'Euro'}</SelectItem>
                        <SelectItem value="AED">AED - {language === 'ar' ? 'درهم إماراتي' : 'UAE Dirham'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ar' ? 'المدة (دقيقة)' : 'Duration (minutes)'}
                    </label>
                    <Input
                      type="number"
                      value={formData.durationMinutes}
                      onChange={(e) => setFormData({...formData, durationMinutes: e.target.value})}
                      placeholder={language === 'ar' ? 'مثال: 60' : 'e.g., 60'}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ar' ? 'نوع الحجز' : 'Booking Type'}
                    </label>
                    <Select value={formData.bookingType} onValueChange={(value: 'instant' | 'request' | 'both') => setFormData({...formData, bookingType: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instant">{language === 'ar' ? 'فوري' : 'Instant'}</SelectItem>
                        <SelectItem value="request">{language === 'ar' ? 'طلب' : 'Request'}</SelectItem>
                        <SelectItem value="both">{language === 'ar' ? 'كلاهما' : 'Both'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ar' ? 'رسوم الخدمة العاجلة' : 'Urgent Service Fee'}
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.urgentFee}
                      onChange={(e) => setFormData({...formData, urgentFee: e.target.value})}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ar' ? 'نوع الإلغاء' : 'Cancellation Type'}
                    </label>
                    <Select value={formData.cancellationType} onValueChange={(value: 'percentage' | 'fixed') => setFormData({...formData, cancellationType: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">{language === 'ar' ? 'نسبة مئوية' : 'Percentage'}</SelectItem>
                        <SelectItem value="fixed">{language === 'ar' ? 'مبلغ ثابت' : 'Fixed Amount'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ar' ? 'قيمة الإلغاء' : 'Cancellation Value'}
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.cancellationValue}
                      onChange={(e) => setFormData({...formData, cancellationValue: e.target.value})}
                      placeholder={formData.cancellationType === 'percentage' ? '20' : '50.00'}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ar' ? 'الحد الأدنى للتقدم (ساعات)' : 'Minimum Advance Hours'}
                    </label>
                    <Input
                      type="number"
                      value={formData.minAdvanceHours}
                      onChange={(e) => setFormData({...formData, minAdvanceHours: e.target.value})}
                      placeholder="24"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ar' ? 'ساعات الإلغاء المجاني' : 'Free Cancellation Hours'}
                    </label>
                    <Input
                      type="number"
                      value={formData.freeCancellationHours}
                      onChange={(e) => setFormData({...formData, freeCancellationHours: e.target.value})}
                      placeholder="24"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'التوفر (JSON)' : 'Availability (JSON)'}
                  </label>
                  <Textarea
                    value={formData.availability ? JSON.stringify(formData.availability, null, 2) : ''}
                    onChange={(e) => {
                      try {
                        const parsed = e.target.value ? JSON.parse(e.target.value) : null;
                        setFormData({...formData, availability: parsed});
                      } catch (error) {
                        // Allow invalid JSON temporarily
                        setFormData({...formData, availability: e.target.value});
                      }
                    }}
                    placeholder={language === 'ar' ? 'مثال: {"monday": ["09:00-17:00"]}' : 'e.g., {"monday": ["09:00-17:00"]}'}
                    rows={3}
                  />
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ar' ? 'طرق الدفع' : 'Payment Methods'}
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="payment_instant"
                          checked={formData.paymentMethods.includes('instant')}
                          onChange={(e) => {
                            const methods = e.target.checked
                              ? [...formData.paymentMethods, 'instant']
                              : formData.paymentMethods.filter(m => m !== 'instant');
                            setFormData({...formData, paymentMethods: methods});
                          }}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                        <label htmlFor="payment_instant" className="text-sm cursor-pointer">
                          {language === 'ar' ? 'الدفع الفوري' : 'Instant Payment'}
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="payment_cod"
                          checked={formData.paymentMethods.includes('cash_on_delivery')}
                          onChange={(e) => {
                            const methods = e.target.checked
                              ? [...formData.paymentMethods, 'cash_on_delivery']
                              : formData.paymentMethods.filter(m => m !== 'cash_on_delivery');
                            setFormData({...formData, paymentMethods: methods});
                          }}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                        <label htmlFor="payment_cod" className="text-sm cursor-pointer">
                          {language === 'ar' ? 'الدفع عند التسليم' : 'Cash on Delivery'}
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium cursor-pointer">
                      {language === 'ar' ? 'تفعيل الخدمة' : 'Activate Service'}
                    </label>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowAddDialog(false)}
                  disabled={actionLoading}
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button onClick={handleAddService} disabled={actionLoading}>
                  {actionLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {language === 'ar' ? 'جاري الإضافة...' : 'Adding...'}
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      {language === 'ar' ? 'إضافة' : 'Add'}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Service Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {language === 'ar' ? 'تعديل بيانات الخدمة' : 'Edit Service'}
                </DialogTitle>
                <DialogDescription>
                  {language === 'ar' 
                    ? 'قم بتحديث معلومات الخدمة' 
                    : 'Update service information'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ar' ? 'التصنيف' : 'Category'}
                      <span className="text-destructive ml-1">*</span>
                    </label>
                    <Select value={formData.categoryId} onValueChange={(value) => setFormData({...formData, categoryId: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'ar' ? 'اختر التصنيف' : 'Select category'} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {language === 'ar' ? cat.name_ar : cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ar' ? 'نوع التسعير' : 'Pricing Type'}
                    </label>
                    <Select value={formData.pricingType} onValueChange={(value) => setFormData({...formData, pricingType: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">{language === 'ar' ? 'ثابت' : 'Fixed'}</SelectItem>
                        <SelectItem value="hourly">{language === 'ar' ? 'بالساعة' : 'Hourly'}</SelectItem>
                        <SelectItem value="custom">{language === 'ar' ? 'مخصص' : 'Custom'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ar' ? 'اسم الخدمة (إنجليزي)' : 'Service Name (English)'}
                      <span className="text-destructive ml-1">*</span>
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder={language === 'ar' ? 'أدخل اسم الخدمة' : 'Enter service name'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ar' ? 'اسم الخدمة (عربي)' : 'Service Name (Arabic)'}
                    </label>
                    <Input
                      value={formData.nameAr}
                      onChange={(e) => setFormData({...formData, nameAr: e.target.value})}
                      placeholder={language === 'ar' ? 'أدخل اسم الخدمة بالعربي' : 'Enter Arabic name'}
                      dir="rtl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ar' ? 'الوصف (إنجليزي)' : 'Description (English)'}
                    </label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder={language === 'ar' ? 'أدخل وصف الخدمة' : 'Enter service description'}
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ar' ? 'الوصف (عربي)' : 'Description (Arabic)'}
                    </label>
                    <Textarea
                      value={formData.descriptionAr}
                      onChange={(e) => setFormData({...formData, descriptionAr: e.target.value})}
                      placeholder={language === 'ar' ? 'أدخل الوصف بالعربي' : 'Enter Arabic description'}
                      rows={3}
                      dir="rtl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ar' ? 'السعر الأساسي' : 'Base Price'}
                      <span className="text-destructive ml-1">*</span>
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.basePrice}
                      onChange={(e) => setFormData({...formData, basePrice: e.target.value})}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ar' ? 'العملة' : 'Currency'}
                    </label>
                    <Select value={formData.currency} onValueChange={(value) => setFormData({...formData, currency: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SAR">SAR - {language === 'ar' ? 'ريال سعودي' : 'Saudi Riyal'}</SelectItem>
                        <SelectItem value="USD">USD - {language === 'ar' ? 'دولار أمريكي' : 'US Dollar'}</SelectItem>
                        <SelectItem value="EUR">EUR - {language === 'ar' ? 'يورو' : 'Euro'}</SelectItem>
                        <SelectItem value="AED">AED - {language === 'ar' ? 'درهم إماراتي' : 'UAE Dirham'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ar' ? 'المدة (دقيقة)' : 'Duration (minutes)'}
                    </label>
                    <Input
                      type="number"
                      value={formData.durationMinutes}
                      onChange={(e) => setFormData({...formData, durationMinutes: e.target.value})}
                      placeholder={language === 'ar' ? 'مثال: 60' : 'e.g., 60'}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ar' ? 'نوع الحجز' : 'Booking Type'}
                    </label>
                    <Select value={formData.bookingType} onValueChange={(value: 'instant' | 'request' | 'both') => setFormData({...formData, bookingType: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instant">{language === 'ar' ? 'فوري' : 'Instant'}</SelectItem>
                        <SelectItem value="request">{language === 'ar' ? 'طلب' : 'Request'}</SelectItem>
                        <SelectItem value="both">{language === 'ar' ? 'كلاهما' : 'Both'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ar' ? 'رسوم الخدمة العاجلة' : 'Urgent Service Fee'}
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.urgentFee}
                      onChange={(e) => setFormData({...formData, urgentFee: e.target.value})}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ar' ? 'نوع الإلغاء' : 'Cancellation Type'}
                    </label>
                    <Select value={formData.cancellationType} onValueChange={(value: 'percentage' | 'fixed') => setFormData({...formData, cancellationType: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">{language === 'ar' ? 'نسبة مئوية' : 'Percentage'}</SelectItem>
                        <SelectItem value="fixed">{language === 'ar' ? 'مبلغ ثابت' : 'Fixed Amount'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ar' ? 'قيمة الإلغاء' : 'Cancellation Value'}
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.cancellationValue}
                      onChange={(e) => setFormData({...formData, cancellationValue: e.target.value})}
                      placeholder={formData.cancellationType === 'percentage' ? '20' : '50.00'}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ar' ? 'الحد الأدنى للتقدم (ساعات)' : 'Minimum Advance Hours'}
                    </label>
                    <Input
                      type="number"
                      value={formData.minAdvanceHours}
                      onChange={(e) => setFormData({...formData, minAdvanceHours: e.target.value})}
                      placeholder="24"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ar' ? 'ساعات الإلغاء المجاني' : 'Free Cancellation Hours'}
                    </label>
                    <Input
                      type="number"
                      value={formData.freeCancellationHours}
                      onChange={(e) => setFormData({...formData, freeCancellationHours: e.target.value})}
                      placeholder="24"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'التوفر (JSON)' : 'Availability (JSON)'}
                  </label>
                  <Textarea
                    value={formData.availability ? JSON.stringify(formData.availability, null, 2) : ''}
                    onChange={(e) => {
                      try {
                        const parsed = e.target.value ? JSON.parse(e.target.value) : null;
                        setFormData({...formData, availability: parsed});
                      } catch (error) {
                        // Allow invalid JSON temporarily
                        setFormData({...formData, availability: e.target.value});
                      }
                    }}
                    placeholder={language === 'ar' ? 'مثال: {"monday": ["09:00-17:00"]}' : 'e.g., {"monday": ["09:00-17:00"]}'}
                    rows={3}
                  />
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ar' ? 'طرق الدفع' : 'Payment Methods'}
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="edit_payment_instant"
                          checked={formData.paymentMethods.includes('instant')}
                          onChange={(e) => {
                            const methods = e.target.checked
                              ? [...formData.paymentMethods, 'instant']
                              : formData.paymentMethods.filter(m => m !== 'instant');
                            setFormData({...formData, paymentMethods: methods});
                          }}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                        <label htmlFor="edit_payment_instant" className="text-sm cursor-pointer">
                          {language === 'ar' ? 'الدفع الفوري' : 'Instant Payment'}
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="edit_payment_cod"
                          checked={formData.paymentMethods.includes('cash_on_delivery')}
                          onChange={(e) => {
                            const methods = e.target.checked
                              ? [...formData.paymentMethods, 'cash_on_delivery']
                              : formData.paymentMethods.filter(m => m !== 'cash_on_delivery');
                            setFormData({...formData, paymentMethods: methods});
                          }}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                        <label htmlFor="edit_payment_cod" className="text-sm cursor-pointer">
                          {language === 'ar' ? 'الدفع عند التسليم' : 'Cash on Delivery'}
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="editIsActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <label htmlFor="editIsActive" className="text-sm font-medium cursor-pointer">
                      {language === 'ar' ? 'تفعيل الخدمة' : 'Activate Service'}
                    </label>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                  disabled={actionLoading}
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button onClick={handleEditService} disabled={actionLoading}>
                  {actionLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {language === 'ar' ? 'جاري التحديث...' : 'Updating...'}
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

          {/* Delete Confirmation Dialog */}
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-5 h-5" />
                  {language === 'ar' ? 'تأكيد الحذف' : 'Confirm Deletion'}
                </DialogTitle>
                <DialogDescription>
                  {selectedServices.size > 0 
                    ? language === 'ar' 
                      ? `هل أنت متأكد من حذف ${selectedServices.size} خدمة؟ هذا الإجراء لا يمكن التراجع عنه.`
                      : `Are you sure you want to delete ${selectedServices.size} service(s)? This action cannot be undone.`
                    : language === 'ar'
                      ? 'هل أنت متأكد من حذف هذه الخدمة؟ هذا الإجراء لا يمكن التراجع عنه.'
                      : 'Are you sure you want to delete this service? This action cannot be undone.'}
                </DialogDescription>
              </DialogHeader>

              {currentService && selectedServices.size === 0 && (
                <div className="bg-muted p-3 rounded-md">
                  <p className="font-medium">
                    {language === 'ar' && currentService.name_ar ? currentService.name_ar : currentService.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? currentService.category_name_ar : currentService.category_name}
                  </p>
                </div>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(false)}
                  disabled={actionLoading}
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteServices}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {language === 'ar' ? 'جاري الحذف...' : 'Deleting...'}
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
    </ProviderLayout>
  );
}