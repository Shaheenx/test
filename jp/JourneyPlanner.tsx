/**
 * RailMate Bangladesh — Journey Planner Component
 * -------------------------------------------------
 * Drop-in React component for the RailMate Next.js app.
 *
 * Usage:
 *   import { JourneyPlanner } from '@/app/JourneyPlanner';
 *   <JourneyPlanner />
 *
 * Or with pre-selected stations:
 *   <JourneyPlanner initialOrigin="DHKA" initialDest="SYT" />
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { RouteEngine } from '../api/routeEngine';
import type {
  JourneyResult,
  DirectJourney,
  OneTransferJourney,
  TwoTransferJourney,
  JourneyLeg,
  Station,
  TrainMeta,
  ConfidenceLevel,
} from '../api/routeEngine';
import { STATIONS, TRAINS, STOP_SEQUENCES } from '../api/railmateData';

// ─── Engine singleton ─────────────────────────────────────────────────────────

// Initialise once outside the component to avoid rebuild on every render
const engine = new RouteEngine(STOP_SEQUENCES, TRAINS, STATIONS);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CONF_STYLES: Record<ConfidenceLevel, { pill: string; label: string }> = {
  medium: {
    pill: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    label: 'Medium confidence',
  },
  'low-medium': {
    pill: 'bg-blue-50 text-blue-700 border border-blue-200',
    label: 'Low-medium confidence',
  },
  low: {
    pill: 'bg-amber-50 text-amber-700 border border-amber-200',
    label: 'Low confidence',
  },
};

const ROUTE_TYPE_STYLES = {
  direct: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  one_transfer: 'bg-blue-50 text-blue-700 border border-blue-200',
  two_transfer: 'bg-orange-50 text-orange-700 border border-orange-200',
  not_found: 'bg-gray-100 text-gray-600 border border-gray-200',
} as const;

const ROUTE_TYPE_LABELS = {
  direct: 'Direct route',
  one_transfer: '1 transfer',
  two_transfer: '2 transfers',
  not_found: 'No route found',
} as const;

function ConfidencePill({ level }: { level: ConfidenceLevel }) {
  const s = CONF_STYLES[level];
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.pill}`}>
      {s.label}
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 45 ? 'bg-emerald-400' : score >= 25 ? 'bg-blue-400' : 'bg-amber-400';
  return (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      <span>Route confidence</span>
      <div className="flex-1 bg-gray-100 rounded-full h-1.5 max-w-[120px]">
        <div
          className={`h-1.5 rounded-full ${color} transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-gray-400">{score}/100</span>
    </div>
  );
}

function TrainChips({ trains, max = 3 }: { trains: TrainMeta[]; max?: number }) {
  const shown = trains.slice(0, max);
  const extra = trains.length - max;
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {shown.map(t => (
        <span
          key={t.number}
          className="inline-flex items-center gap-1 text-[11px] bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 text-gray-700"
        >
          <span className="font-mono font-medium text-gray-500">#{t.number}</span>
          {t.name}
        </span>
      ))}
      {extra > 0 && (
        <span className="text-[11px] text-gray-400 px-1.5 py-0.5">
          +{extra} more
        </span>
      )}
    </div>
  );
}

function LegCard({
  leg,
  stepNumber,
}: {
  leg: JourneyLeg;
  stepNumber: number;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-6 h-6 rounded-full bg-gray-100 border border-gray-200 text-[11px] font-medium text-gray-500 flex items-center justify-center flex-shrink-0">
          {stepNumber}
        </div>
        <div className="w-px flex-1 bg-gray-100 mt-1" />
      </div>
      <div className="pb-4 flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
          <span>{leg.fromName}</span>
          <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span>{leg.toName}</span>
        </div>
        <TrainChips trains={leg.trains} />
      </div>
    </div>
  );
}

function TransferBadge({ station }: { station: Station }) {
  return (
    <div className="flex items-center gap-2 ml-9 mb-3 -mt-2">
      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
      <span className="text-xs text-gray-500">
        Change at{' '}
        <span className="font-medium text-gray-700">{station.nameEn}</span>
        {station.isHub && (
          <span className="ml-1 text-[10px] text-emerald-600 font-medium">Hub</span>
        )}
      </span>
    </div>
  );
}

function DataDisclaimer({ note }: { note: string }) {
  return (
    <div className="mt-4 flex gap-2 text-xs text-gray-500 bg-amber-50 border border-amber-100 rounded-lg p-3">
      <svg className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <span>
        <strong className="text-amber-700 font-medium">Schedules may change.</strong>{' '}
        {note}{' '}
        <a
          href="https://eticket.railway.gov.bd"
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-amber-600 hover:text-amber-800"
        >
          Verify at eticket.railway.gov.bd
        </a>
      </span>
    </div>
  );
}

// ─── Result renderers ─────────────────────────────────────────────────────────

function DirectResult({ result }: { result: DirectJourney }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROUTE_TYPE_STYLES.direct}`}>
          {ROUTE_TYPE_LABELS.direct}
        </span>
        <ConfidencePill level={result.overallConfidence} />
      </div>
      <LegCard leg={result.legs[0]} stepNumber={1} />
      <ScoreBar score={result.confidenceScore} />
      <p className="text-xs text-gray-400 mt-1">
        {RouteEngine.explainScore(result.confidenceScore)}
      </p>
      <DataDisclaimer note={result.dataNote} />
    </div>
  );
}

function OneTransferResult({ result }: { result: OneTransferJourney }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROUTE_TYPE_STYLES.one_transfer}`}>
          {ROUTE_TYPE_LABELS.one_transfer}
        </span>
        <ConfidencePill level={result.overallConfidence} />
      </div>
      <LegCard leg={result.legs[0]} stepNumber={1} />
      <TransferBadge station={result.transferStation} />
      <LegCard leg={result.legs[1]} stepNumber={2} />
      {result.alternativeTransfers.length > 0 && (
        <p className="text-xs text-gray-400 ml-9 -mt-2 mb-3">
          Alternative interchange{result.alternativeTransfers.length > 1 ? 's' : ''}:{' '}
          {result.alternativeTransfers.map(s => s.nameEn).join(', ')}
        </p>
      )}
      <ScoreBar score={result.confidenceScore} />
      <p className="text-xs text-gray-400 mt-1">
        {RouteEngine.explainScore(result.confidenceScore)}
      </p>
      <DataDisclaimer note={result.dataNote} />
    </div>
  );
}

function TwoTransferResult({ result }: { result: TwoTransferJourney }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROUTE_TYPE_STYLES.two_transfer}`}>
          {ROUTE_TYPE_LABELS.two_transfer}
        </span>
        <ConfidencePill level={result.overallConfidence} />
      </div>
      <LegCard leg={result.legs[0]} stepNumber={1} />
      <TransferBadge station={result.transferStation1} />
      <LegCard leg={result.legs[1]} stepNumber={2} />
      <TransferBadge station={result.transferStation2} />
      <LegCard leg={result.legs[2]} stepNumber={3} />
      <ScoreBar score={result.confidenceScore} />
      <p className="text-xs text-gray-400 mt-1">
        {RouteEngine.explainScore(result.confidenceScore)}
      </p>
      <DataDisclaimer note={result.dataNote} />
    </div>
  );
}

function NotFoundResult({ result }: { result: Extract<JourneyResult, { type: 'not_found' }> }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROUTE_TYPE_STYLES.not_found}`}>
          {ROUTE_TYPE_LABELS.not_found}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-3">{result.reason}</p>
      <ul className="space-y-1.5">
        {result.suggestions.map((s, i) => (
          <li key={i} className="flex gap-2 text-xs text-gray-500">
            <span className="text-gray-300 mt-0.5">→</span>
            <span>{s}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface JourneyPlannerProps {
  initialOrigin?: string;
  initialDest?: string;
  className?: string;
}

export function JourneyPlanner({
  initialOrigin = '',
  initialDest = '',
  className = '',
}: JourneyPlannerProps) {
  const [origin, setOrigin] = useState(initialOrigin);
  const [dest, setDest] = useState(initialDest);
  const [result, setResult] = useState<JourneyResult | null>(null);

  const hubs = useMemo(() => STATIONS.filter(s => s.isHub), []);
  const others = useMemo(
    () => STATIONS.filter(s => !s.isHub).sort((a, b) => a.nameEn.localeCompare(b.nameEn)),
    []
  );

  const handleSearch = useCallback(() => {
    if (!origin || !dest) return;
    setResult(engine.find(origin, dest));
  }, [origin, dest]);

  const handleSwap = useCallback(() => {
    setOrigin(dest);
    setDest(origin);
    setResult(null);
  }, [origin, dest]);

  const stationOptions = (
    <>
      <option value="">Select station…</option>
      <optgroup label="Major hubs">
        {hubs.map(s => (
          <option key={s.code} value={s.code}>{s.nameEn}</option>
        ))}
      </optgroup>
      <optgroup label="All stations">
        {others.map(s => (
          <option key={s.code} value={s.code}>{s.nameEn}</option>
        ))}
      </optgroup>
    </>
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <h2 className="text-sm font-medium text-gray-700 mb-3">Journey planner</h2>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1" htmlFor="jp-origin">From</label>
            <select
              id="jp-origin"
              value={origin}
              onChange={e => { setOrigin(e.target.value); setResult(null); }}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {stationOptions}
            </select>
          </div>

          <button
            onClick={handleSwap}
            aria-label="Swap origin and destination"
            className="h-9 w-9 flex items-center justify-center border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors flex-shrink-0 mb-px"
          >
            ⇄
          </button>

          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1" htmlFor="jp-dest">To</label>
            <select
              id="jp-dest"
              value={dest}
              onChange={e => { setDest(e.target.value); setResult(null); }}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {stationOptions}
            </select>
          </div>

          <button
            onClick={handleSearch}
            disabled={!origin || !dest}
            className="h-9 px-4 text-sm bg-gray-900 text-white rounded-lg disabled:opacity-40 hover:bg-gray-700 transition-colors flex-shrink-0 mb-px"
          >
            Find
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <>
          {result.type === 'direct'       && <DirectResult result={result} />}
          {result.type === 'one_transfer' && <OneTransferResult result={result} />}
          {result.type === 'two_transfer' && <TwoTransferResult result={result} />}
          {result.type === 'not_found'    && <NotFoundResult result={result} />}
        </>
      )}
    </div>
  );
}

export default JourneyPlanner;
