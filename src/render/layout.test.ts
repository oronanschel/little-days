import { describe, expect, it } from 'vitest';
import { CORE, CORE_ROOM, STAGE, frameFor, visibleRect, type Rect } from './layout';

const contains = (outer: Rect, inner: Rect) =>
  inner.x >= outer.x - 1e-6 &&
  inner.y >= outer.y - 1e-6 &&
  inner.x + inner.width <= outer.x + outer.width + 1e-6 &&
  inner.y + inner.height <= outer.y + outer.height + 1e-6;

const SCREENS: [number, number][] = [
  [768, 1024],
  [390, 844],
  [1280, 800],
  [1920, 1080],
  [1024, 768],
  [2732, 2048],
];

describe('frameFor', () => {
  it('always shows the core play area', () => {
    for (const [w, h] of SCREENS) expect(contains(visibleRect(frameFor(w, h, null), w, h), CORE)).toBe(true);
  });

  it('zooms in on portrait screens compared with letterboxing the whole stage', () => {
    const letterbox = Math.min(768 / 1600, 1024 / 1000);
    expect(frameFor(768, 1024, null).scale).toBeGreaterThan(letterbox * 1.3);
  });

  it('keeps landscape screens the same as before', () => {
    for (const [w, h] of [[1280, 800], [1920, 1080]]) {
      expect(frameFor(w, h, null).scale).toBeCloseTo(Math.min(w / 1600, h / 1000));
    }
  });

  it('never hides a toy the child put near the edge', () => {
    const hat: Rect = { x: 20, y: 880, width: 70, height: 50 };
    for (const [w, h] of SCREENS) {
      const v = visibleRect(frameFor(w, h, hat), w, h);
      expect(contains(v, hat)).toBe(true);
      expect(contains(v, CORE)).toBe(true);
    }
  });

  it('zooms further in the living room, where only the sofa and the family must show', () => {
    const family: Rect = { x: 350, y: 560, width: 920, height: 380 };
    const room = frameFor(768, 1024, family, CORE_ROOM);
    const sea = frameFor(768, 1024, family, CORE);
    expect(room.scale).toBeGreaterThan(sea.scale * 1.1);
    const v = visibleRect(room, 768, 1024);
    expect(contains(v, family)).toBe(true);
    expect(contains(v, CORE_ROOM)).toBe(true);
  });

  it('stays on the stage when the screen is narrower than it', () => {
    const v = visibleRect(frameFor(768, 1024, null), 768, 1024);
    expect(v.x).toBeGreaterThanOrEqual(STAGE.x - 1e-6);
    expect(v.x + v.width).toBeLessThanOrEqual(STAGE.width + 1e-6);
  });
});
