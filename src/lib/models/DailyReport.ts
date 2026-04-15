import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IDailyReport extends Document {
  projectId: Types.ObjectId;
  rawText: string;
  rawHash: string;          // SHA-256 of rawText – used to prevent duplicate imports
  sourceName?: string;      // optional source label (e.g. "slack export 2024-05-01")
  reportDate?: Date;        // best-guess date from raw text
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DailyReportSchema = new Schema<IDailyReport>(
  {
    projectId:  { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    rawText:    { type: String, required: true },
    rawHash:    { type: String, required: true },
    sourceName: { type: String },
    reportDate: { type: Date },
    createdBy:  { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// Prevent importing the same raw text into the same project twice
DailyReportSchema.index({ projectId: 1, rawHash: 1 }, { unique: true });

export const DailyReport: Model<IDailyReport> =
  mongoose.models.DailyReport ??
  mongoose.model<IDailyReport>("DailyReport", DailyReportSchema);

export default DailyReport;
