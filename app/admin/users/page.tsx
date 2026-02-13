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
  Users,
  Plus,
  Search,
  Trash2,
  Edit,
  Mail,
  Phone,
  Shield,
  UserCheck,
  UserX,
  MoreVertical,
  CheckSquare,
  X,
  AlertTriangle,
  Save,
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

interface User {
  id: string;
  tenant_id: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  role: string;
  status: string;
  avatar_url: string | null;
  preferences: any;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { language } = useLanguage();

  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<'suspend' | 'ban' | 'disable' | 'enable' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionDuration, setActionDuration] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'user',
    status: 'active',
    // Provider-specific fields
    businessName: '',
    businessNameAr: '',
    description: '',
    commissionRate: '15.00',
    verificationStatus: 'pending',
    isActiveProvider: true,
    featured: false
  });

  useEffect(() => {
    if (user) {
      loadUsers();
    }
  }, [user, pagination.page, pagination.limit, searchQuery, filterRole, filterStatus]);

  const loadUsers = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (searchQuery) params.append('search', searchQuery);
      if (filterRole && filterRole !== 'all') params.append('role', filterRole);
      if (filterStatus && filterStatus !== 'all') params.append('status', filterStatus);

      const data = await api.get<{ users: User[], pagination: PaginationInfo }>(
        `/admin/users?${params.toString()}`
      );

      setUsers(data.users);
      setPagination(data.pagination);
      setMessage(null);
    } catch (error: any) {
      console.error('Failed to load users:', error);
      setMessage({
        type: 'error',
        text: language === 'ar' ? 'فشل تحميل قائمة المستخدمين' : 'Failed to load users list'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!formData.email.trim() || !formData.password.trim()) {
      setMessage({
        type: 'error',
        text: language === 'ar' ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور' : 'Please enter email and password'
      });
      return;
    }

    try {
      setActionLoading(true);
      await api.post('/admin/users', {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName || null,
        lastName: formData.lastName || null,
        phone: formData.phone || null,
        role: formData.role,
        status: formData.status
      });

      setMessage({
        type: 'success',
        text: language === 'ar' ? 'تم إضافة المستخدم بنجاح' : 'User added successfully'
      });
      setShowAddDialog(false);
      resetForm();
      await loadUsers();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || (language === 'ar' ? 'فشل إضافة المستخدم' : 'Failed to add user')
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditUser = async () => {
    if (!currentUser) return;

    try {
      setActionLoading(true);
      await api.put(`/admin/users/${currentUser.id}`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        role: formData.role,
        status: formData.status
      });

      setMessage({
        type: 'success',
        text: language === 'ar' ? 'تم تحديث بيانات المستخدم بنجاح' : 'User updated successfully'
      });
      setShowEditDialog(false);
      setCurrentUser(null);
      resetForm();
      await loadUsers();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || (language === 'ar' ? 'فشل تحديث البيانات' : 'Failed to update user')
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUserAction = async () => {
    if (!currentUser || !actionType || !actionReason.trim()) return;

    try {
      setActionLoading(true);
      const actionData = {
        actionType,
        reason: actionReason,
        duration: actionDuration ? parseInt(actionDuration) : null,
        targetUserId: currentUser.id,
        targetUserName: `${currentUser.first_name} ${currentUser.last_name}`,
        adminUserId: user?.id,
        adminUserName: user?.email
      };

      await api.post('/admin/users/actions', actionData);

      setMessage({
        type: 'success',
        text: language === 'ar'
          ? `تم ${actionType === 'suspend' ? 'تعليق' : actionType === 'ban' ? 'حظر' : actionType === 'disable' ? 'تعطيل' : 'تفعيل'} المستخدم بنجاح`
          : `User ${actionType}d successfully`
      });
      setShowActionDialog(false);
      setActionType(null);
      setActionReason('');
      setActionDuration('');
      setCurrentUser(null);
      await loadUsers();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || (language === 'ar' ? 'فشل تنفيذ الإجراء' : 'Failed to execute action')
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    const idsToDelete = selectedUsers.size > 0
      ? Array.from(selectedUsers)
      : currentUser ? [currentUser.id] : [];

    if (idsToDelete.length === 0) return;

    try {
      setActionLoading(true);

      for (const id of idsToDelete) {
        await api.delete(`/admin/users/${id}`);
      }

      setMessage({
        type: 'success',
        text: language === 'ar'
          ? `تم حذف ${idsToDelete.length} مستخدم بنجاح`
          : `Successfully deleted ${idsToDelete.length} user(s)`
      });
      setShowDeleteDialog(false);
      setSelectedUsers(new Set());
      setCurrentUser(null);
      setDeleteMode(false);
      await loadUsers();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || (language === 'ar' ? 'فشل حذف المستخدمين' : 'Failed to delete users')
      });
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      role: 'user',
      status: 'active',
      businessName: '',
      businessNameAr: '',
      description: '',
      commissionRate: '15.00',
      verificationStatus: 'pending',
      isActiveProvider: true,
      featured: false
    });
    setShowPassword(false);
  };

  const openEditDialog = (userToEdit: User) => {
    setCurrentUser(userToEdit);
    setFormData({
      email: userToEdit.email,
      password: '',
      firstName: userToEdit.first_name || '',
      lastName: userToEdit.last_name || '',
      phone: userToEdit.phone || '',
      role: userToEdit.role || 'user',
      status: userToEdit.status || 'active'
    });
    setShowEditDialog(true);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedUsers(newSelected);
  };

  const getRoleBadge = (role: string) => {
    const roles: any = {
      super_admin: { label: language === 'ar' ? 'مدير أعلى' : 'Super Admin', variant: 'default' },
      admin: { label: language === 'ar' ? 'مدير' : 'Admin', variant: 'default' },
      provider: { label: language === 'ar' ? 'مزود خدمة' : 'Provider', variant: 'secondary' },
      user: { label: language === 'ar' ? 'مستخدم' : 'User', variant: 'outline' }
    };
    return roles[role] || { label: role, variant: 'secondary' };
  };

  const getStatusBadge = (status: string) => {
    return status === 'active'
      ? { label: language === 'ar' ? 'نشط' : 'Active', className: 'bg-green-50 text-green-700 border-green-200' }
      : { label: language === 'ar' ? 'غير نشط' : 'Inactive', className: 'bg-red-50 text-red-700 border-red-200' };
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const enableDeleteMode = () => {
    setDeleteMode(true);
    setSelectedUsers(new Set());
  };

  const cancelDeleteMode = () => {
    setDeleteMode(false);
    setSelectedUsers(new Set());
  };

  if (loading && users.length === 0) {
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
                <Users className="w-8 h-8" />
                {language === 'ar' ? 'إدارة المستخدمين' : 'Users Management'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {language === 'ar'
                  ? `إجمالي المستخدمين: ${pagination.total}`
                  : `Total Users: ${pagination.total}`}
              </p>
            </div>
            <Button onClick={() => { resetForm(); setShowAddDialog(true); }} size="lg">
              <Plus className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'إضافة مستخدم جديد' : 'Add New User'}
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

              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'ar' ? 'الدور' : 'Role'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'ar' ? 'جميع الأدوار' : 'All Roles'}</SelectItem>
                  <SelectItem value="super_admin">{language === 'ar' ? 'مدير أعلى' : 'Super Admin'}</SelectItem>
                  <SelectItem value="admin">{language === 'ar' ? 'مدير' : 'Admin'}</SelectItem>
                  <SelectItem value="provider">{language === 'ar' ? 'مزود خدمة' : 'Provider'}</SelectItem>
                  <SelectItem value="user">{language === 'ar' ? 'مستخدم' : 'User'}</SelectItem>
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
                  disabled={selectedUsers.size === 0}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {language === 'ar'
                    ? `حذف المحدد (${selectedUsers.size})`
                    : `Delete Selected (${selectedUsers.size})`}
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

            {!deleteMode && users.length > 1 && (
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

          {/* Users List */}
          <div className="space-y-4">
            {/* Table Header - Sticky */}
            {users.length > 0 && (
              <div className="sticky top-0 z-10 bg-background">
                <Card className="p-4 shadow-sm border-b-2">
                  <div className="flex items-center gap-4">
                    {deleteMode && (
                      <div className="w-5 h-5 flex-shrink-0"></div>
                    )}

                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Name */}
                      <div className="flex-shrink-0 min-w-[150px]">
                        <span className="text-sm font-semibold text-muted-foreground">
                          {language === 'ar' ? 'الاسم' : 'Name'}
                        </span>
                      </div>

                      {/* Role */}
                      <div className="flex-shrink-0 min-w-[100px]">
                        <span className="text-sm font-semibold text-muted-foreground">
                          {language === 'ar' ? 'الدور' : 'Role'}
                        </span>
                      </div>

                      {/* Status */}
                      <div className="flex-shrink-0 min-w-[100px]">
                        <span className="text-sm font-semibold text-muted-foreground">
                          {language === 'ar' ? 'الحالة' : 'Status'}
                        </span>
                      </div>

                      {/* Email */}
                      <div className="flex-shrink-0 min-w-[200px]">
                        <span className="text-sm font-semibold text-muted-foreground">
                          {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                        </span>
                      </div>

                      {/* Phone */}
                      <div className="flex-shrink-0 min-w-[120px]">
                        <span className="text-sm font-semibold text-muted-foreground">
                          {language === 'ar' ? 'رقم الهاتف' : 'Phone'}
                        </span>
                      </div>

                      {/* Last Login */}
                      <div className="flex-shrink-0 min-w-[150px]">
                        <span className="text-sm font-semibold text-muted-foreground">
                          {language === 'ar' ? 'آخر دخول' : 'Last Login'}
                        </span>
                      </div>
                    </div>

                    {/* Actions Header */}
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

            {users.length === 0 ? (
              <Card className="p-8 text-center">
                <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-lg">
                  {searchQuery || filterRole !== 'all' || filterStatus !== 'all'
                    ? language === 'ar' ? 'لا توجد نتائج' : 'No results found'
                    : language === 'ar' ? 'لا يوجد مستخدمين حتى الآن' : 'No users yet'}
                </p>
                {!searchQuery && filterRole === 'all' && filterStatus === 'all' && (
                  <Button onClick={() => { resetForm(); setShowAddDialog(true); }} className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    {language === 'ar' ? 'إضافة أول مستخدم' : 'Add First User'}
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
                        {selectedUsers.size === users.length
                          ? language === 'ar' ? 'إلغاء تحديد الكل' : 'Deselect All'
                          : language === 'ar' ? 'تحديد الكل' : 'Select All'}
                      </span>
                    </button>
                  </div>
                )}

                {users.map((userItem) => (
                  <Card key={userItem.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      {deleteMode && (
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(userItem.id)}
                          onChange={() => toggleSelect(userItem.id)}
                          className="w-5 h-5 rounded border-gray-300 cursor-pointer flex-shrink-0"
                        />
                      )}

                      <div className="flex items-center gap-4 flex-1 min-w-0 overflow-x-auto">
                        {/* Name */}
                        <div className="flex-shrink-0 min-w-[150px]">
                          <h3 className="text-base font-semibold whitespace-nowrap">
                            {userItem.first_name} {userItem.last_name}
                          </h3>
                        </div>

                        {/* Role Badge */}
                        <div className="flex-shrink-0 min-w-[100px]">
                          <Badge variant={getRoleBadge(userItem.role).variant as any}>
                            {getRoleBadge(userItem.role).label}
                          </Badge>
                        </div>

                        {/* Status Badge */}
                        <div className="flex-shrink-0 min-w-[100px]">
                          <Badge variant="outline" className={getStatusBadge(userItem.status).className}>
                            {userItem.status === 'active' ? (
                              <UserCheck className="w-3 h-3 mr-1" />
                            ) : (
                              <UserX className="w-3 h-3 mr-1" />
                            )}
                            {getStatusBadge(userItem.status).label}
                          </Badge>
                        </div>

                        {/* Email */}
                        <div className="flex items-center gap-2 flex-shrink-0 min-w-[200px]">
                          <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm text-muted-foreground truncate">{userItem.email}</span>
                        </div>

                        {/* Phone */}
                        <div className="flex items-center gap-2 flex-shrink-0 min-w-[120px]">
                          {userItem.phone ? (
                            <>
                              <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm text-muted-foreground" dir="ltr">{userItem.phone}</span>
                            </>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </div>

                        {/* Last Login */}
                        <div className="flex-shrink-0 min-w-[150px]">
                          {userItem.last_login_at ? (
                            <p className="text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(userItem.last_login_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                            </p>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
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
                              <DropdownMenuItem onClick={() => openEditDialog(userItem)}>
                                <Edit className="w-4 h-4 mr-2" />
                                {language === 'ar' ? 'تعديل' : 'Edit'}
                              </DropdownMenuItem>
                              {userItem.status === 'active' ? (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setCurrentUser(userItem);
                                      setActionType('suspend');
                                      setShowActionDialog(true);
                                    }}
                                  >
                                    <UserX className="w-4 h-4 mr-2" />
                                    {language === 'ar' ? 'تعليق' : 'Suspend'}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setCurrentUser(userItem);
                                      setActionType('ban');
                                      setShowActionDialog(true);
                                    }}
                                  >
                                    <Shield className="w-4 h-4 mr-2" />
                                    {language === 'ar' ? 'حظر' : 'Ban'}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setCurrentUser(userItem);
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
                                    setCurrentUser(userItem);
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
                                  setCurrentUser(userItem);
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
                ))}
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

          {/* Add User Dialog */}
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {language === 'ar' ? 'إضافة مستخدم جديد' : 'Add New User'}
                </DialogTitle>
                <DialogDescription>
                  {language === 'ar'
                    ? 'أدخل معلومات المستخدم الجديد وحدد الدور والحالة'
                    : 'Enter new user information and set role and status'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                    <span className="text-destructive ml-1">*</span>
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder={language === 'ar' ? 'أدخل البريد الإلكتروني' : 'Enter email'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'كلمة المرور' : 'Password'}
                    <span className="text-destructive ml-1">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder={language === 'ar' ? 'أدخل كلمة المرور' : 'Enter password'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ar' ? 'الاسم الأول' : 'First Name'}
                    </label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder={language === 'ar' ? 'الاسم الأول' : 'First name'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ar' ? 'الاسم الأخير' : 'Last Name'}
                    </label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder={language === 'ar' ? 'الاسم الأخير' : 'Last name'}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                  </label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder={language === 'ar' ? 'أدخل رقم الهاتف' : 'Enter phone number'}
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'الدور الوظيفي' : 'Role'}
                  </label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="super_admin">{language === 'ar' ? 'مدير أعلى' : 'Super Admin'}</SelectItem>
                      <SelectItem value="admin">{language === 'ar' ? 'مدير' : 'Admin'}</SelectItem>
                      <SelectItem value="provider">{language === 'ar' ? 'مزود خدمة' : 'Provider'}</SelectItem>
                      <SelectItem value="user">{language === 'ar' ? 'مستخدم' : 'User'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'الحالة' : 'Status'}
                  </label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{language === 'ar' ? 'نشط' : 'Active'}</SelectItem>
                      <SelectItem value="inactive">{language === 'ar' ? 'غير نشط' : 'Inactive'}</SelectItem>
                    </SelectContent>
                  </Select>
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
                <Button onClick={handleAddUser} disabled={actionLoading}>
                  {actionLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {language === 'ar' ? 'جارٍ الإضافة...' : 'Adding...'}
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

          {/* Edit User Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {language === 'ar' ? 'تعديل بيانات المستخدم' : 'Edit User'}
                </DialogTitle>
                <DialogDescription>
                  {language === 'ar'
                    ? 'قم بتعديل معلومات المستخدم والدور والحالة'
                    : 'Update user information, role and status'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === 'ar' ? 'لا يمكن تعديل البريد الإلكتروني' : 'Email cannot be changed'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ar' ? 'الاسم الأول' : 'First Name'}
                    </label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder={language === 'ar' ? 'الاسم الأول' : 'First name'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ar' ? 'الاسم الأخير' : 'Last Name'}
                    </label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder={language === 'ar' ? 'الاسم الأخير' : 'Last name'}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                  </label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder={language === 'ar' ? 'أدخل رقم الهاتف' : 'Enter phone number'}
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'الدور الوظيفي' : 'Role'}
                  </label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="super_admin">{language === 'ar' ? 'مدير أعلى' : 'Super Admin'}</SelectItem>
                      <SelectItem value="admin">{language === 'ar' ? 'مدير' : 'Admin'}</SelectItem>
                      <SelectItem value="provider">{language === 'ar' ? 'مزود خدمة' : 'Provider'}</SelectItem>
                      <SelectItem value="user">{language === 'ar' ? 'مستخدم' : 'User'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'الحالة' : 'Status'}
                  </label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{language === 'ar' ? 'نشط' : 'Active'}</SelectItem>
                      <SelectItem value="inactive">{language === 'ar' ? 'غير نشط' : 'Inactive'}</SelectItem>
                    </SelectContent>
                  </Select>
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
                <Button onClick={handleEditUser} disabled={actionLoading}>
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

          {/* Action Dialog */}
          <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  {actionType === 'suspend' && (language === 'ar' ? 'تعليق المستخدم' : 'Suspend User')}
                  {actionType === 'ban' && (language === 'ar' ? 'حظر المستخدم' : 'Ban User')}
                  {actionType === 'disable' && (language === 'ar' ? 'تعطيل المستخدم' : 'Disable User')}
                  {actionType === 'enable' && (language === 'ar' ? 'تفعيل المستخدم' : 'Enable User')}
                </DialogTitle>
                <DialogDescription>
                  {language === 'ar'
                    ? `أدخل تفاصيل الإجراء للمستخدم: ${currentUser?.first_name} ${currentUser?.last_name}`
                    : `Enter action details for user: ${currentUser?.first_name} ${currentUser?.last_name}`}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'سبب الإجراء' : 'Action Reason'} *
                  </label>
                  <Textarea
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder={language === 'ar' ? 'أدخل سبب الإجراء' : 'Enter reason for action'}
                    rows={3}
                  />
                </div>

                {(actionType === 'suspend' || actionType === 'ban') && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ar' ? 'مدة الإجراء (بالأيام)' : 'Action Duration (days)'}
                    </label>
                    <Input
                      type="number"
                      value={actionDuration}
                      onChange={(e) => setActionDuration(e.target.value)}
                      placeholder={language === 'ar' ? 'اتركه فارغاً للإجراء الدائم' : 'Leave empty for permanent action'}
                      min="1"
                    />
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowActionDialog(false);
                    setActionType(null);
                    setActionReason('');
                    setActionDuration('');
                  }}
                  disabled={actionLoading}
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button onClick={handleUserAction} disabled={actionLoading || !actionReason.trim()}>
                  {actionLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {language === 'ar' ? 'جارٍ التنفيذ...' : 'Executing...'}
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      {language === 'ar' ? 'تنفيذ' : 'Execute'}
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
                  {selectedUsers.size > 0
                    ? language === 'ar'
                      ? `هل أنت متأكد من حذف ${selectedUsers.size} مستخدم؟ لا يمكن التراجع عن هذا الإجراء.`
                      : `Are you sure you want to delete ${selectedUsers.size} user(s)? This action cannot be undone.`
                    : language === 'ar'
                      ? 'هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء.'
                      : 'Are you sure you want to delete this user? This action cannot be undone.'
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
                  onClick={handleDeleteUser}
                  disabled={actionLoading}
                >
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