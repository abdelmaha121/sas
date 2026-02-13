import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';

export class IdGenerator {
  /**
   * تحويل UUID إلى MongoDB ObjectId صالح
   */
  static convertUuidToObjectId(uuid: string): string {
    if (!uuid) return new mongoose.Types.ObjectId().toString();
    
    // إزالة الشرطات من UUID
    const cleanUuid = uuid.replace(/-/g, '');
    
    // أخذ أول 24 حرف hex (12 bytes = 24 hex characters)
    const objectIdHex = cleanUuid.substring(0, 24);
    
    try {
      // التحقق من صحة الـ ObjectId
      return new mongoose.Types.ObjectId(objectIdHex).toString();
    } catch (error) {
      throw new Error(`Invalid UUID format: ${uuid}`);
    }
  }

  /**
   * التحقق من صحة MongoDB ObjectId
   */
  static isValidObjectId(id: string): boolean {
    return mongoose.Types.ObjectId.isValid(id);
  }

  /**
   * توليد UUID جديد
   */
  static generateUUID(): string {
    return uuidv4();
  }

  /**
   * توليد MongoDB ObjectId جديد
   */
  static generateObjectId(): string {
    return new mongoose.Types.ObjectId().toString();
  }
}
