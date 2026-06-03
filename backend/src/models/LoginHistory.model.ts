import mongoose, { Schema, Document } from 'mongoose';

export interface ILoginHistory extends Document {
  userId: mongoose.Types.ObjectId;
  ipAddress: string;
  userAgent: string;
  loginAt: Date;
}

const LoginHistorySchema = new Schema<ILoginHistory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    ipAddress: {
      type: String,
      required: true
    },
    userAgent: {
      type: String,
      required: true
    },
    loginAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false
  }
);

// Index for faster queries
LoginHistorySchema.index({ userId: 1, loginAt: -1 });

export default mongoose.model<ILoginHistory>('LoginHistory', LoginHistorySchema);

