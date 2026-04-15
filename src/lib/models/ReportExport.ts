import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type ReportType = "weekly" | "monthly" | "project";

export interface IReportExport extends Document {
  projectId: Types.ObjectId;
  type: ReportType;
  dateRange: { from: Date; to: Date };
  content: string;        // generated report text / markdown
  fileName: string;       // e.g. "weekly-report-2024-W20.docx"
  createdBy: Types.ObjectId;
  createdAt: Date;
}

const ReportExportSchema = new Schema<IReportExport>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    type:      { type: String, enum: ["weekly", "monthly", "project"], required: true },
    dateRange: {
      from: { type: Date, required: true },
      to:   { type: Date, required: true },
    },
    content:   { type: String, required: true },
    fileName:  { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const ReportExport: Model<IReportExport> =
  mongoose.models.ReportExport ??
  mongoose.model<IReportExport>("ReportExport", ReportExportSchema);

export default ReportExport;
