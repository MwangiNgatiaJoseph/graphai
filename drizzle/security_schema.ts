import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const securityScans = mysqlTable("security_scans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  scanType: mysqlEnum("scan_type", ["network", "web", "vulnerability", "code"]).notNull(),
  target: varchar("target", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["pending", "running", "completed", "failed"]).default("pending").notNull(),
  results: text("results"), // JSON string of scan results
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type SecurityScan = typeof securityScans.$inferSelect;
export type InsertSecurityScan = typeof securityScans.$inferInsert;

export const vulnerabilityReports = mysqlTable("vulnerability_reports", {
  id: int("id").autoincrement().primaryKey(),
  scanId: int("scan_id"),
  userId: int("user_id").notNull(),
  vulnerabilityName: varchar("vulnerability_name", { length: 255 }).notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).notNull(),
  description: text("description"),
  recommendation: text("recommendation"),
  status: mysqlEnum("status", ["open", "fixed", "false_positive"]).default("open").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type VulnerabilityReport = typeof vulnerabilityReports.$inferSelect;
export type InsertVulnerabilityReport = typeof vulnerabilityReports.$inferInsert;

export const ctfChallenges = mysqlTable("ctf_challenges", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard", "expert"]).notNull(),
  flag: varchar("flag", { length: 255 }).notNull(),
  solution: text("solution"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type CtfChallenge = typeof ctfChallenges.$inferSelect;
export type InsertCtfChallenge = typeof ctfChallenges.$inferInsert;

export const educationalResources = mysqlTable("educational_resources", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  category: mysqlEnum("category", ["web_security", "network_security", "cryptography", "reverse_engineering", "forensics", "malware_analysis"]).notNull(),
  content: text("content"), // Markdown content for the resource
  authorId: int("author_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type EducationalResource = typeof educationalResources.$inferSelect;
export type InsertEducationalResource = typeof educationalResources.$inferInsert;
