import assert from "node:assert/strict";
import test from "node:test";
import { buildCookTimeline } from "./cookTimeline.ts";

test("buildCookTimeline schedules each recipe to end at serve time", () => {
  const now = new Date("2025-01-01T00:00:00.000Z");
  const serveAt = new Date("2025-01-01T01:30:00.000Z");

  const timeline = buildCookTimeline({
    now,
    meal: { id: "m1", title: "Dinner", serveAt },
    recipes: [
      {
        id: "r1",
        title: "Dish A",
        steps: [
          {
            id: "s1",
            order: 1,
            instruction: "Prep",
            durationMin: 10,
            activeType: "active",
            canPause: false,
            equipmentUsed: null,
            temperatureValue: null,
            temperatureUnit: null,
          },
          {
            id: "s2",
            order: 2,
            instruction: "Bake",
            durationMin: 30,
            activeType: "passive",
            canPause: true,
            equipmentUsed: ["oven"],
            temperatureValue: 400,
            temperatureUnit: "F",
          },
        ],
      },
      {
        id: "r2",
        title: "Dish B",
        steps: [
          {
            id: "s1",
            order: 1,
            instruction: "Boil",
            durationMin: 20,
            activeType: "passive",
            canPause: true,
            equipmentUsed: ["stove"],
            temperatureValue: null,
            temperatureUnit: null,
          },
          {
            id: "s2",
            order: 2,
            instruction: "Season",
            durationMin: 5,
            activeType: "active",
            canPause: false,
            equipmentUsed: null,
            temperatureValue: null,
            temperatureUnit: null,
          },
        ],
      },
    ],
  });

  const dishALast = timeline.steps.find((step) => step.id === "r1:s2");
  assert.ok(dishALast);
  assert.equal(dishALast.endTime.toISOString(), serveAt.toISOString());

  const dishBLast = timeline.steps.find((step) => step.id === "r2:s2");
  assert.ok(dishBLast);
  assert.equal(dishBLast.endTime.toISOString(), serveAt.toISOString());

  const dishAFirst = timeline.steps.find((step) => step.id === "r1:s1");
  const dishBFirst = timeline.steps.find((step) => step.id === "r2:s1");
  assert.ok(dishAFirst);
  assert.ok(dishBFirst);
  assert.equal(dishAFirst.startTime.toISOString(), "2025-01-01T00:50:00.000Z");
  assert.equal(dishBFirst.startTime.toISOString(), "2025-01-01T01:05:00.000Z");

  const latestEnd = timeline.steps
    .map((step) => step.endTime.getTime())
    .reduce((a, b) => Math.max(a, b), 0);
  assert.equal(latestEnd, serveAt.getTime());
});

test("buildCookTimeline uses default serveAt and estimated durations", () => {
  const now = new Date("2025-01-01T00:00:00.000Z");
  const timeline = buildCookTimeline({
    now,
    meal: { id: "m1", title: "Dinner", serveAt: null },
    recipes: [
      {
        id: "r1",
        title: "Dish",
        steps: [
          {
            id: "s1",
            order: 1,
            instruction: "Prep",
            durationMin: null,
            activeType: "active",
            canPause: false,
            equipmentUsed: null,
            temperatureValue: null,
            temperatureUnit: null,
          },
        ],
      },
    ],
  });

  assert.equal(timeline.serveAtIsEstimated, true);
  assert.equal(timeline.serveAt.toISOString(), "2025-01-01T01:30:00.000Z");
  assert.equal(timeline.steps[0]?.durationMin, 2);
  assert.equal(timeline.steps[0]?.isEstimatedDuration, true);
});

test("rounding places 87 minutes at T-85", () => {
  const serveAt = new Date("2025-01-01T01:30:00.000Z");
  const stepStart = new Date("2025-01-01T00:03:00.000Z"); // 87 min before
  const timeline = buildCookTimeline({
    now: new Date("2025-01-01T00:00:00.000Z"),
    meal: { id: "m1", title: "Dinner", serveAt },
    recipes: [
      {
        id: "r1",
        title: "Dish",
        steps: [
          {
            id: "s1",
            order: 1,
            instruction: "Long step",
            durationMin: 87,
            activeType: "passive",
            canPause: true,
            equipmentUsed: null,
            temperatureValue: null,
            temperatureUnit: null,
          },
        ],
      },
    ],
  });

  const step = timeline.steps[0];
  assert.ok(step);
  assert.equal(step.startTime.toISOString(), stepStart.toISOString());
  assert.equal(step.tMinusMin, 85);
});
