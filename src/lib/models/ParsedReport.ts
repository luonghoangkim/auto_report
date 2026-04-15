import mongoose, { Schema, Document, Model, Types } from "mongoose";

/** One extracted member report inside a parsed batch */
export interface IMemberReport {
  memberName: string;
  reportDate?: string;        // ISO date string
  session?: string;           // morning / afternoon / full-day
  tasks: IExtractedTask[];
  issues?: string;
  supportNeeded?: string;
  supportGiven?: string;
  nextTasks?: string;
  links?: string[];
  rawBlock?: string;          // original text slice for this member
  confidence: number;         // 0-1 overall confidence
}

export interface IExtractedTask {
  title: string;
  moduleTag?: string;
  projectTag?: string;
  progress?: number;          // 0-100
  subtasks?: string[];
  links?: string[];
  confidence: number;
}

export interface IParsedReport extends Document {
  dailyReportId: Types.ObjectId;
  memberReports: IMemberReport[];
  aiProvider: string;         // which provider was used
  parseStatus: "pending" | "reviewed" | "saved";
  createdAt: Date;
  updatedAt: Date;
}

const ExtractedTaskSchema = new Schema<IExtractedTask>(
  {
    title:      { type: String, required: true },
    moduleTag:  { type: String },
    projectTag: { type: String },
    progress:   { type: Number, min: 0, max: 100 },
    subtasks:   [{ type: String }],
    links:      [{ type: String }],
    confidence: { type: Number, default: 0.5 },
  },
  { _id: false }
);

const MemberReportSchema = new Schema<IMemberReport>(
  {
    memberName:    { type: String, required: true },
    reportDate:    { type: String },
    session:       { type: String },
    tasks:         [ExtractedTaskSchema],
    issues:        { type: String },
    supportNeeded: { type: String },
    supportGiven:  { type: String },
    nextTasks:     { type: String },
    links:         [{ type: String }],
    rawBlock:      { type: String },
    confidence:    { type: Number, default: 0.5 },
  },
  { _id: false }
);

const ParsedReportSchema = new Schema<IParsedReport>(
  {
    dailyReportId: { type: Schema.Types.ObjectId, ref: "DailyReport", required: true, index: true },
    memberReports: [MemberReportSchema],
    aiProvider:    { type: String, default: "deterministic" },
    parseStatus:   { type: String, enum: ["pending", "reviewed", "saved"], default: "pending" },
  },
  { timestamps: true }
);

export const ParsedReport: Model<IParsedReport> =
  mongoose.models.ParsedReport ??
  mongoose.model<IParsedReport>("ParsedReport", ParsedReportSchema);

export default ParsedReport;
