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
  User,
  Mail,
  Phone,
  Building2,
  FileText,
  Star,
  MessageSquare,
  Save,
  Edit,
  X,
  Check,
  Upload,
  File,
  Trash2,
  AlertTriangle,
  Calendar,
  ShieldCheck
} from 'lucide-react';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ProviderProfile {
  id: string;
  user_id: string;
  tenant_id: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  business_name: string;
  business_name_ar: string;
  description: string;
  kyc_documents: any;
  rating: number;
  totalReviews: number;
  is_verified: number;
  verification_status: string;
  created_at: string;
  updated_at: string;
}

interface KYCDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
}

export default function ProviderProfilePage() {
  const { user } = useAuth();
  const { language } = useLanguage();

  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    businessName: '',
    businessNameAr: '',
    description: '',
    kycDocuments: [] as KYCDocument[]
  });

  const [originalData, setOriginalData] = useState({
    businessName: '',
    businessNameAr: '',
    description: '',
    kycDocuments: [] as KYCDocument[]
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await api.get<{ provider: ProviderProfile }>('/provider/profile');
      setProfile(data.provider);
      
      const kycDocs = data.provider.kyc_documents 
        ? (typeof data.provider.kyc_documents === 'string' 
            ? JSON.parse(data.provider.kyc_documents) 
            : data.provider.kyc_documents)
        : [];

      const profileData = {
        businessName: data.provider.business_name || '',
        businessNameAr: data.provider.business_name_ar || '',
        description: data.provider.description || '',
        kycDocuments: kycDocs
      };

      setFormData(profileData);
      setOriginalData(profileData);
      setMessage(null);
    } catch (error: any) {
      console.error('Failed to load profile:', error);
      setMessage({
        type: 'error',
        text: language === 'ar' ? 'فشل تحميل الملف الشخصي' : 'Failed to load profile'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.businessName.trim()) {
      setMessage({
        type: 'error',
        text: language === 'ar' ? 'يرجى إدخال اسم النشاط التجاري' : 'Please enter business name'
      });
      return;
    }

    try {
      setActionLoading(true);
      await api.put('/provider/profile', {
        businessName: formData.businessName,
        businessNameAr: formData.businessNameAr,
        description: formData.description,
        kycDocuments: formData.kycDocuments
      });

      setMessage({
        type: 'success',
        text: language === 'ar' ? 'تم تحديث الملف الشخصي بنجاح' : 'Profile updated successfully'
      });
      
      setEditMode(false);
      setOriginalData(formData);
      await loadProfile();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || (language === 'ar' ? 'فشل تحديث الملف الشخصي' : 'Failed to update profile')
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = () => {
    const hasChanges = 
      formData.businessName !== originalData.businessName ||
      formData.businessNameAr !== originalData.businessNameAr ||
      formData.description !== originalData.description ||
      JSON.stringify(formData.kycDocuments) !== JSON.stringify(originalData.kycDocuments);

    if (hasChanges) {
      setShowCancelDialog(true);
    } else {
      setEditMode(false);
    }
  };

  const confirmCancel = () => {
    setFormData(originalData);
    setEditMode(false);
    setShowCancelDialog(false);
    setMessage(null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // في بيئة حقيقية، سيتم رفع الملف إلى الخادم
      const newDoc: KYCDocument = {
        id: Date.now().toString(),
        name: file.name,
        type: file.type,
        url: URL.createObjectURL(file),
        uploadedAt: new Date().toISOString()
      };
      
      setFormData({
        ...formData,
        kycDocuments: [...formData.kycDocuments, newDoc]
      });
    }
  };

  const removeDocument = (docId: string) => {
    setFormData({
      ...formData,
      kycDocuments: formData.kycDocuments.filter(doc => doc.id !== docId)
    });
  };

  const getVerificationBadge = () => {
    if (!profile) return null;

    if (profile.is_verified === 1) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <ShieldCheck className="w-3 h-3 mr-1" />
          {language === 'ar' ? 'موثق' : 'Verified'}
        </Badge>
      );
    }

    const statusMap: any = {
      pending: {
        label: language === 'ar' ? 'قيد المراجعة' : 'Pending Review',
        className: 'bg-yellow-50 text-yellow-700 border-yellow-200'
      },
      rejected: {
        label: language === 'ar' ? 'مرفوض' : 'Rejected',
        className: 'bg-red-50 text-red-700 border-red-200'
      }
    };

    const status = statusMap[profile.verification_status] || statusMap.pending;

    return (
      <Badge variant="outline" className={status.className}>
        {status.label}
      </Badge>
    );
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

  if (!profile) {
    return (
      <ProviderLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="p-8 text-center max-w-md">
            <AlertTriangle className="w-16 h-16 mx-auto text-destructive mb-4" />
            <p className="text-lg font-semibold mb-2">
              {language === 'ar' ? 'لم يتم العثور على الملف الشخصي' : 'Profile Not Found'}
            </p>
            <p className="text-muted-foreground">
              {language === 'ar' 
                ? 'لم نتمكن من تحميل معلومات الملف الشخصي' 
                : 'We could not load your profile information'}
            </p>
          </Card>
        </div>
      </ProviderLayout>
    );
  }

  return (
    <ProviderLayout>
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <User className="w-8 h-8" />
                {language === 'ar' ? 'الملف الشخصي' : 'Profile'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {language === 'ar'
                  ? 'إدارة معلومات مزود الخدمة'
                  : 'Manage your service provider information'}
              </p>
            </div>
            
            {!editMode ? (
              <Button onClick={() => setEditMode(true)} size="lg">
                <Edit className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'تعديل الملف الشخصي' : 'Edit Profile'}
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={actionLoading}
                >
                  <X className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button onClick={handleSave} disabled={actionLoading}>
                  {actionLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {language === 'ar' ? 'جاري الحفظ...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Messages */}
          {message && (
            <Alert className={`mb-6 ${message.type === 'error' ? 'border-destructive' : 'border-green-500'}`}>
              <AlertDescription className={message.type === 'error' ? 'text-destructive' : 'text-green-700'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          {/* Profile Information */}
          <div className="space-y-6">
            {/* Basic Info Card */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <User className="w-5 h-5" />
                  {language === 'ar' ? 'معلومات أساسية' : 'Basic Information'}
                </h2>
                {getVerificationBadge()}
              </div>

              <div className="space-y-4">
                {/* Name (Read-only) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ar' ? 'الاسم الأول' : 'First Name'}
                    </label>
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>{profile.first_name}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ar' ? 'اسم العائلة' : 'Last Name'}
                    </label>
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>{profile.last_name}</span>
                    </div>
                  </div>
                </div>

                {/* Contact (Read-only) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                    </label>
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="truncate">{profile.email}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ar' ? 'رقم الهاتف' : 'Phone'}
                    </label>
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span dir="ltr">{profile.phone}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Business Info Card */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold flex items-center gap-2 mb-6">
                <Building2 className="w-5 h-5" />
                {language === 'ar' ? 'معلومات النشاط التجاري' : 'Business Information'}
              </h2>

              <div className="space-y-4">
                {/* Business Name */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'اسم النشاط التجاري' : 'Business Name'}
                    <span className="text-destructive ml-1">*</span>
                  </label>
                  {editMode ? (
                    <Input
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      placeholder={language === 'ar' ? 'أدخل اسم النشاط التجاري' : 'Enter business name'}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span>{profile.business_name || '-'}</span>
                    </div>
                  )}
                </div>

                {/* Business Name Arabic */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'اسم النشاط التجاري (بالعربية)' : 'Business Name (Arabic)'}
                  </label>
                  {editMode ? (
                    <Input
                      value={formData.businessNameAr}
                      onChange={(e) => setFormData({ ...formData, businessNameAr: e.target.value })}
                      placeholder={language === 'ar' ? 'أدخل اسم النشاط بالعربية' : 'Enter business name in Arabic'}
                      dir="rtl"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-md" dir="rtl">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span>{profile.business_name_ar || '-'}</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'الوصف' : 'Description'}
                  </label>
                  {editMode ? (
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder={language === 'ar' ? 'أدخل وصف النشاط التجاري' : 'Enter business description'}
                      rows={4}
                    />
                  ) : (
                    <div className="p-3 bg-muted rounded-md min-h-[100px]">
                      <p className="text-sm whitespace-pre-wrap">{profile.description || '-'}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Rating & Reviews Card */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold flex items-center gap-2 mb-6">
                <Star className="w-5 h-5" />
                {language === 'ar' ? 'التقييمات والمراجعات' : 'Ratings & Reviews'}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-4 rounded-lg">
                    <Star className="w-8 h-8 text-primary fill-primary" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{profile.rating.toFixed(1)}</p>
                    <p className="text-sm text-muted-foreground">
                      {language === 'ar' ? 'التقييم الإجمالي' : 'Overall Rating'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <MessageSquare className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{profile.totalReviews}</p>
                    <p className="text-sm text-muted-foreground">
                      {language === 'ar' ? 'إجمالي المراجعات' : 'Total Reviews'}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* KYC Documents Card */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold flex items-center gap-2 mb-6">
                <FileText className="w-5 h-5" />
                {language === 'ar' ? 'وثائق التحقق (KYC)' : 'Verification Documents (KYC)'}
              </h2>

              <div className="space-y-4">
                {editMode && (
                  <div>
                    <label
                      htmlFor="file-upload"
                      className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent transition-colors"
                    >
                      <Upload className="w-5 h-5" />
                      <span className="font-medium">
                        {language === 'ar' ? 'رفع مستند جديد' : 'Upload New Document'}
                      </span>
                      <input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                    </label>
                    <p className="text-xs text-muted-foreground mt-2">
                      {language === 'ar'
                        ? 'الصيغ المدعومة: PDF, JPG, PNG (الحد الأقصى 5 ميجابايت)'
                        : 'Supported formats: PDF, JPG, PNG (Max 5MB)'}
                    </p>
                  </div>
                )}

                {formData.kycDocuments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <File className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>{language === 'ar' ? 'لا توجد وثائق مرفوعة' : 'No documents uploaded'}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {formData.kycDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <File className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(doc.uploadedAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                            </p>
                          </div>
                        </div>
                        {editMode && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDocument(doc.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Account Details Card */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold flex items-center gap-2 mb-6">
                <Calendar className="w-5 h-5" />
                {language === 'ar' ? 'تفاصيل الحساب' : 'Account Details'}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">
                    {language === 'ar' ? 'تاريخ الإنشاء' : 'Created At'}
                  </p>
                  <p className="font-medium">
                    {new Date(profile.created_at).toLocaleDateString(
                      language === 'ar' ? 'ar-SA' : 'en-US',
                      { year: 'numeric', month: 'long', day: 'numeric' }
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">
                    {language === 'ar' ? 'آخر تحديث' : 'Last Updated'}
                  </p>
                  <p className="font-medium">
                    {new Date(profile.updated_at).toLocaleDateString(
                      language === 'ar' ? 'ar-SA' : 'en-US',
                      { year: 'numeric', month: 'long', day: 'numeric' }
                    )}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Cancel Confirmation Dialog */}
          <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-5 h-5" />
                  {language === 'ar' ? 'تأكيد الإلغاء' : 'Confirm Cancel'}
                </DialogTitle>
                <DialogDescription>
                  {language === 'ar'
                    ? 'لديك تغييرات غير محفوظة. هل أنت متأكد من إلغاء التعديلات؟'
                    : 'You have unsaved changes. Are you sure you want to cancel?'}
                </DialogDescription>
              </DialogHeader>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowCancelDialog(false)}
                >
                  {language === 'ar' ? 'العودة للتعديل' : 'Continue Editing'}
                </Button>
                <Button variant="destructive" onClick={confirmCancel}>
                  <X className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'إلغاء التغييرات' : 'Discard Changes'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </ProviderLayout>
  );
}