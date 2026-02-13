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
import {
  Folder,
  Plus,
  Search,
  Trash2,
  Edit,
  Image,
  List,
  CheckSquare,
  X,
  AlertTriangle,
  Save,
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
import ProviderLayout from '@/components/admin/AdminLayout';

interface Category {
  id: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  icon_url: string | null;
  parent_id: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  tenant_id: string;
}

export default function CategoriesPage() {
  const { user } = useAuth();
  const { language } = useLanguage();

  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [deleteMode, setDeleteMode] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    description: '',
    iconUrl: '',
    parentId: '',
    displayOrder: 0,
    isActive: true
  });

  useEffect(() => {
    if (user) {
      loadCategories();
    }
  }, [user]);

  useEffect(() => {
    filterCategoryList();
  }, [categories, searchQuery, filterStatus]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await api.get<{ categories: Category[] }>('/admin/categories');
      setCategories(data.categories);
      setMessage(null);
    } catch (error: any) {
      console.error('Failed to load categories:', error);
      setMessage({
        type: 'error',
        text: language === 'ar' ? 'فشل تحميل قائمة الفئات' : 'Failed to load categories list'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterCategoryList = () => {
    let filtered = [...categories];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (cat) =>
          cat.name.toLowerCase().includes(query) ||
          (cat.name_ar && cat.name_ar.toLowerCase().includes(query)) ||
          (cat.description && cat.description.toLowerCase().includes(query))
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(
        (cat) => cat.is_active === (filterStatus === 'active')
      );
    }

    setFilteredCategories(filtered);
  };

  const handleAddCategory = async () => {
    if (!formData.name.trim()) {
      setMessage({
        type: 'error',
        text: language === 'ar' ? 'يرجى إدخال اسم الفئة' : 'Please enter category name'
      });
      return;
    }

    try {
      setActionLoading(true);
      await api.post('/admin/categories', {
        name: formData.name,
        nameAr: formData.nameAr || null,
        description: formData.description || null,
        iconUrl: formData.iconUrl || null,
        parentId: formData.parentId || null,
        displayOrder: formData.displayOrder,
        isActive: formData.isActive
      });

      setMessage({
        type: 'success',
        text: language === 'ar' ? 'تم إضافة الفئة بنجاح' : 'Category added successfully'
      });
      setShowAddDialog(false);
      resetForm();
      await loadCategories();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || (language === 'ar' ? 'فشل إضافة الفئة' : 'Failed to add category')
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditCategory = async () => {
    if (!currentCategory) return;

    if (!formData.name.trim()) {
      setMessage({
        type: 'error',
        text: language === 'ar' ? 'يرجى إدخال اسم الفئة' : 'Please enter category name'
      });
      return;
    }

    try {
      setActionLoading(true);
      await api.put(`/admin/categories/${currentCategory.id}`, {
        name: formData.name,
        nameAr: formData.nameAr || null,
        description: formData.description || null,
        iconUrl: formData.iconUrl || null,
        parentId: formData.parentId || null,
        displayOrder: formData.displayOrder,
        isActive: formData.isActive
      });

      setMessage({
        type: 'success',
        text: language === 'ar' ? 'تم تحديث الفئة بنجاح' : 'Category updated successfully'
      });
      setShowEditDialog(false);
      setCurrentCategory(null);
      resetForm();
      await loadCategories();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || (language === 'ar' ? 'فشل تحديث الفئة' : 'Failed to update category')
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    const idsToDelete = selectedCategories.size > 0
      ? Array.from(selectedCategories)
      : currentCategory ? [currentCategory.id] : [];

    if (idsToDelete.length === 0) return;

    try {
      setActionLoading(true);
      for (const id of idsToDelete) {
        await api.delete(`/admin/categories/${id}`);
      }

      setMessage({
        type: 'success',
        text: language === 'ar'
          ? `تم حذف ${idsToDelete.length} فئة بنجاح`
          : `Successfully deleted ${idsToDelete.length} category(ies)`
      });
      setShowDeleteDialog(false);
      setSelectedCategories(new Set());
      setCurrentCategory(null);
      setDeleteMode(false);
      await loadCategories();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || (language === 'ar' ? 'فشل حذف الفئات' : 'Failed to delete categories')
      });
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      nameAr: '',
      description: '',
      iconUrl: '',
      parentId: '',
      displayOrder: 0,
      isActive: true
    });
  };

  const openEditDialog = (category: Category) => {
    setCurrentCategory(category);
    setFormData({
      name: category.name,
      nameAr: category.name_ar || '',
      description: category.description || '',
      iconUrl: category.icon_url || '',
      parentId: category.parent_id || '',
      displayOrder: category.display_order,
      isActive: category.is_active
    });
    setShowEditDialog(true);
  };

  const toggleSelectAll = () => {
    if (selectedCategories.size === filteredCategories.length) {
      setSelectedCategories(new Set());
    } else {
      setSelectedCategories(new Set(filteredCategories.map(c => c.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCategories(newSelected);
  };

  const getCategoryName = (category: Category) => {
    return language === 'ar' && category.name_ar ? category.name_ar : category.name;
  };

  const enableDeleteMode = () => {
    setDeleteMode(true);
    setSelectedCategories(new Set());
  };

  const cancelDeleteMode = () => {
    setDeleteMode(false);
    setSelectedCategories(new Set());
  };

  if (loading && categories.length === 0) {
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
                <Folder className="w-8 h-8" />
                {language === 'ar' ? 'إدارة الفئات' : 'Categories Management'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {language === 'ar'
                  ? `إجمالي الفئات: ${categories.length}`
                  : `Total Categories: ${categories.length}`}
              </p>
            </div>
            <Button onClick={() => { resetForm(); setShowAddDialog(true); }} size="lg">
              <Plus className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'إضافة فئة جديدة' : 'Add New Category'}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  disabled={selectedCategories.size === 0}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {language === 'ar'
                    ? `حذف المحدد (${selectedCategories.size})`
                    : `Delete Selected (${selectedCategories.size})`}
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

            {!deleteMode && filteredCategories.length > 1 && (
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

          {/* Categories List */}
          <div className="space-y-4">
            {/* Table Header - Sticky */}
            {filteredCategories.length > 0 && (
              <div className="sticky top-0 z-10 bg-background">
                <Card className="p-4 shadow-sm border-b-2">
                  <div className="flex items-center gap-4">
                    {deleteMode && (
                      <div className="w-5 h-5 flex-shrink-0"></div>
                    )}

                    <div className="flex items-center gap-4 flex-1 min-w-0">

                      {/* Name */}
                      <div className="flex-shrink-0 min-w-[200px]">
                        <span className="text-sm font-semibold text-muted-foreground">
                          {language === 'ar' ? 'الاسم' : 'Name'}
                        </span>
                      </div>

                      {/* Description */}
                      <div className="flex-shrink-0 min-w-[250px]">
                        <span className="text-sm font-semibold text-muted-foreground">
                          {language === 'ar' ? 'الوصف' : 'Description'}
                        </span>
                      </div>

                      {/* Status */}
                      <div className="flex-shrink-0 min-w-[100px]">
                        <span className="text-sm font-semibold text-muted-foreground">
                          {language === 'ar' ? 'الحالة' : 'Status'}
                        </span>
                      </div>

                      {/* Order */}
                      <div className="flex-shrink-0 min-w-[80px]">
                        <span className="text-sm font-semibold text-muted-foreground">
                          {language === 'ar' ? 'الترتيب' : 'Order'}
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

            {filteredCategories.length === 0 ? (
              <Card className="p-8 text-center">
                <Folder className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-lg">
                  {searchQuery || filterStatus !== 'all'
                    ? language === 'ar' ? 'لا توجد نتائج' : 'No results found'
                    : language === 'ar' ? 'لا توجد فئات حتى الآن' : 'No categories yet'}
                </p>
                {!searchQuery && filterStatus === 'all' && (
                  <Button onClick={() => { resetForm(); setShowAddDialog(true); }} className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    {language === 'ar' ? 'إضافة أول فئة' : 'Add First Category'}
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
                        {selectedCategories.size === filteredCategories.length
                          ? language === 'ar' ? 'إلغاء تحديد الكل' : 'Deselect All'
                          : language === 'ar' ? 'تحديد الكل' : 'Select All'}
                      </span>
                    </button>
                  </div>
                )}

                {filteredCategories.map((category) => (
                  <Card key={category.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      {deleteMode && (
                        <input
                          type="checkbox"
                          checked={selectedCategories.has(category.id)}
                          onChange={() => toggleSelect(category.id)}
                          className="w-5 h-5 rounded border-gray-300 cursor-pointer flex-shrink-0"
                        />
                      )}

                      <div className="flex items-center gap-4 flex-1 min-w-0 overflow-x-auto">

                        {/* Name */}
                        <div className="flex-shrink-0 min-w-[200px]">
                          <h3 className="text-base font-semibold whitespace-nowrap">
                            {getCategoryName(category)}
                          </h3>
                          {category.parent_id && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Folder className="w-3 h-3" />
                              {language === 'ar' ? 'فئة فرعية' : 'Subcategory'}
                            </p>
                          )}
                        </div>

                        {/* Description */}
                        <div className="flex-shrink-0 min-w-[250px]">
                          <p className="text-sm text-muted-foreground truncate">
                            {category.description || '-'}
                          </p>
                        </div>

                        {/* Status Badge */}
                        <div className="flex-shrink-0 min-w-[100px]">
                          <Badge
                            variant="outline"
                            className={category.is_active
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                            }
                          >
                            {category.is_active
                              ? language === 'ar' ? 'نشط' : 'Active'
                              : language === 'ar' ? 'غير نشط' : 'Inactive'}
                          </Badge>
                        </div>

                        {/* Order */}
                        <div className="flex-shrink-0 min-w-[80px]">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <List className="w-4 h-4" />
                            <span>{category.display_order}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {!deleteMode && (
                        <div className="flex items-center gap-2 flex-shrink-0 min-w-[80px] justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(category)}
                            className="h-9 w-9 p-0"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCurrentCategory(category);
                              setShowDeleteDialog(true);
                            }}
                            className="h-9 w-9 p-0 text-destructive hover:text-destructive"
                          >
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

          {/* Add Category Dialog */}
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {language === 'ar' ? 'إضافة فئة جديدة' : 'Add New Category'}
                </DialogTitle>
                <DialogDescription>
                  {language === 'ar'
                    ? 'أدخل معلومات الفئة الجديدة والتفاصيل الأخرى'
                    : 'Enter new category information and details'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'الاسم بالعربية' : 'Arabic Name'}
                  </label>
                  <Input
                    value={formData.nameAr}
                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                    placeholder={language === 'ar' ? 'أدخل الاسم بالعربية' : 'Enter Arabic name'}
                    dir="rtl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'الوصف' : 'Description'}
                  </label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={language === 'ar' ? 'أدخل وصف الفئة' : 'Enter category description'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'رابط الأيقونة' : 'Icon URL'}
                  </label>
                  <Input
                    value={formData.iconUrl}
                    onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
                    placeholder={language === 'ar' ? 'أدخل رابط الأيقونة' : 'Enter icon URL'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'ترتيب العرض' : 'Display Order'}
                  </label>
                  <Input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="editIsActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <label htmlFor="editIsActive" className="text-sm font-medium cursor-pointer">
                    {language === 'ar' ? 'تفعيل الفئة' : 'Activate Category'}
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
                <Button onClick={handleEditCategory} disabled={actionLoading}>
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
                  {selectedCategories.size > 0
                    ? language === 'ar'
                      ? `هل أنت متأكد من حذف ${selectedCategories.size} فئة؟ لا يمكن التراجع عن هذا الإجراء.`
                      : `Are you sure you want to delete ${selectedCategories.size} category(ies)? This action cannot be undone.`
                    : language === 'ar'
                      ? 'هل أنت متأكد من حذف هذه الفئة؟ لا يمكن التراجع عن هذا الإجراء.'
                      : 'Are you sure you want to delete this category? This action cannot be undone.'
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
                  onClick={handleDeleteCategory}
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