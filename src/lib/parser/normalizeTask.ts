/**
 * normalizeTask.ts
 *
 * Deduplicates and merges tasks from multiple daily reports into a
 * canonical task list for a project.
 *
 * Strategy:
 * 1. Exact title match (same project, same PIC)
 * 2. Fuzzy match via Fuse.js (threshold 0.4)
 * 3. Same PIC + shared module tag → merge if similarity > threshold
 *
 * On merge: updates progress, lastUpdatedAt, and appends to history.
 */

import Fuse from "fuse.js";
import type { ITask } from "../models/Task";

export interface TaskInput {
  title:    string;
  picName:  string;
  progress: number;
  tags:     string[];
  links:    string[];
  deadline?: Date | null;
  bugMetrics?: {
    total: number;
    critical: number;
    major: number;
    minor: number;
    fixed: number;
    open: number;
  };
  reportId: string;
  date:     Date;
}

export interface ExistingTask {
  _id:      string;
  title:    string;
  picName:  string;
  progress: number;
  tags:     string[];
  links:    string[];
  deadline?: Date | null;
  bugMetrics?: {
    total: number;
    critical: number;
    major: number;
    minor: number;
    fixed: number;
    open: number;
  };
  status:   ITask["status"];
}

export interface TaskToCreate {
  title:     string;
  picName:   string;
  progress:  number;
  tags:      string[];
  links:     string[];
  deadline?: Date | null;
  bugMetrics?: ExistingTask["bugMetrics"];
  reportIds: string[];
  status:    ITask["status"];
  history:   { progress: number; reportId: string; date: Date }[];
}

export interface TaskToUpdate {
  id:           string;
  progress:     number;
  status:       ITask["status"];
  historyEntry: { progress: number; reportId: string; date: Date };
  links:        string[];
  tags:         string[];
  deadline?: Date | null;
  bugMetrics?: ExistingTask["bugMetrics"];
}

const FUZZY_THRESHOLD = 0.4;

function mergeBugMetrics(
  existing?: ExistingTask["bugMetrics"],
  incoming?: TaskInput["bugMetrics"]
) {
  return incoming ?? existing;
}

function progressToStatus(p: number): ITask["status"] {
  if (p === 0)   return "todo";
  if (p < 80)    return "doing";
  if (p < 100)   return "review";
  return "done";
}

/**
 * Given a list of new task inputs and the existing tasks for a project,
 * returns two lists: tasks to create (new) and tasks to update (existing + diff).
 */
export function normalizeAndMergeTasks(
  inputs: TaskInput[],
  existing: ExistingTask[]
): {
  toCreate: TaskToCreate[];
  toUpdate: TaskToUpdate[];
} {
  const toCreate: TaskToCreate[] = [];
  const toUpdate: TaskToUpdate[] = [];

  const fuse = new Fuse(existing, {
    keys: ["title"],
    threshold: FUZZY_THRESHOLD,
    includeScore: true,
  });

  for (const input of inputs) {
    // 1. Exact match (case-insensitive, same PIC)
    const exactMatch = existing.find(
      (e) =>
        e.title.toLowerCase().trim() === input.title.toLowerCase().trim() &&
        e.picName.toLowerCase() === input.picName.toLowerCase()
    );

    if (exactMatch) {
      toUpdate.push({
        id:           exactMatch._id,
        progress:     Math.max(exactMatch.progress, input.progress),
        status:       progressToStatus(Math.max(exactMatch.progress, input.progress)),
        historyEntry: { progress: input.progress, reportId: input.reportId, date: input.date },
        links:        Array.from(new Set([...exactMatch.links, ...input.links])),
        tags:         Array.from(new Set([...exactMatch.tags, ...input.tags])),
        deadline:     input.deadline ?? exactMatch.deadline ?? null,
        bugMetrics:   mergeBugMetrics(exactMatch.bugMetrics, input.bugMetrics),
      });
      continue;
    }

    // 2. Fuzzy match
    const fuzzyResults = fuse.search(input.title);
    const bestFuzzy = fuzzyResults[0];
    if (
      bestFuzzy &&
      bestFuzzy.score !== undefined &&
      bestFuzzy.score < FUZZY_THRESHOLD &&
      bestFuzzy.item.picName.toLowerCase() === input.picName.toLowerCase()
    ) {
      const existing_ = bestFuzzy.item;
      toUpdate.push({
        id:           existing_._id,
        progress:     Math.max(existing_.progress, input.progress),
        status:       progressToStatus(Math.max(existing_.progress, input.progress)),
        historyEntry: { progress: input.progress, reportId: input.reportId, date: input.date },
        links:        Array.from(new Set([...existing_.links, ...input.links])),
        tags:         Array.from(new Set([...existing_.tags, ...input.tags])),
        deadline:     input.deadline ?? existing_.deadline ?? null,
        bugMetrics:   mergeBugMetrics(existing_.bugMetrics, input.bugMetrics),
      });
      continue;
    }

    // 3. New task
    toCreate.push({
      title:     input.title,
      picName:   input.picName,
      progress:  input.progress,
      tags:      input.tags,
      links:     input.links,
      deadline:  input.deadline ?? null,
      bugMetrics: input.bugMetrics,
      reportIds: [input.reportId],
      status:    progressToStatus(input.progress),
      history:   [{ progress: input.progress, reportId: input.reportId, date: input.date }],
    });
  }

  return { toCreate, toUpdate };
}
