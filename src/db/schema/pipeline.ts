import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const pipelineRuns = sqliteTable("pipeline_runs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  stage: text("stage").notNull(),
  startedAt: integer("started_at", { mode: "timestamp" }).notNull(),
  finishedAt: integer("finished_at", { mode: "timestamp" }),
  status: text("status").notNull(),
  inputCount: integer("input_count"),
  outputCount: integer("output_count"),
  rejectedCount: integer("rejected_count"),
  errorLog: text("error_log"),
  meta: text("meta", { mode: "json" })
});

export const qualityGateFailures = sqliteTable("quality_gate_failures", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  plantId: integer("plant_id"),
  contentId: integer("content_id"),
  gate: text("gate").notNull(),
  reason: text("reason").notNull(),
  detectedAt: integer("detected_at", { mode: "timestamp" }).notNull(),
  resolved: integer("resolved", { mode: "boolean" }).default(false)
});

export const lintViolations = sqliteTable("lint_violations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contentId: integer("content_id").notNull(),
  rule: text("rule").notNull(),
  word: text("word"),
  field: text("field"),
  detectedAt: integer("detected_at", { mode: "timestamp" }).notNull()
});

export const publishQueue = sqliteTable(
  "publish_queue",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    plantId: integer("plant_id"),
    guideId: integer("guide_id"),
    scheduledFor: integer("scheduled_for", { mode: "timestamp" }).notNull(),
    priority: integer("priority").default(50),
    attempts: integer("attempts").default(0),
    status: text("status").default("queued")
  },
  (table) => ({
    scheduledIdx: index("publish_queue_scheduled_idx").on(
      table.status,
      table.scheduledFor
    )
  })
);
