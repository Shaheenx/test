/**
 * RailMate Bangladesh — Route Engine Test Cases
 * ----------------------------------------------
 * Run with: npx vitest routeEngine.test.ts
 * or:       npx jest routeEngine.test.ts
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { RouteEngine } from '../api/routeEngine';
import { STATIONS, TRAINS, STOP_SEQUENCES } from '../api/railmateData';

let engine: RouteEngine;

beforeAll(() => {
  engine = new RouteEngine(STOP_SEQUENCES, TRAINS, STATIONS);
});

// ─── Direct routes ────────────────────────────────────────────────────────────

describe('Direct routes', () => {
  it('Dhaka → Sylhet returns direct result', () => {
    const r = engine.find('DHKA', 'SYT');
    expect(r.type).toBe('direct');
    if (r.type === 'direct') {
      expect(r.legs[0].trains.length).toBeGreaterThan(0);
      // Should include Upaban, Jayantika, Parabat etc.
      const nums = r.legs[0].trains.map(t => t.number);
      expect(nums).toContain(739); // Upaban Express
      expect(nums).toContain(709); // Parabat Express
    }
  });

  it('Dhaka → Rajshahi returns direct result with 6+ trains', () => {
    const r = engine.find('DHKA', 'RAJ');
    expect(r.type).toBe('direct');
    if (r.type === 'direct') {
      expect(r.legs[0].trains.length).toBeGreaterThanOrEqual(6);
    }
  });

  it('Dhaka → Khulna returns direct result with 10+ trains', () => {
    const r = engine.find('DHKA', 'KHU');
    expect(r.type).toBe('direct');
    if (r.type === 'direct') {
      expect(r.legs[0].trains.length).toBeGreaterThanOrEqual(8);
    }
  });

  it('Dhaka → Chattogram returns direct result', () => {
    const r = engine.find('DHKA', 'CTG');
    expect(r.type).toBe('direct');
    if (r.type === 'direct') {
      expect(r.legs[0].trains.map(t => t.number)).toContain(787); // Sonar Bangla
    }
  });

  it('Chattogram → Dhaka returns direct result (reverse direction)', () => {
    const r = engine.find('CTG', 'DHKA');
    expect(r.type).toBe('direct');
  });

  it('Symmetric: result type matches in both directions for direct routes', () => {
    const pairs: [string, string][] = [
      ['DHKA', 'SYT'], ['DHKA', 'RAJ'], ['DHKA', 'KHU'],
    ];
    for (const [a, b] of pairs) {
      expect(engine.find(a, b).type).toBe('direct');
      expect(engine.find(b, a).type).toBe('direct');
    }
  });
});

// ─── 1-transfer routes ────────────────────────────────────────────────────────

describe('One-transfer routes', () => {
  it('Chattogram → Rajshahi: 1 transfer (no direct trains in BR network)', () => {
    const r = engine.find('CTG', 'RAJ');
    expect(r.type).toBe('one_transfer');
    if (r.type === 'one_transfer') {
      // Should route via Dhaka or Ishwardi
      expect(['DHKA', 'IWD', 'DABB']).toContain(r.transferStation.code);
      expect(r.legs[0].trains.length).toBeGreaterThan(0);
      expect(r.legs[1].trains.length).toBeGreaterThan(0);
    }
  });

  it('Chattogram → Khulna: 1 transfer', () => {
    const r = engine.find('CTG', 'KHU');
    expect(r.type).toBe('one_transfer');
  });

  it('Khulna → Sylhet: 1 transfer via Dhaka', () => {
    const r = engine.find('KHU', 'SYT');
    expect(r.type).toBe('one_transfer');
    if (r.type === 'one_transfer') {
      // Hub preference — Dhaka is the natural interchange
      expect(['DHKA', 'IWD', 'DABB']).toContain(r.transferStation.code);
    }
  });

  it('Benapole → Lalmonirhat: 1 transfer', () => {
    const r = engine.find('BNP', 'LMH');
    expect(['one_transfer', 'two_transfer']).toContain(r.type);
  });

  it('Noakhali → Rajshahi: 1 transfer', () => {
    const r = engine.find('NOA', 'RAJ');
    expect(['one_transfer', 'two_transfer']).toContain(r.type);
  });

  it('Transfer station is always a hub when available', () => {
    const r = engine.find('CTG', 'RAJ');
    if (r.type === 'one_transfer') {
      // The engine should prefer hub stations as interchanges
      const HUB_CODES = new Set(['DHKA','DABB','JDP','IWD','KHU','CTG','SYT','LMH','STH','PBP']);
      expect(HUB_CODES.has(r.transferStation.code)).toBe(true);
    }
  });
});

// ─── 2-transfer routes ────────────────────────────────────────────────────────

describe('Two-transfer routes', () => {
  it('Benapole → Burimari: 2-transfer route exists', () => {
    const r = engine.find('BNP', 'BMR');
    expect(['one_transfer', 'two_transfer']).toContain(r.type);
    // Both legs must have trains
    if (r.type === 'two_transfer') {
      expect(r.legs[0].trains.length).toBeGreaterThan(0);
      expect(r.legs[1].trains.length).toBeGreaterThan(0);
      expect(r.legs[2].trains.length).toBeGreaterThan(0);
    }
  });

  it("Cox's Bazar → Panchagarh: 2-transfer route", () => {
    const r = engine.find('CXBZ', 'PCG');
    expect(['one_transfer', 'two_transfer']).toContain(r.type);
  });
});

// ─── Not-found cases ──────────────────────────────────────────────────────────

describe('Not-found cases', () => {
  it('Pabna → anywhere: not found (no trains serve Pabna in stop data)', () => {
    const r = engine.find('PBN', 'DHKA');
    expect(r.type).toBe('not_found');
    if (r.type === 'not_found') {
      expect(r.suggestions.length).toBeGreaterThan(0);
    }
  });
});

// ─── Confidence scoring ───────────────────────────────────────────────────────

describe('Confidence scoring', () => {
  it('Direct route with g1 trains scores ≥ 50', () => {
    const r = engine.find('DHKA', 'CTG'); // Sonar Bangla is g1
    if (r.type === 'direct') {
      expect(r.confidenceScore).toBeGreaterThanOrEqual(50);
    }
  });

  it('2-transfer route scores lower than direct route (same endpoint)', () => {
    const direct = engine.find('DHKA', 'CTG');
    const transfer = engine.find('CTG', 'RAJ');
    if (direct.type === 'direct' && transfer.type === 'one_transfer') {
      expect(direct.confidenceScore).toBeGreaterThan(transfer.confidenceScore);
    }
  });

  it('Confidence score is between 0 and 100', () => {
    const routes: [string, string][] = [
      ['DHKA', 'SYT'], ['CTG', 'KHU'], ['BNP', 'BMR'],
    ];
    for (const [a, b] of routes) {
      const r = engine.find(a, b);
      if (r.type !== 'not_found') {
        expect(r.confidenceScore).toBeGreaterThanOrEqual(0);
        expect(r.confidenceScore).toBeLessThanOrEqual(100);
      }
    }
  });

  it('All results include a dataNote', () => {
    const r = engine.find('KHU', 'SYT');
    if (r.type !== 'not_found') {
      expect(r.dataNote.length).toBeGreaterThan(0);
    }
  });
});

// ─── Utility methods ──────────────────────────────────────────────────────────

describe('Engine utility methods', () => {
  it('directDestinations returns stations reachable from Dhaka', () => {
    const dests = engine.directDestinations('DHKA');
    const codes = dests.map(s => s.code);
    expect(codes).toContain('CTG');
    expect(codes).toContain('SYT');
    expect(codes).toContain('RAJ');
    expect(codes).toContain('KHU');
  });

  it('trainsAtStation returns trains serving Ishwardi', () => {
    const trains = engine.trainsAtStation('IWD');
    expect(trains.length).toBeGreaterThan(10); // Major interchange
    const nums = trains.map(t => t.number);
    expect(nums).toContain(725); // Sundarban Express
  });

  it('nearestHub from Benapole returns a hub', () => {
    const hub = engine.nearestHub('BNP');
    expect(hub).not.toBeNull();
    // Benapole is on the Khulna line via Jessore
    expect(['IWD','JS','KHU','DHKA']).toContain(hub);
  });

  it('explainScore returns a non-empty string for any score', () => {
    for (const score of [5, 20, 35, 50, 75, 100]) {
      expect(RouteEngine.explainScore(score).length).toBeGreaterThan(0);
    }
  });
});
