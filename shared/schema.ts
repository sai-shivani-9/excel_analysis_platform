import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull().unique(),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Files table
export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size").notNull(),
  headers: json("headers").notNull(),
  data: json("data").notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Charts table
export const charts = pgTable("charts", {
  id: serial("id").primaryKey(),
  name: text("name"),
  fileId: integer("file_id").notNull().references(() => files.id),
  userId: integer("user_id").notNull().references(() => users.id),
  chartType: text("chart_type").notNull(),
  xAxis: text("x_axis").notNull(),
  yAxis: text("y_axis").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Shared charts table
export const sharedCharts = pgTable("shared_charts", {
  id: serial("id").primaryKey(),
  chartId: integer("chart_id").notNull().references(() => charts.id),
  sharedByUserId: integer("shared_by_user_id").notNull().references(() => users.id),
  sharedWithUserId: integer("shared_with_user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Activities table
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  fileId: integer("file_id").references(() => files.id),
  chartId: integer("chart_id").references(() => charts.id),
  type: text("type").notNull(), // 'upload', 'chart', 'download', 'share'
  description: text("description").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Define relationships
export const usersRelations = relations(users, ({ many }) => ({
  files: many(files),
  charts: many(charts),
  sharedByMe: many(sharedCharts, { relationName: "sharedByUser" }),
  sharedWithMe: many(sharedCharts, { relationName: "sharedWithUser" }),
}));

export const filesRelations = relations(files, ({ one, many }) => ({
  user: one(users, { fields: [files.userId], references: [users.id] }),
  charts: many(charts),
}));

export const chartsRelations = relations(charts, ({ one, many }) => ({
  file: one(files, { fields: [charts.fileId], references: [files.id] }),
  user: one(users, { fields: [charts.userId], references: [users.id] }),
  sharedWith: many(sharedCharts),
}));

export const sharedChartsRelations = relations(sharedCharts, ({ one }) => ({
  chart: one(charts, { fields: [sharedCharts.chartId], references: [charts.id] }),
  sharedByUser: one(users, { fields: [sharedCharts.sharedByUserId], references: [users.id], relationName: "sharedByUser" }),
  sharedWithUser: one(users, { fields: [sharedCharts.sharedWithUserId], references: [users.id], relationName: "sharedWithUser" }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, { fields: [activities.userId], references: [users.id] }),
  file: one(files, { fields: [activities.fileId], references: [files.id] }),
  chart: one(charts, { fields: [activities.chartId], references: [charts.id] }),
}));

// Schemas for validation
export const insertUserSchema = createInsertSchema(users, {
  email: (schema) => schema.email("Please enter a valid email address"),
  displayName: (schema) => schema.min(2, "Display name must be at least 2 characters"),
});

export const insertFileSchema = createInsertSchema(files);
export const insertChartSchema = createInsertSchema(charts);
export const insertSharedChartSchema = createInsertSchema(sharedCharts);
export const insertActivitySchema = createInsertSchema(activities);
