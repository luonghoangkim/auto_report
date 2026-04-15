import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IProject extends Document {
  name: string;
  description?: string;
  createdBy: Types.ObjectId;
  members: Types.ObjectId[];
  status: "active" | "paused" | "completed" | "archived";
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    name:        { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    createdBy:   { type: Schema.Types.ObjectId, ref: "User", required: true },
    members:     [{ type: Schema.Types.ObjectId, ref: "User" }],
    status:      { type: String, enum: ["active", "paused", "completed", "archived"], default: "active" },
  },
  { timestamps: true }
);

ProjectSchema.index({ createdBy: 1 });

export const Project: Model<IProject> =
  mongoose.models.Project ?? mongoose.model<IProject>("Project", ProjectSchema);

export default Project;
