"use client";

import React, { useMemo, useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';

type WeekDay = {
  day: string;
  type: string;
  desc: string;
  pace_s_per_km?: number | null;
  distance_km: number;
};

type PlanWeek = {
  week: number;
  target_km?: number;
  schedule: WeekDay[];
};

type TrainingPlan = {
  plan_type?: string;
  targets_km?: number[];
  paces_s_per_km?: Record<string, number>;
  weeks: PlanWeek[];
  notes?: string[];
};

function formatPace(sec?: number | null): string {
  if (!sec || sec <= 0) return '';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}/km`;
}

function typeLabel(type: string, desc: string): string {
  const t = (type || '').toLowerCase();
  const d = (desc || '').toLowerCase();
  if (t === 'long') return 'Long Run';
  if (t === 'interval' || d.includes('interval')) return 'Intervals';
  if (t === 'tempo' || d.includes('tempo')) return 'Fast/Tempo';
  if (t.includes('easy')) return 'Recovery/Easy';
  if (t === 'sharpen') return 'Sharpen';
  if (t === 'rest') return 'Rest';
  return 'Run';
}

function chipColor(type: string): string {
  const t = (type || '').toLowerCase();
  if (t === 'long') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
  if (t === 'interval') return 'bg-violet-500/15 text-violet-300 border-violet-500/30';
  if (t === 'tempo' || t === 'quality' || t === 'sharpen') return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
  if (t.includes('easy')) return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
  if (t === 'rest') return 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30';
  return 'bg-white/5 text-foreground border-border';
}

export default function TrainingPlanViewer({ plan }: { plan: TrainingPlan }) {
  const [weekIndex, setWeekIndex] = useState(0);
  const weeks = plan?.weeks || [];
  const current = weeks[weekIndex];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-subtle">Week {current?.week ?? weekIndex + 1} of {weeks.length}</div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={weekIndex <= 0}
            onClick={() => setWeekIndex(Math.max(0, weekIndex - 1))}
          >
            Previous week
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={weekIndex >= weeks.length - 1}
            onClick={() => setWeekIndex(Math.min(weeks.length - 1, weekIndex + 1))}
          >
            Next week
          </Button>
        </div>
      </div>

      {current && (
        <Card>
          <Card.Header>
            <div className="flex items-center justify-between w-full">
              <div className="font-semibold">Week {current.week}</div>
              {typeof current.target_km === 'number' && (
                <div className="text-sm text-subtle">Target: {current.target_km} km</div>
              )}
            </div>
          </Card.Header>
          <Card.Content>
            <div className="space-y-3 w-full">
              {current.schedule.map((d, idx) => (
                <div key={idx} className="w-full bg-white/5 border border-border rounded p-3">
                  <div className="flex items-center justify-between">
                    <div className={`inline-block px-2 py-0.5 rounded border text-xs ${chipColor(d.type)}`}>{(d.type || '').toUpperCase()}</div>
                    <div className="text-xs text-subtle">{d.day}</div>
                  </div>
                  <div className="mt-1 font-medium">{typeLabel(d.type, d.desc)}</div>
                  <div className="text-xs text-subtle">{d.desc}</div>
                  <div className="mt-1 text-sm">{d.distance_km} km • {formatPace(d.pace_s_per_km)}</div>
                </div>
              ))}
            </div>
          </Card.Content>
        </Card>
      )}

      {Array.isArray(plan?.notes) && plan.notes.length > 0 && (
        <div className="text-xs text-subtle">Notes: {plan.notes.join(' • ')}</div>
      )}
    </div>
  );
}


