import mongoose, { Schema, Document } from 'mongoose';

export interface ISubtask extends Document {
  title: string;
  completed: boolean;
  order: number;
}

const SubtaskSchema = new Schema<ISubtask>(
  {
    title: {
      type: String,
      required: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    order: {
      type: Number,
      default: 0
    }
  },
  { _id: true }
);

export interface ITask extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  shortDescription?: string;
  detailedDescription?: string;
  startTime: Date;
  endTime: Date;
  timeSlot: 'morning' | 'noon' | 'afternoon' | 'evening';
  labels: mongoose.Types.ObjectId[];
  attachments: string[];
  subtasks: ISubtask[];
  emailReminder?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    shortDescription: {
      type: String,
      trim: true
    },
    detailedDescription: {
      type: String
    },
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true
    },
    timeSlot: {
      type: String,
      enum: ['morning', 'noon', 'afternoon', 'evening'],
      required: true
    },
    labels: [{
      type: Schema.Types.ObjectId,
      ref: 'Label'
    }],
    attachments: [{
      type: String
    }],
    subtasks: [SubtaskSchema],
    emailReminder: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Indexes for better query performance
TaskSchema.index({ userId: 1, startTime: 1 });
TaskSchema.index({ userId: 1, timeSlot: 1 });

export default mongoose.model<ITask>('Task', TaskSchema);

