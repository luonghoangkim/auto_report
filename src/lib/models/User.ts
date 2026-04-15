import mongoose, { Schema, Document, Model } from "mongoose";

export type UserRole = "admin" | "leader" | "member";

export interface IUser extends Document {
  username: string;
  passwordHash: string;
  name?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username:     { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    name:         { type: String, trim: true },
    role:         { type: String, enum: ["admin", "leader", "member"], default: "leader" },
  },
  { timestamps: true }
);

export const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);

export default User;
