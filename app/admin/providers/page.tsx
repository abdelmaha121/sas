'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import AdminLayout from '@/components/admin/AdminLayout';
import { api } from '@/lib/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Store,
  Plus,
  Search,
  Trash2,
  Edit,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  Clock,
  CheckSquare,
  X,
  AlertTriangle,
  Save,
  Star,
  TrendingUp,
  Building,
  User,
  MoreVertical,
  UserX,
  UserCheck,
  Shield
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Provider {
  id: string;
  user_id: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  business_name: string;
  business_name_ar: string | null;
  description: string | null;
  verification_status: 'pending' | 'approved' | 'rejected';
  commission_rate: number;
  is_active: number;
  featured: number;
  main_activity: string | null;
  created_at: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ProviderUser {
  id: string;
  name: string;
  email: string;
}

export default function AdminProvidersPage() {
  const { user } = useAuth();
  const { language } = useLanguage();

  const [providers, setProviders] = useState<Provider[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProviders, setSelectedProviders] = useState<Set<string>>(new Set());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentProvider, setCurrentProvider] = useState<Provider | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterVerification, setFilterVerification] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [deleteMode, setDeleteMode] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<'suspend' | 'ban' | 'disable' | 'enable' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionDuration, setActionDuration] = useState('');
  const [providerUsers, setProviderUsers] = useState<ProviderUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [formData, setFormData] = useState({
    userId: '',
    businessName: '',
    businessNameAr: '',
    description: '',
    commissionRate: '15.00',
    verificationStatus: 'pending' as 'pending' | 'approved' | 'rejected',
    isActive: true,
    featured: false,
    mainActivity: ''
  });

  useEffect(() => {
    if (user) {
      loadProviders();
    }
  }, [user, pagination.page, pagination.limit, searchQuery, filterStatus, filterVerification]);

  const loadProviders = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (searchQuery) params.append('search', searchQuery);
      if (filterStatus && filterStatus !== 'all') params.append('status', filterStatus);
      if (filterVerification && filterVerification !== 'all') params.append('verification', filterVerification);

      const data = await api.get<{ providers: Provider[], pagination: PaginationInfo }>(
        `/admin/providers?${params.toString()}`
      );

      setProviders(data.providers);
      setPagination(data.pagination);
      setMessage(null);
    } catch (error: any) {
      console.error('Failed to load providers:', error);
      setMessage({
        type: 'error',
        text: language === 'ar' ? 'فشل تحميل قائمة مقدمي الخدمات' : 'Failed to load providers list'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProviderUsers = async () => {
    try {
      setLoadingUsers(true);
      const data = await api.get<{ users: ProviderUser[] }>(
        '/admin/providers/available-users'
      );
      setProviderUsers(data.users);
    } catch (error) {
      console.error('Failed to load provider users', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleAddProvider = async () => {
    if (!formData.userId.trim() || !formData.businessName.trim()) {
      setMessage({
        type: 'error',
        text: language === 'ar' ? 'يرجى إدخال معرف المستخدم واسم العمل' : 'Please enter user ID and business name'
      });
      return;
    }

    try {
      setActionLoading(true);
      await api.post('/admin/providers', {
        userId: formData.userId,
        businessName: formData.businessName,
        businessNameAr: formData.businessNameAr || null,
        description: formData.description || null,
        commissionRate: parseFloat(formData.commissionRate),
        mainActivity: formData.mainActivity || null
      });

      setMessage({
        type: 'success',
        text: language === 'ar' ? 'تم إضافة مقدم الخدمة بنجاح' : 'Provider added successfully'
      });
      setShowAddDialog(false);
      resetForm();
      await loadProviders();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || (language === 'ar' ? 'فشل إضافة مقدم الخدمة' : 'Failed to add provider')
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditProvider = async () => {
    if (!currentProvider) return;

    try {
      setActionLoading(true);
      await api.put(`/admin/providers/${currentProvider.id}`, {
        businessName: formData.businessName,
        businessNameAr: formData.businessNameAr || null,
        description: formData.description || null,
        verificationStatus: formData.verificationStatus,
        commissionRate: parseFloat(formData.commissionRate),
        isActive: formData.isActive ? 1 : 0,
        featured: formData.featured ? 1 : 0
      });

      setMessage({
        type: 'success',
        text: language === 'ar' ? 'تم تحديث بيانات مقدم الخدمة بنجاح' : 'Provider updated successfully'
      });
      setShowEditDialog(false);
      setCurrentProvider(null);
      resetForm();
      await loadProviders();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || (language === 'ar' ? 'فشل تحديث البيانات' : 'Failed to update provider')
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleProviderAction = async () => {
    if (!currentProvider || !actionType || !actionReason.trim()) return;

    try {
      setActionLoading(true);
      const actionData = {
        actionType,
        reason: actionReason,
        duration: actionDuration ? parseInt(actionDuration) : null,
        targetProviderId: currentProvider.id,
        targetProviderName: currentProvider.business_name,
        adminUserId: user?.id,
        adminUserName: user?.email
      };

      await api.post('/admin/providers/actions', actionData);

      setMessage({
        type: 'success',
        text: language === 'ar'
          ? `تم ${actionType === 'suspend' ? 'تعليق' : actionType === 'ban' ? 'حظر' : actionType === 'disable' ? 'تعطيل' : 'تفعيل'} مقدم الخدمة بنجاح`
          : `Provider ${actionType}d successfully`
      });
      setShowActionDialog(false);
      setActionType(null);
      setActionReason('');
      setActionDuration('');
      setCurrentProvider(null);
      await loadProviders();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || (language === 'ar' ? 'فشل تنفيذ الإجراء' : 'Failed to execute action')
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProvider = async () => {
    const idsToDelete = selectedProviders.size > 0
      ? Array.from(selectedProviders)
      : currentProvider ? [currentProvider.id] : [];

    if (idsToDelete.length === 0) return;

    try {
      setActionLoading(true);

      for (const id of idsToDelete) {
        await api.delete(`/admin/providers/${id}`);
      }

      setMessage({
        type: 'success',
        text: language === 'ar'
          ? `تم حذف ${idsToDelete.length} مقدم خدمة بنجاح`
          : `Successfully deleted ${idsToDelete.length} provider(s)`
      });
      setShowDeleteDialog(false);
      setSelectedProviders(new Set());
      setCurrentProvider(null);
      setDeleteMode(false);
      await loadProviders();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || (language === 'ar' ? 'فشل حذف مقدمي الخدمات' : 'Failed to delete providers')
      });
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      userId: '',
      businessName: '',
      businessNameAr: '',
      description: '',
      commissionRate: '15.00',
      verificationStatus: 'pending',
      isActive: true,
      featured: false,
      mainActivity: ''
    });
  };

  const openEditDialog = (provider: Provider) => {
    setCurrentProvider(provider);
    setFormData({
      userId: provider.user_id,
      businessName: provider.business_name,
      businessNameAr: provider.business_name_ar || '',
      description: provider.description || '',
      commissionRate: provider.commission_rate.toString(),
      verificationStatus: provider.verification_status,
      isActive: provider.is_active === 1,
      featured: provider.featured === 1,
      mainActivity: provider.main_activity || ''
    });
    setShowEditDialog(true);
  };

  const toggleSelectAll = () => {
    if (selectedProviders.size === providers.length) {
      setSelectedProviders(new Set());
    } else {
      setSelectedProviders(new Set(providers.map(p => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedProviders);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedProviders(newSelected);
  };

  const getVerificationBadge = (status: string) => {
    const statuses: any = {
      approved: {
        label: language === 'ar' ? 'موثق' : 'Approved',
        className: 'bg-green-50 text-green-700 border-green-200'
      },
      pending: {
        label: language === 'ar' ? 'قيد المراجعة' : 'Pending',
        className: 'bg-yellow-50 text-yellow-700 border-yellow-200'
      },
      rejected: {
        label: language === 'ar' ? 'مرفوض' : 'Rejected',
        className: 'bg-red-50 text-red-700 border-red-200'
      }
    };
    return statuses[status] || statuses.pending;
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const enableDeleteMode = () => {
    setDeleteMode(true);
    setSelectedProviders(new Set());
  };

  const cancelDeleteMode = () => {
    setDeleteMode(false);
    setSelectedProviders(new Set());
  };

  if (loading && providers.length === 0) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">
              {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Store className="w-8 h-8" />
                {language === 'ar' ? 'إدارة مقدمي الخدمات' : 'Providers Management'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {language === 'ar'
                  ? `إجمالي مقدمي الخدمات: ${pagination.total}`
                  : `Total Providers: ${pagination.total}`}
              </p>
            </div>
            <Button onClick={() => { resetForm(); loadProviderUsers(); setShowAddDialog(true); }} size="lg">
              <Plus className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'إضافة مقدم خدمة جديد' : 'Add New Provider'}
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
                    placeholder={language === 'ar' ? 'بحث بالاسم، البريد أو الهاتف...' : 'Search by name, email or phone...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={filterVerification} onValueChange={setFilterVerification}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'ar' ? 'حالة التوثيق' : 'Verification'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'ar' ? 'جميع الحالات' : 'All Status'}</SelectItem>
                  <SelectItem value="approved">{language === 'ar' ? 'موثق' : 'Approved'}</SelectItem>
                  <SelectItem value="pending">{language === 'ar' ? 'قيد المراجعة' : 'Pending'}</SelectItem>
                  <SelectItem value="rejected">{language === 'ar' ? 'مرفوض' : 'Rejected'}</SelectItem>
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

            {deleteMode && (
              <div className="mt-4 flex items-center gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={selectedProviders.size === 0}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {language === 'ar'
                    ? `حذف المحدد (${selectedProviders.size})`
                    : `Delete Selected (${selectedProviders.size})`}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelDeleteMode}
                >
                  <X className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
              </div>
            )}

            {!deleteMode && providers.length > 1 && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={enableDeleteMode}
                >
                  <CheckSquare className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'حذف متعدد' : 'Multi Delete'}
                </Button>
              </div>
            )}
          </Card>

          {/* Providers List */}
          <div className="space-y-4">
            {/* Table Header - Sticky */}
            {providers.length > 0 && (
              <div className="sticky top-0 z-10 bg-background">
                <Card className="p-4 shadow-sm border-b-2">
                  <div className="flex items-center gap-4">
                    {deleteMode && (
                      <div className="w-5 h-5 flex-shrink-0"></div>
                    )}

                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="flex-shrink-0 min-w-[200px]">
                        <span className="text-sm font-semibold text-muted-foreground">
                          {language === 'ar' ? 'اسم العمل' : 'Business Name'}
                        </span>
                      </div>

                      <div className="flex-shrink-0 min-w-[120px]">
                        <span className="text-sm font-semibold text-muted-foreground">
                          {language === 'ar' ? 'المالك' : 'Owner'}
                        </span>
                      </div>

                      <div className="flex-shrink-0 min-w-[100px]">
                        <span className="text-sm font-semibold text-muted-foreground">
                          {language === 'ar' ? 'التوثيق' : 'Verification'}
                        </span>
                      </div>

                      <div className="flex-shrink-0 min-w-[80px]">
                        <span className="text-sm font-semibold text-muted-foreground">
                          {language === 'ar' ? 'الحالة' : 'Status'}
                        </span>
                      </div>

                      <div className="flex-shrink-0 min-w-[200px]">
                        <span className="text-sm font-semibold text-muted-foreground">
                          {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                        </span>
                      </div>

                      <div className="flex-shrink-0 min-w-[100px]">
                        <span className="text-sm font-semibold text-muted-foreground">
                          {language === 'ar' ? 'العمولة' : 'Commission'}
                        </span>
                      </div>
                    </div>

                    {!deleteMode && (
                      <div className="flex-shrink-0 min-w-[80px] text-center">
                        <span className="text-sm font-semibold text-muted-foreground">
                          {language === 'ar' ? 'الإجراءات' : 'Actions'}
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            )}

            {providers.length === 0 ? (
              <Card className="p-8 text-center">
                <Store className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-lg">
                  {searchQuery || filterStatus !== 'all' || filterVerification !== 'all'
                    ? language === 'ar' ? 'لا توجد نتائج' : 'No results found'
                    : language === 'ar' ? 'لا يوجد مقدمو خدمات حتى الآن' : 'No providers yet'}
                </p>
                {!searchQuery && filterStatus === 'all' && filterVerification === 'all' && (
                  <Button onClick={() => { resetForm(); loadProviderUsers(); setShowAddDialog(true); }} className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    {language === 'ar' ? 'إضافة أول مقدم خدمة' : 'Add First Provider'}
                  </Button>
                )}
              </Card>
            ) : (
              <>
                {deleteMode && (
                  <div className="flex items-center gap-2 px-4">
                    <button
                      onClick={toggleSelectAll}
                      className="flex items-center gap-2 p-2 hover:bg-accent rounded transition-colors"
                    >
                      <CheckSquare className="w-5 h-5" />
                      <span className="text-sm font-medium">
                        {selectedProviders.size === providers.length
                          ? language === 'ar' ? 'إلغاء تحديد الكل' : 'Deselect All'
                          : language === 'ar' ? 'تحديد الكل' : 'Select All'}
                      </span>
                    </button>
                  </div>
                )}

                {providers.map((provider) => {
                  const verificationBadge = getVerificationBadge(provider.verification_status);

                  return (
                    <Card key={provider.id} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        {deleteMode && (
                          <input
                            type="checkbox"
                            checked={selectedProviders.has(provider.id)}
                            onChange={() => toggleSelect(provider.id)}
                            className="w-5 h-5 rounded border-gray-300 cursor-pointer flex-shrink-0"
                          />
                        )}

                        <div className="flex items-center gap-4 flex-1 min-w-0 overflow-x-auto">
                          {/* Business Name */}
                          <div className="flex-shrink-0 min-w-[200px]">
                            <div className="flex items-center gap-2">
                              <Building className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              <div>
                                <h3 className="text-base font-semibold whitespace-nowrap">
                                  {provider.business_name}
                                </h3>
                                {provider.business_name_ar && (
                                  <p className="text-xs text-muted-foreground">
                                    {provider.business_name_ar}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Owner */}
                          <div className="flex-shrink-0 min-w-[120px]">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm whitespace-nowrap">
                                {provider.first_name} {provider.last_name}
                              </span>
                            </div>
                          </div>

                          {/* Verification Badge */}
                          <div className="flex-shrink-0 min-w-[100px]">
                            <Badge variant="outline" className={verificationBadge.className}>
                              {provider.verification_status === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
                              {provider.verification_status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                              {provider.verification_status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                              {verificationBadge.label}
                            </Badge>
                          </div>

                          {/* Status Badge */}
                          <div className="flex-shrink-0 min-w-[80px]">
                            {provider.is_active ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                {language === 'ar' ? 'نشط' : 'Active'}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                                {language === 'ar' ? 'غير نشط' : 'Inactive'}
                              </Badge>
                            )}
                            {provider.featured === 1 && (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 mt-1">
                                <Star className="w-3 h-3 mr-1" />
                                {language === 'ar' ? 'مميز' : 'Featured'}
                              </Badge>
                            )}
                          </div>

                          {/* Email */}
                          <div className="flex items-center gap-2 flex-shrink-0 min-w-[200px]">
                            <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm text-muted-foreground truncate">{provider.email}</span>
                          </div>


                          {/* Commission */}
                          <div className="flex items-center gap-2 flex-shrink-0 min-w-[100px]">
                            <TrendingUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm font-medium">{provider.commission_rate}%</span>
                          </div>
                        </div>

                      {/* Action Buttons */}
                        {!deleteMode && (
                          <div className="flex items-center gap-2 flex-shrink-0 min-w-[120px] justify-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditDialog(provider)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  {language === 'ar' ? 'تعديل' : 'Edit'}
                                </DropdownMenuItem>
                                {provider.is_active ? (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setCurrentProvider(provider);
                                        setActionType('suspend');
                                        setShowActionDialog(true);
                                      }}
                                    >
                                      <UserX className="w-4 h-4 mr-2" />
                                      {language === 'ar' ? 'تعليق' : 'Suspend'}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setCurrentProvider(provider);
                                        setActionType('ban');
                                        setShowActionDialog(true);
                                      }}
                                    >
                                      <Shield className="w-4 h-4 mr-2" />
                                      {language === 'ar' ? 'حظر' : 'Ban'}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setCurrentProvider(provider);
                                        setActionType('disable');
                                        setShowActionDialog(true);
                                      }}
                                    >
                                      <UserX className="w-4 h-4 mr-2" />
                                      {language === 'ar' ? 'تعطيل' : 'Disable'}
                                    </DropdownMenuItem>
                                  </>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setCurrentProvider(provider);
                                      setActionType('enable');
                                      setShowActionDialog(true);
                                    }}
                                  >
                                    <UserCheck className="w-4 h-4 mr-2" />
                                    {language === 'ar' ? 'تفعيل' : 'Enable'}
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => {
                                    setCurrentProvider(provider);
                                    setShowDeleteDialog(true);
                                  }}
                                  className="text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  {language === 'ar' ? 'حذف' : 'Delete'}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                {language === 'ar'
                  ? `الصفحة ${pagination.page} من ${pagination.totalPages}`
                  : `Page ${pagination.page} of ${pagination.totalPages}`}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1 || loading}
                >
                  {language === 'ar' ? 'السابق' : 'Previous'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages || loading}
                >
                  {language === 'ar' ? 'التالي' : 'Next'}
                </Button>
              </div>
            </div>
          )}

          {/* Add Provider Dialog */}
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {language === 'ar' ? 'إضافة مقدم خدمة جديد' : 'Add New Provider'}
                </DialogTitle>
                <DialogDescription>
                  {language === 'ar'
                    ? 'أدخل معلومات مقدم الخدمة الجديد'
                    : 'Enter new provider information'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'مالك مقدم الخدمة' : 'Provider Owner'}
                    <span className="text-destructive ml-1">*</span>
                  </label>

                  <Select
                    value={formData.userId}
                    onValueChange={(value) => setFormData({ ...formData, userId: value })}
                    disabled={loadingUsers}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          loadingUsers
                            ? language === 'ar' ? 'جاري التحميل...' : 'Loading...'
                            : language === 'ar' ? 'اختر المستخدم' : 'Select user'
                        }
                      />
                    </SelectTrigger>

                    <SelectContent>
                      {providerUsers.length === 0 && !loadingUsers && (
                        <SelectItem value="no-users" disabled>
                          {language === 'ar' ? 'لا يوجد مستخدمون' : 'No users available'}
                        </SelectItem>
                      )}

                      {providerUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} — {user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <p className="text-xs text-muted-foreground mt-1">
                    {language === 'ar'
                      ? 'يتم عرض المستخدمين من نوع مقدم خدمة فقط'
                      : 'Only users with provider role are shown'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'اسم العمل' : 'Business Name'}
                    <span className="text-destructive ml-1">*</span>
                  </label>
                  <Input
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder={language === 'ar' ? 'أدخل اسم العمل' : 'Enter business name'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'اسم العمل بالعربية' : 'Business Name (Arabic)'}
                  </label>
                  <Input
                    value={formData.businessNameAr}
                    onChange={(e) => setFormData({ ...formData, businessNameAr: e.target.value })}
                    placeholder={language === 'ar' ? 'أدخل اسم العمل بالعربية' : 'Enter business name in Arabic'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'الوصف' : 'Description'}
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={language === 'ar' ? 'أدخل وصف مقدم الخدمة' : 'Enter provider description'}
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'نسبة العمولة (%)' : 'Commission Rate (%)'}
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.commissionRate}
                    onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
                    placeholder="15.00"
                  />
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
                <Button onClick={handleAddProvider} disabled={actionLoading}>
                  {actionLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {language === 'ar' ? 'جاري الإضافة...' : 'Adding...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {language === 'ar' ? 'إضافة' : 'Add'}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Provider Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {language === 'ar' ? 'تعديل بيانات مقدم الخدمة' : 'Edit Provider'}
                </DialogTitle>
                <DialogDescription>
                  {language === 'ar'
                    ? 'قم بتحديث معلومات مقدم الخدمة'
                    : 'Update provider information'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'اسم العمل' : 'Business Name'}
                    <span className="text-destructive ml-1">*</span>
                  </label>
                  <Input
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder={language === 'ar' ? 'أدخل اسم العمل' : 'Enter business name'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'اسم العمل بالعربية' : 'Business Name (Arabic)'}
                  </label>
                  <Input
                    value={formData.businessNameAr}
                    onChange={(e) => setFormData({ ...formData, businessNameAr: e.target.value })}
                    placeholder={language === 'ar' ? 'أدخل اسم العمل بالعربية' : 'Enter business name in Arabic'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'الوصف' : 'Description'}
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={language === 'ar' ? 'أدخل وصف مقدم الخدمة' : 'Enter provider description'}
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'حالة التوثيق' : 'Verification Status'}
                  </label>
                  <Select
                    value={formData.verificationStatus}
                    onValueChange={(value) =>
                      setFormData({ ...formData, verificationStatus: value as 'pending' | 'approved' | 'rejected' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">{language === 'ar' ? 'قيد المراجعة' : 'Pending'}</SelectItem>
                      <SelectItem value="approved">{language === 'ar' ? 'موثق' : 'Approved'}</SelectItem>
                      <SelectItem value="rejected">{language === 'ar' ? 'مرفوض' : 'Rejected'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'نسبة العمولة (%)' : 'Commission Rate (%)'}
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.commissionRate}
                    onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
                    placeholder="15.00"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium">
                    {language === 'ar' ? 'نشط' : 'Active'}
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <label htmlFor="featured" className="text-sm font-medium">
                    {language === 'ar' ? 'مميز' : 'Featured'}
                  </label>
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
                <Button onClick={handleEditProvider} disabled={actionLoading}>
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
                  {language === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}
                </DialogTitle>
                <DialogDescription>
                  {selectedProviders.size > 0
                    ? language === 'ar'
                      ? `هل أنت متأكد من حذف ${selectedProviders.size} مقدم خدمة؟ لا يمكن التراجع عن هذا الإجراء.`
                      : `Are you sure you want to delete ${selectedProviders.size} provider(s)? This action cannot be undone.`
                    : language === 'ar'
                      ? 'هل أنت متأكد من حذف مقدم الخدمة هذا؟ لا يمكن التراجع عن هذا الإجراء.'
                      : 'Are you sure you want to delete this provider? This action cannot be undone.'
                  }
                </DialogDescription>
              </DialogHeader>

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
                  onClick={handleDeleteProvider}
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
    </AdminLayout>
  );
}