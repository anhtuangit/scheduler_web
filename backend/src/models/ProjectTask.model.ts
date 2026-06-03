import mongoose, { Schema, Document } from 'mongoose';

export interface IProjectSubtask extends Document {
  title: string;
  completed: boolean;
  order: number;
}

const ProjectSubtaskSchema = new Schema<IProjectSubtask>(
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

export interface IProjectTaskComment {
  userId: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
}

const ProjectTaskCommentSchema = new Schema<IProjectTaskComment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

export interface IProjectTask extends Document {
  projectId: mongoose.Types.ObjectId;
  columnId: mongoose.Types.ObjectId;
  title: string;
  shortDescription?: string;
  detailedDescription?: string;
  labels: mongoose.Types.ObjectId[];
  attachments: string[];
  subtasks: IProjectSubtask[];
  comments: IProjectTaskComment[];
  emailReminder?: Date;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectTaskSchema = new Schema<IProjectTask>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true
    },
    columnId: {
      type: Schema.Types.ObjectId,
      ref: 'Column',
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
    labels: [{
      type: Schema.Types.ObjectId,
      ref: 'Label'
    }],
    attachments: [{
      type: String
    }],
    subtasks: [ProjectSubtaskSchema],
    comments: [ProjectTaskCommentSchema],
    emailReminder: {
      type: Date
    },
    order: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Indexes for better query performance
ProjectTaskSchema.index({ projectId: 1, columnId: 1, order: 1 });
ProjectTaskSchema.index({ columnId: 1 });

export default mongoose.model<IProjectTask>('ProjectTask', ProjectTaskSchema);

