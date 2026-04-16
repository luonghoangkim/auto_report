import mongoose, { Schema, Document, Model, Types } from "mongoose";

/** One extracted member report inside a parsed batch */
export interface IMemberReport {
  memberName: string;
  reportDate?: string;        // ISO date string
  session?: "Sáng" | "Chiều" | "Cả ngày";
  tasks: IExtractedTask[];
  haveTrouble?: string;
  supported?: string;
  needSupport?: string;
  nextTask?: string;
  links?: string[];
  rawBlock?: string;          // original text slice for this member
  confidence: number;         // 0-1 overall confidence
}

export interface IBugMetrics {
  total: number;
  critical: number;
  major: number;
  minor: number;
  fixed: number;
  open: number;
}

export interface IExtractedTask {
  title: string;
  moduleTag?: string;
  projectTag?: string;
  progress?: number;          // 0-100
  deadline?: Date | null;
  bugMetrics?: IBugMetrics;
  description?: string;
  isSupport?: boolean;
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

const BugMetricsSchema = new Schema<IBugMetrics>(
  {
    total:    { type: Number, required: true, min: 0 },
    critical: { type: Number, required: true, min: 0 },
    major:    { type: Number, required: true, min: 0 },
    minor:    { type: Number, required: true, min: 0 },
    fixed:    { type: Number, required: true, min: 0 },
    open:     { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const ExtractedTaskSchema = new Schema<IExtractedTask>(
  {
    title:      { type: String, required: true },
    moduleTag:  { type: String },
    projectTag: { type: String },
    progress:   { type: Number, min: 0, max: 100 },
    deadline:   { type: Date, default: null },
    bugMetrics: { type: BugMetricsSchema },
    description:{ type: String },
    isSupport:  { type: Boolean, default: false },
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
    haveTrouble:   { type: String },
    supported:     { type: String },
    needSupport:   { type: String },
    nextTask:      { type: String },
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
