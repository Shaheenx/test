/**
 * RailMate Bangladesh — Route Planning Engine
 * -------------------------------------------
 * A knowledge-graph–based journey planner.
 * Finds direct, 1-transfer, and 2-transfer routes across Bangladesh Railway.
 *
 * IMPORTANT: This engine uses synthesised stop data (see PROVENANCE_AUDIT.md).
 * It is a journey-planning aid, NOT an official timetable.
 * All results must be verified at eticket.railway.gov.bd before travel.
 *
 * Sources: amadertrain.com (June 2026), Wikipedia, route interpolation.
 * Verified coverage: 0% against official BR PDF.
 * See PROVENANCE_AUDIT.md for full breakdown.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConfidenceGroup = 'g1' | 'g2' | 'g3' | 'g4' | 'g5';

export type ConfidenceLevel = 'medium' | 'low-medium' | 'low';

export type RouteType = 'direct' | 'one_transfer' | 'two_transfer' | 'not_found';

export interface TrainMeta {
  number: number;
  name: string;
  type: 'intercity' | 'commuter' | 'special';
  confidenceGroup: ConfidenceGroup;
}

export interface Station {
  code: string;
  nameEn: string;
  nameBn?: string;
  shohozCity: string;
  division: string;
  isHub: boolean;
}

export interface JourneyLeg {
  fromCode: string;
  fromName: string;
  toCode: string;
  toName: string;
  trains: TrainMeta[];
  confidence: ConfidenceLevel;
}

export interface DirectJourney {
  type: 'direct';
  legs: [JourneyLeg];
  overallConfidence: ConfidenceLevel;
  confidenceScore: number;         // 0–100
  dataNote: string;
}

export interface OneTransferJourney {
  type: 'one_transfer';
  legs: [JourneyLeg, JourneyLeg];
  transferStation: Station;
  alternativeTransfers: Station[];
  overallConfidence: ConfidenceLevel;
  confidenceScore: number;
  dataNote: string;
}

export interface TwoTransferJourney {
  type: 'two_transfer';
  legs: [JourneyLeg, JourneyLeg, JourneyLeg];
  transferStation1: Station;
  transferStation2: Station;
  overallConfidence: ConfidenceLevel;
  confidenceScore: number;
  dataNote: string;
}

export interface NotFoundResult {
  type: 'not_found';
  reason: string;
  suggestions: string[];
}

export type JourneyResult =
  | DirectJourney
  | OneTransferJourney
  | TwoTransferJourney
  | NotFoundResult;

// ─── Confidence scoring ───────────────────────────────────────────────────────

const CONF_GROUP_SCORES: Record<ConfidenceGroup, number> = {
  g1: 55,  // Wikipedia training memory — unverified against BR PDF
  g2: 50,  // Community source fetch (amadertrain.com) — cleared context
  g3: 35,  // Journey-duration interpolation
  g4: 20,  // Assumption / bulk loop estimate
  g5: 15,  // Minimal origin+destination only
};

const CONF_GROUP_LABELS: Record<ConfidenceGroup, ConfidenceLevel> = {
  g1: 'medium',
  g2: 'medium',
  g3: 'low-medium',
  g4: 'low',
  g5: 'low',
};

/**
 * Returns the worst (lowest) confidence group across a set of trains.
 * Journey confidence is only as good as its weakest leg.
 */
function worstGroup(groups: ConfidenceGroup[]): ConfidenceGroup {
  const order: ConfidenceGroup[] = ['g1', 'g2', 'g3', 'g4', 'g5'];
  return groups.reduce((worst, g) =>
    order.indexOf(g) > order.indexOf(worst) ? g : worst,
    'g1' as ConfidenceGroup
  );
}

function groupFromTrains(trains: TrainMeta[]): ConfidenceGroup {
  return worstGroup(trains.map(t => t.confidenceGroup));
}

function scoreForJourneyType(
  type: RouteType,
  legGroups: ConfidenceGroup[]
): number {
  const baseScore = Math.min(...legGroups.map(g => CONF_GROUP_SCORES[g]));
  const transferPenalty = type === 'one_transfer' ? 10 : type === 'two_transfer' ? 20 : 0;
  return Math.max(5, baseScore - transferPenalty);
}

function confidenceLevelFromScore(score: number): ConfidenceLevel {
  if (score >= 45) return 'medium';
  if (score >= 25) return 'low-medium';
  return 'low';
}

const DATA_NOTES: Record<RouteType, string> = {
  direct:
    'Route times are approximate. Verify departure times at eticket.railway.gov.bd before travel.',
  one_transfer:
    'Transfer times are not shown — connection windows vary. Allow at least 30–60 min at interchange. Verify at eticket.railway.gov.bd.',
  two_transfer:
    'Multi-transfer journey. This is a long-distance connection requiring significant planning. Verify all legs at eticket.railway.gov.bd before booking.',
  not_found:
    'No route found in knowledge graph.',
};

// ─── Hub station preference ───────────────────────────────────────────────────

/**
 * Hub stations are preferred as interchange points.
 * They have more frequent trains and better platform facilities.
 */
const HUB_CODES = new Set([
  'DHKA',  // Dhaka Kamalapur
  'DABB',  // Dhaka Airport
  'JDP',   // Joydebpur
  'TNG',   // Tongi
  'IWD',   // Ishwardi — East/West gateway
  'STH',   // Santahar — North junction
  'PBP',   // Parbatipur — Far-north junction
  'BOG',   // Bogura
  'KHU',   // Khulna
  'CTG',   // Chattogram
  'SYT',   // Sylhet
  'LMH',   // Lalmonirhat
  'MYM',   // Mymensingh
  'COM',   // Comilla
  'AKH',   // Akhaura — Sylhet/CTG junction
  'BBZ',   // Bhairab Bazar
  'NSD',   // Narsingdi
  'RAJ',   // Rajshahi
]);

function rankInterchanges(codes: string[]): string[] {
  return [...codes].sort((a, b) => {
    const aHub = HUB_CODES.has(a) ? 0 : 1;
    const bHub = HUB_CODES.has(b) ? 0 : 1;
    return aHub - bHub;
  });
}

// ─── Graph ────────────────────────────────────────────────────────────────────

type GraphEdge = { to: string; trainNumber: number };
type Graph = Map<string, GraphEdge[]>;

function buildGraph(stopData: Record<number, string[]>): Graph {
  const graph: Graph = new Map();

  function addEdge(from: string, to: string, num: number) {
    if (!graph.has(from)) graph.set(from, []);
    graph.get(from)!.push({ to, trainNumber: num });
  }

  for (const [numStr, codes] of Object.entries(stopData)) {
    const num = parseInt(numStr);
    for (let i = 0; i < codes.length; i++) {
      for (let j = 0; j < codes.length; j++) {
        if (i !== j) addEdge(codes[i], codes[j], num);
      }
    }
  }

  return graph;
}

function getTrainsBetween(
  graph: Graph,
  trainIndex: Map<number, TrainMeta>,
  a: string,
  b: string
): TrainMeta[] {
  const edges = graph.get(a) || [];
  const seen = new Set<number>();
  const result: TrainMeta[] = [];
  for (const edge of edges) {
    if (edge.to === b && !seen.has(edge.trainNumber)) {
      seen.add(edge.trainNumber);
      const meta = trainIndex.get(edge.trainNumber);
      if (meta) result.push(meta);
    }
  }
  return result;
}

// ─── Engine class ─────────────────────────────────────────────────────────────

export class RouteEngine {
  private graph: Graph;
  private trainIndex: Map<number, TrainMeta>;
  private stationIndex: Map<string, Station>;

  constructor(
    stopData: Record<number, string[]>,
    trains: TrainMeta[],
    stations: Station[]
  ) {
    this.graph = buildGraph(stopData);
    this.trainIndex = new Map(trains.map(t => [t.number, t]));
    this.stationIndex = new Map(stations.map(s => [s.code, s]));
  }

  private station(code: string): Station {
    return (
      this.stationIndex.get(code) ?? {
        code,
        nameEn: code,
        shohozCity: code,
        division: 'Unknown',
        isHub: false,
      }
    );
  }

  private makeLeg(from: string, to: string, trains: TrainMeta[]): JourneyLeg {
    const group = groupFromTrains(trains);
    return {
      fromCode: from,
      fromName: this.station(from).nameEn,
      toCode: to,
      toName: this.station(to).nameEn,
      trains,
      confidence: CONF_GROUP_LABELS[group],
    };
  }

  /**
   * Find the best journey between two stations.
   * Searches: direct → 1 transfer → 2 transfers → not_found.
   */
  find(originCode: string, destCode: string): JourneyResult {
    // Direct
    const directTrains = getTrainsBetween(
      this.graph, this.trainIndex, originCode, destCode
    );
    if (directTrains.length) {
      const group = groupFromTrains(directTrains);
      const score = scoreForJourneyType('direct', [group]);
      return {
        type: 'direct',
        legs: [this.makeLeg(originCode, destCode, directTrains)],
        overallConfidence: confidenceLevelFromScore(score),
        confidenceScore: score,
        dataNote: DATA_NOTES.direct,
      };
    }

    // 1 transfer
    const reachableFromOrigin = new Set(
      (this.graph.get(originCode) || []).map(e => e.to)
    );
    const thatReachDest = new Set(
      (this.graph.get(destCode) || []).map(e => e.to)
    );
    const oneHopInterchanges = rankInterchanges(
      [...reachableFromOrigin].filter(x => thatReachDest.has(x))
    );

    if (oneHopInterchanges.length) {
      const via = oneHopInterchanges[0];
      const l1trains = getTrainsBetween(this.graph, this.trainIndex, originCode, via);
      const l2trains = getTrainsBetween(this.graph, this.trainIndex, via, destCode);
      const groups = [groupFromTrains(l1trains), groupFromTrains(l2trains)];
      const score = scoreForJourneyType('one_transfer', groups);
      return {
        type: 'one_transfer',
        legs: [
          this.makeLeg(originCode, via, l1trains),
          this.makeLeg(via, destCode, l2trains),
        ],
        transferStation: this.station(via),
        alternativeTransfers: oneHopInterchanges.slice(1, 4).map(c => this.station(c)),
        overallConfidence: confidenceLevelFromScore(score),
        confidenceScore: score,
        dataNote: DATA_NOTES.one_transfer,
      };
    }

    // 2 transfers
    const sortedFromOrigin = rankInterchanges([...reachableFromOrigin]);
    for (const mid1 of sortedFromOrigin) {
      const reachableFromMid1 = new Set(
        (this.graph.get(mid1) || []).map(e => e.to)
      );
      const twoHopIx = rankInterchanges(
        [...reachableFromMid1].filter(
          x => thatReachDest.has(x) && x !== originCode && x !== mid1
        )
      );
      if (!twoHopIx.length) continue;

      const mid2 = twoHopIx[0];
      const l1t = getTrainsBetween(this.graph, this.trainIndex, originCode, mid1);
      const l2t = getTrainsBetween(this.graph, this.trainIndex, mid1, mid2);
      const l3t = getTrainsBetween(this.graph, this.trainIndex, mid2, destCode);
      if (!l1t.length || !l2t.length || !l3t.length) continue;

      const groups = [
        groupFromTrains(l1t),
        groupFromTrains(l2t),
        groupFromTrains(l3t),
      ];
      const score = scoreForJourneyType('two_transfer', groups);
      return {
        type: 'two_transfer',
        legs: [
          this.makeLeg(originCode, mid1, l1t),
          this.makeLeg(mid1, mid2, l2t),
          this.makeLeg(mid2, destCode, l3t),
        ],
        transferStation1: this.station(mid1),
        transferStation2: this.station(mid2),
        overallConfidence: confidenceLevelFromScore(score),
        confidenceScore: score,
        dataNote: DATA_NOTES.two_transfer,
      };
    }

    // Not found
    const nearestHub = this.nearestHub(originCode);
    return {
      type: 'not_found',
      reason: `No rail connection found between ${this.station(originCode).nameEn} and ${this.station(destCode).nameEn} in the current knowledge graph.`,
      suggestions: [
        nearestHub
          ? `Try travelling via ${this.station(nearestHub).nameEn} as an intermediate hub.`
          : 'Try selecting a major hub station as your origin.',
        'Some stations have incomplete stop data. Searching via Dhaka or Ishwardi may reveal connections.',
        'Check eticket.railway.gov.bd directly for routes not yet in this planner.',
      ],
    };
  }

  /**
   * Returns all stations reachable from a given station (direct connections).
   */
  directDestinations(originCode: string): Station[] {
    const edges = this.graph.get(originCode) || [];
    const seen = new Set<string>();
    const result: Station[] = [];
    for (const e of edges) {
      if (!seen.has(e.to)) {
        seen.add(e.to);
        result.push(this.station(e.to));
      }
    }
    return result;
  }

  /**
   * Returns all trains serving a given station.
   */
  trainsAtStation(code: string): TrainMeta[] {
    const seen = new Set<number>();
    const result: TrainMeta[] = [];
    for (const edges of this.graph.values()) {
      for (const e of edges) {
        if (e.to === code && !seen.has(e.trainNumber)) {
          seen.add(e.trainNumber);
          const meta = this.trainIndex.get(e.trainNumber);
          if (meta) result.push(meta);
        }
      }
    }
    return result;
  }

  /**
   * Nearest hub station reachable from a given station (1 hop).
   */
  nearestHub(code: string): string | null {
    const edges = this.graph.get(code) || [];
    for (const hub of [...HUB_CODES]) {
      if (edges.some(e => e.to === hub)) return hub;
    }
    return null;
  }

  /**
   * Confidence score explanation for display.
   */
  static explainScore(score: number): string {
    if (score >= 50) return 'Community-sourced — useful for planning, verify before travel.';
    if (score >= 35) return 'Partially interpolated — route exists, times may differ.';
    if (score >= 20) return 'Estimated — use only as a planning guide. Times unreliable.';
    return 'Minimal data — origin and destination only. Verify everything independently.';
  }
}
