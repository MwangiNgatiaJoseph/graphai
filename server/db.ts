import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, graphSessions, chatMessages } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Ethical Hacking Feature Queries

import { securityScans, vulnerabilityReports, ctfChallenges, educationalResources, InsertSecurityScan, InsertVulnerabilityReport, InsertCtfChallenge, InsertEducationalResource } from "../drizzle/security_schema";

export async function createSecurityScan(scan: InsertSecurityScan) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create security scan: database not available");
    return;
  }
  return db.insert(securityScans).values(scan);
}

export async function getSecurityScansByUserId(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get security scans: database not available");
    return [];
  }
  return db.select().from(securityScans).where(eq(securityScans.userId, userId));
}

export async function createVulnerabilityReport(report: InsertVulnerabilityReport) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create vulnerability report: database not available");
    return;
  }
  return db.insert(vulnerabilityReports).values(report);
}

export async function getVulnerabilityReportsByUserId(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get vulnerability reports: database not available");
    return [];
  }
  return db.select().from(vulnerabilityReports).where(eq(vulnerabilityReports.userId, userId));
}

export async function createCtfChallenge(challenge: InsertCtfChallenge) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create CTF challenge: database not available");
    return;
  }
  return db.insert(ctfChallenges).values(challenge);
}

export async function getCtfChallenges() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get CTF challenges: database not available");
    return [];
  }
  return db.select().from(ctfChallenges);
}

export async function createEducationalResource(resource: InsertEducationalResource) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create educational resource: database not available");
    return;
  }
  return db.insert(educationalResources).values(resource);
}

export async function getEducationalResources() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get educational resources: database not available");
    return [];
  }
  return db.select().from(educationalResources);
}

/**
 * Graph Sessions Queries
 */
export async function createGraphSession(
  userId: number,
  data: {
    title: string;
    description?: string;
    imageUrl?: string;
    imageKey?: string;
    imageMimeType?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(graphSessions).values({
    userId,
    ...data,
  });

  return result;
}

export async function getGraphSessionById(sessionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(graphSessions)
    .where(eq(graphSessions.id, sessionId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserGraphSessions(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(graphSessions)
    .where(eq(graphSessions.userId, userId))
    .orderBy(graphSessions.createdAt);

  return result;
}

export async function getAllGraphSessions() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(graphSessions)
    .orderBy(graphSessions.createdAt);

  return result;
}

/**
 * Chat Messages Queries
 */
export async function createChatMessage(
  sessionId: number,
  role: "user" | "assistant",
  content: string,
  metadata?: Record<string, unknown>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(chatMessages).values({
    sessionId,
    role,
    content,
    metadata: metadata ? JSON.stringify(metadata) : null,
  });

  return result;
}

export async function getSessionMessages(sessionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(chatMessages.createdAt);

  return result;
}

export async function getAllMessages() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(chatMessages)
    .orderBy(chatMessages.createdAt);

  return result;
}
