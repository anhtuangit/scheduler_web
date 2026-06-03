import mongoose, { Schema, Document } from 'mongoose';

export interface ILabel extends Document {
  name: string;
  color: string;
  type: 'task_type' | 'status' | 'difficulty' | 'priority';
  icon: string;
  description?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LabelSchema = new Schema<ILabel>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    color: {
      type: String,
      required: true,
      default: '#3B82F6'
    },
    type: {
      type: String,
      enum: ['task_type', 'status', 'difficulty', 'priority'],
      required: true
    },
    icon: {
      type: String,
      required: true,
      default: 'mdi:label'
    },
    description: {
      type: String
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<ILabel>('Label', LabelSchema);

