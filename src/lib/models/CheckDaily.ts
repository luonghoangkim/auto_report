import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type CheckDailyStatus = "in_progress" | "completed";
export type CheckDailyItemType = "logtime" | "meeting" | "report" | "task_planning";
export type LogtimeStatus = "OK" | "Missing" | "Not logged";
export type TaskPriority = "low" | "medium" | "high";

export interface ICheckDailyItem {
  type: CheckDailyItemType;
  isChecked: boolean;
  note?: string;
  checkedAt?: Date | null;
}

export interface ICheckDailyLogtime {
  userId: Types.ObjectId;
  name: string;
  expectedHours: number;
  actualHours: number;
  status: LogtimeStatus;
  reviewed: boolean;
}

export interface IPlannedTask {
  title: string;
  assignedUserId: Types.ObjectId;
  assignedUserName: string;
  priority: TaskPriority;
  deadline: Date;
  createdTaskId?: Types.ObjectId | null;
}

export interface ICheckDaily extends Document {
  date: string; // YYYY-MM-DD in local timezone
  leaderId: Types.ObjectId;
  status: CheckDailyStatus;
  items: ICheckDailyItem[];
  logtimeUsers: ICheckDailyLogtime[];
  plannedTasks: IPlannedTask[];
  createdAt: Date;
  updatedAt: Date;
}

const CheckDailyItemSchema = new Schema<ICheckDailyItem>(
  {
    type: { type: String, enum: ["logtime", "meeting", "report", "task_planning"], required: true },
    isChecked: { type: Boolean, default: false },
    note: { type: String, default: "" },
    checkedAt: { type: Date, default: null },
  },
  { _id: false }
);

const CheckDailyLogtimeSchema = new Schema<ICheckDailyLogtime>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    expectedHours: { type: Number, default: 8 },
    actualHours: { type: Number, default: 0 },
    status: { type: String, enum: ["OK", "Missing", "Not logged"], default: "Not logged" },
    reviewed: { type: Boolean, default: false },
  },
  { _id: false }
);

const PlannedTaskSchema = new Schema<IPlannedTask>(
  {
    title: { type: String, required: true, trim: true },
    assignedUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignedUserName: { type: String, required: true },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    deadline: { type: Date, required: true },
    createdTaskId: { type: Schema.Types.ObjectId, ref: "Task", default: null },
  },
  { _id: false }
);

const CheckDailySchema = new Schema<ICheckDaily>(
  {
    date: { type: String, required: true, index: true },
    leaderId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: { type: String, enum: ["in_progress", "completed"], default: "in_progress" },
    items: { type: [CheckDailyItemSchema], default: [] },
    logtimeUsers: { type: [CheckDailyLogtimeSchema], default: [] },
    plannedTasks: { type: [PlannedTaskSchema], default: [] },
  },
  { timestamps: true }
);

CheckDailySchema.index({ date: 1, leaderId: 1 }, { unique: true });

export const CheckDaily: Model<ICheckDaily> =
  mongoose.models.CheckDaily ?? mongoose.model<ICheckDaily>("CheckDaily", CheckDailySchema);

export default CheckDaily;
