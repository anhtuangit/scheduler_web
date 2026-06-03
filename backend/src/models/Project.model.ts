import mongoose, { Schema, Document } from 'mongoose';

export interface IProjectMember {
  userId: mongoose.Types.ObjectId;
  role: 'viewer' | 'editor';
  joinedAt: Date;
}

const ProjectMemberSchema = new Schema<IProjectMember>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['viewer', 'editor'],
      default: 'editor'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

export interface IProject extends Document {
  name: string;
  description?: string;
  ownerId: mongoose.Types.ObjectId;
  members: IProjectMember[];
  columns: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    members: [ProjectMemberSchema],
    columns: [{
      type: Schema.Types.ObjectId,
      ref: 'Column'
    }]
  },
  {
    timestamps: true
  }
);

// Index for faster queries
ProjectSchema.index({ ownerId: 1 });
ProjectSchema.index({ 'members.userId': 1 });

export default mongoose.model<IProject>('Project', ProjectSchema);

