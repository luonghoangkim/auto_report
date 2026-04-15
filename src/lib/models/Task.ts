import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type TaskStatus = "todo" | "doing" | "review" | "done";

export interface IProgressEntry {
  progress: number;
  reportId: Types.ObjectId;
  date: Date;
  note?: string;
}

export interface ITask extends Document {
  projectId: Types.ObjectId;
  title: string;
  picName: string;
  picUserId?: Types.ObjectId;
  progress: number;             // current 0-100
  status: TaskStatus;
  history: IProgressEntry[];    // progress over time
  sourceReportIds: Types.ObjectId[];
  links: string[];
  tags: string[];               // module / project tags
  lastUpdatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ProgressEntrySchema = new Schema<IProgressEntry>(
  {
    progress: { type: Number, required: true },
    reportId: { type: Schema.Types.ObjectId, ref: "DailyReport" },
    date:     { type: Date, required: true },
    note:     { type: String },
  },
  { _id: false }
);

const TaskSchema = new Schema<ITask>(
  {
    projectId:      { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    title:          { type: String, required: true, trim: true },
    picName:        { type: String, required: true },
    picUserId:      { type: Schema.Types.ObjectId, ref: "User" },
    progress:       { type: Number, default: 0, min: 0, max: 100 },
    status:         { type: String, enum: ["todo", "doing", "review", "done"], default: "todo" },
    history:        [ProgressEntrySchema],
    sourceReportIds:[{ type: Schema.Types.ObjectId, ref: "DailyReport" }],
    links:          [{ type: String }],
    tags:           [{ type: String }],
    lastUpdatedAt:  { type: Date, default: Date.now },
  },
  { timestamps: true }
);

TaskSchema.index({ projectId: 1, picName: 1 });
TaskSchema.index({ projectId: 1, status: 1 });

export const Task: Model<ITask> =
  mongoose.models.Task ?? mongoose.model<ITask>("Task", TaskSchema);

export default Task;
