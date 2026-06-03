import mongoose, { Schema, Document } from 'mongoose';

export interface IColumn extends Document {
  projectId: mongoose.Types.ObjectId;
  name: string;
  order: number;
  tasks: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ColumnSchema = new Schema<IColumn>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    order: {
      type: Number,
      required: true,
      default: 0
    },
    tasks: [{
      type: Schema.Types.ObjectId,
      ref: 'ProjectTask'
    }]
  },
  {
    timestamps: true
  }
);

// Index for better query performance
ColumnSchema.index({ projectId: 1, order: 1 });

export default mongoose.model<IColumn>('Column', ColumnSchema);

