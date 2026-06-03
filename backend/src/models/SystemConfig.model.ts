import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemConfig extends Document {
  appName: string;
  theme: 'light' | 'dark';
  primaryColor: string;
  updatedBy: mongoose.Types.ObjectId;
  updatedAt: Date;
}

const SystemConfigSchema = new Schema<ISystemConfig>(
  {
    appName: {
      type: String,
      default: 'Schedule 18',
      trim: true
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    primaryColor: {
      type: String,
      default: '#3B82F6'
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: { createdAt: false, updatedAt: true }
  }
);

// Ensure only one document exists
SystemConfigSchema.statics.getConfig = async function() {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({});
  }
  return config;
};

export default mongoose.model<ISystemConfig>('SystemConfig', SystemConfigSchema);

