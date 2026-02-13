import mongoose from 'mongoose';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected'
}

const bookingSchema = new mongoose.Schema(
  {
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'Service ID is required'],
      index: true
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Provider ID is required'],
      index: true
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Client ID is required'],
      index: true
    },
    status: {
      type: String,
      enum: Object.values(BookingStatus),
      default: BookingStatus.PENDING,
      index: true
    },
    scheduledDate: {
      type: Date,
      required: [true, 'Scheduled date is required'],
      validate: {
        validator: (v) => v > new Date(),
        message: 'Scheduled date must be in the future'
      }
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [15, 'Minimum duration is 15 minutes'],
      max: [480, 'Maximum duration is 8 hours']
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    clientDetails: {
      firstName: { type: String, required: [true, 'First name is required'] },
      lastName: { type: String, required: [true, 'Last name is required'] },
      email: { type: String, required: [true, 'Email is required'], lowercase: true },
      phone: { type: String, required: [true, 'Phone is required'] },
      address: { type: String, required: [true, 'Address is required'] }
    },
    paymentDetails: {
      paymentMethod: { type: String, enum: ['card', 'wallet', 'transfer'] },
      transactionId: String,
      paidAt: Date,
      amount: Number
    },
    notes: String,
    rejectionReason: String,
    confirmedAt: Date,
    completedAt: Date,
    cancelledAt: Date
  },
  { timestamps: true }
);

// ✅ منع الحجوزات المتعارضة بنفس المزود والتاريخ
bookingSchema.index({ providerId: 1, scheduledDate: 1, status: 1 });

// ✅ منع حجزات متكررة من نفس العميل على نفس الخدمة
bookingSchema.index({ 
  clientId: 1, 
  serviceId: 1, 
  status: 1 
});

// ✅ التحقق من عدم تداخل المواعيد
bookingSchema.methods.checkTimeConflict = async function() {
  const endTime = new Date(this.scheduledDate.getTime() + this.duration * 60000);
  
  const conflictingBooking = await mongoose.model('Booking').findOne({
    providerId: this.providerId,
    status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
    _id: { $ne: this._id },
    $or: [
      {
        scheduledDate: { $lt: endTime },
        $expr: {
          $gt: [
            { $add: ['$scheduledDate', { $multiply: ['$duration', 60000] }] },
            this.scheduledDate
          ]
        }
      }
    ]
  });
  
  return conflictingBooking;
};

// ✅ التحقق من عدم وجود حجز مكرر
bookingSchema.methods.checkDuplicate = async function() {
  const duplicate = await mongoose.model('Booking').findOne({
    clientId: this.clientId,
    serviceId: this.serviceId,
    status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
    _id: { $ne: this._id }
  });
  
  return duplicate;
};

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
