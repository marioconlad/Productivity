import React, { useMemo } from 'react';
import {
  Brain,
  BookOpen,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Calendar,
  AlertCircle,
  BarChart3,
  Award,
  Hash,
  Activity,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MentalCheckIn, COGNITIVE_DISTORTIONS } from '../types';

interface MentalCheckInSectionProps {
  title?: string;
  showAlways?: boolean;
}

export const MentalCheckInSection: React.FC<MentalCheckInSectionProps> = ({
  title = 'Mental Wellbeing Checks (CBT)',
  showAlways = false,
}) => {
  const {
    mentalCheckIns,
    openMentalModal,
    openLegendModal,
    deleteMentalCheckIn,
    selectedCategory,
    categories,
  } = useApp();

  const isMenCategory =
    selectedCategory === 'cat_MEN' ||
    selectedCategory === 'MEN' ||
    categories.find((c) => c.id === selectedCategory)?.name === 'MEN';

  // Only show if MEN is selected or showAlways is true
  if (!isMenCategory && !showAlways) {
    return null;
  }

  // 1. Current Week Date Range (Monday to Sunday)
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diffToMon = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(today);
  monday.setDate(diffToMon);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const weekStartStr = monday.toISOString().split('T')[0];
  const weekEndStr = sunday.toISOString().split('T')[0];

  // 2. Weekly Check-Ins
  const weeklyCheckIns = useMemo(() => {
    return mentalCheckIns.filter(
      (c) => c.date >= weekStartStr && c.date <= weekEndStr
    );
  }, [mentalCheckIns, weekStartStr, weekEndStr]);

  // Weekly Average Scores (1-100 pts)
  const weeklyAvgScore = useMemo(() => {
    if (weeklyCheckIns.length === 0) return null;
    const total = weeklyCheckIns.reduce((acc, c) => acc + (c.voteAfter || 0), 0);
    return Math.round(total / weeklyCheckIns.length);
  }, [weeklyCheckIns]);

  const weeklyAvgBefore = useMemo(() => {
    if (weeklyCheckIns.length === 0) return null;
    const total = weeklyCheckIns.reduce((acc, c) => acc + (c.voteBefore || 0), 0);
    return Math.round(total / weeklyCheckIns.length);
  }, [weeklyCheckIns]);

  const weeklyAvgRelief = useMemo(() => {
    if (weeklyAvgBefore === null || weeklyAvgScore === null) return null;
    return weeklyAvgBefore - weeklyAvgScore;
  }, [weeklyAvgBefore, weeklyAvgScore]);

  // All-time average score
  const allTimeAvgScore = useMemo(() => {
    if (mentalCheckIns.length === 0) return null;
    const total = mentalCheckIns.reduce((acc, c) => acc + (c.voteAfter || 0), 0);
    return Math.round(total / mentalCheckIns.length);
  }, [mentalCheckIns]);

  const allTimeAvgRelief = useMemo(() => {
    if (mentalCheckIns.length === 0) return 0;
    const total = mentalCheckIns.reduce(
      (acc, c) => acc + ((c.voteBefore || 0) - (c.voteAfter || 0)),
      0
    );
    return Math.round(total / mentalCheckIns.length);
  }, [mentalCheckIns]);

  // 3. Top 3 Most Recurring Mental Distortions
  const { top3Distortions, totalDistortionOccurrences } = useMemo(() => {
    const counts: Record<string, number> = {};
    let totalCount = 0;

    mentalCheckIns.forEach((c) => {
      [c.distortion1, c.distortion2, c.distortion3].forEach((d) => {
        if (d && d.trim()) {
          const key = d.trim();
          counts[key] = (counts[key] || 0) + 1;
          totalCount += 1;
        }
      });
    });

    const sorted = Object.entries(counts)
      .map(([name, count]) => {
        const defObj = COGNITIVE_DISTORTIONS.find(
          (item) => item.name.toLowerCase() === name.toLowerCase()
        );
        return {
          name,
          count,
          percentage: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0,
          definition: defObj?.definition || 'Cognitive pattern skewing perception.',
        };
      })
      .sort((a, b) => b.count - a.count);

    return {
      top3Distortions: sorted.slice(0, 3),
      totalDistortionOccurrences: totalCount,
    };
  }, [mentalCheckIns]);

  return (
    <div className="space-y-4 pt-2">
      {/* Header Card */}
      <div className="p-4 sm:p-5 rounded-2xl apple-panel flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0A84FF]/10 text-[#0A84FF] flex items-center justify-center shrink-0">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#1C1C1E] dark:text-[#F5F5F7] flex items-center gap-2">
              <span>{title}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-[#6E6E73] dark:text-[#A1A1A6] font-medium">
                {mentalCheckIns.length} records
              </span>
            </h2>
            <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6]">
              Identify cognitive distortions and reframe negative thoughts (1-100 scale)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={openLegendModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl apple-subpanel text-[#1C1C1E] dark:text-[#F5F5F7] text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#0A84FF]" />
            <span>Distortions Legend</span>
          </button>

          <button
            onClick={openMentalModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0A84FF] hover:bg-[#0071E3] active:scale-98 text-white text-xs font-medium shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Check-In</span>
          </button>
        </div>
      </div>

      {/* 1. Core Analytics: Weekly Average Score & Top 3 Recurring Distortions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        
        {/* Card A: Average Score for the Week (Points) */}
        <div className="p-4 sm:p-5 rounded-2xl apple-subpanel flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-medium tracking-wider text-[#6E6E73] dark:text-[#A1A1A6] flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#0A84FF]" />
                <span>Weekly Average Score (Points)</span>
              </span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-[#6E6E73] dark:text-[#A1A1A6]">
                Mon - Sun
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <div className="text-3xl sm:text-4xl font-semibold font-mono text-[#1C1C1E] dark:text-[#F5F5F7] tracking-tight">
                {weeklyAvgScore !== null ? weeklyAvgScore : allTimeAvgScore !== null ? allTimeAvgScore : '—'}
              </div>
              <div className="text-xs font-medium text-[#6E6E73] dark:text-[#A1A1A6]">
                / 100 <span className="font-normal text-[11px]">pts {weeklyAvgScore === null && allTimeAvgScore !== null ? '(all-time)' : '(this week)'}</span>
              </div>
            </div>

            {/* Score Context & Details */}
            {weeklyAvgScore !== null ? (
              <div className="mt-2.5 space-y-2">
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1 text-[#6E6E73] dark:text-[#A1A1A6]">
                    <span>Initial distress:</span>
                    <span className="font-mono font-medium text-[#FF3B30]">
                      {weeklyAvgBefore} pts
                    </span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-[#6E6E73]" />
                  <div className="flex items-center gap-1 text-[#6E6E73] dark:text-[#A1A1A6]">
                    <span>After reframing:</span>
                    <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                      {weeklyAvgScore} pts
                    </span>
                  </div>
                </div>

                {weeklyAvgRelief !== null && (
                  <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg w-fit">
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>Average weekly relief: -{weeklyAvgRelief} points ({Math.round((weeklyAvgRelief / (weeklyAvgBefore || 1)) * 100)}% drop)</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-2 text-xs text-[#6E6E73] dark:text-[#A1A1A6]">
                {mentalCheckIns.length > 0
                  ? `No check-ins logged yet this week. All-time average is ${allTimeAvgScore} pts with -${allTimeAvgRelief} pts average relief.`
                  : 'No check-ins logged yet. Rate your distress before and after reframing on a 1-100 scale.'}
              </p>
            )}
          </div>

          {/* Mini week activity indicator */}
          <div className="pt-2 border-t border-[rgba(60,60,67,0.08)] dark:border-white/5 flex items-center justify-between text-[11px] text-[#6E6E73] dark:text-[#A1A1A6]">
            <span>
              {weeklyCheckIns.length} {weeklyCheckIns.length === 1 ? 'check-in' : 'check-ins'} completed this week
            </span>
            <button
              onClick={openMentalModal}
              className="text-[#0A84FF] font-medium hover:underline inline-flex items-center gap-0.5 cursor-pointer"
            >
              <span>Log entry</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card B: Top 3 Most Recurring Mental Distortions */}
        <div className="p-4 sm:p-5 rounded-2xl apple-subpanel flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-medium tracking-wider text-[#6E6E73] dark:text-[#A1A1A6] flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-[#0A84FF]" />
                <span>Top 3 Recurring Mental Distortions</span>
              </span>
              <button
                onClick={openLegendModal}
                className="text-[10px] font-medium text-[#0A84FF] hover:underline cursor-pointer"
              >
                View Legend
              </button>
            </div>

            {/* List of top 3 distortions */}
            {top3Distortions.length === 0 ? (
              <div className="py-4 text-center space-y-1">
                <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6]">
                  No distortions identified yet.
                </p>
                <p className="text-[11px] text-[#6E6E73]/70 dark:text-[#A1A1A6]/70">
                  Common ones include <em>Catastrophizing</em>, <em>All-or-Nothing</em>, and <em>Mind Reading</em>.
                </p>
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {top3Distortions.map((dist, idx) => {
                  return (
                    <div
                      key={dist.name}
                      onClick={openLegendModal}
                      className="group p-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition border border-[rgba(60,60,67,0.08)] dark:border-white/5 cursor-pointer"
                      title="Click to see distortion definition"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-semibold bg-white/70 dark:bg-white/10 text-[#1C1C1E] dark:text-[#F5F5F7] border border-[rgba(60,60,67,0.1)] dark:border-white/10 shrink-0">
                            #{idx + 1}
                          </span>
                          <span className="text-xs font-medium text-[#1C1C1E] dark:text-[#F5F5F7] truncate group-hover:text-[#0A84FF] transition">
                            {dist.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-[#1C1C1E] dark:text-[#F5F5F7]">
                            {dist.count} {dist.count === 1 ? 'log' : 'logs'}
                          </span>
                          <span className="text-[10px] text-[#6E6E73] dark:text-[#A1A1A6] font-mono">
                            {dist.percentage}%
                          </span>
                        </div>
                      </div>

                      {/* Frequency progress bar */}
                      <div className="mt-1.5 w-full h-1 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#0A84FF] transition-all duration-500"
                          style={{
                            width: `${Math.max(8, dist.percentage)}%`,
                          }}
                        />
                      </div>

                      <p className="mt-1 text-[10px] text-[#6E6E73] dark:text-[#A1A1A6] line-clamp-1">
                        {dist.definition}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-[rgba(60,60,67,0.08)] dark:border-white/5 text-[11px] text-[#6E6E73] dark:text-[#A1A1A6]">
            {totalDistortionOccurrences} total distortion instances logged
          </div>
        </div>

      </div>

      {/* Record Cards */}
      {mentalCheckIns.length === 0 ? (
        <div className="p-8 text-center rounded-2xl apple-subpanel space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#0A84FF]/10 text-[#0A84FF] flex items-center justify-center mx-auto">
            <Brain className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-[#1C1C1E] dark:text-[#F5F5F7]">
              No Mental Wellbeing Checks Yet
            </h3>
            <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6] max-w-sm mx-auto">
              Record a CBT thought form whenever you experience emotional distress. Rate your feelings
              before and after reframing distortions.
            </p>
          </div>
          <button
            onClick={openMentalModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0A84FF] hover:bg-[#0071E3] text-white text-xs font-medium shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Compile First Check-In</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-medium text-[#6E6E73] dark:text-[#A1A1A6] uppercase tracking-wider">
              Recent CBT Thought Records
            </span>
            <span className="text-xs text-[#6E6E73] dark:text-[#A1A1A6]">
              {mentalCheckIns.length} {mentalCheckIns.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>

          {mentalCheckIns.map((record) => {
            const delta = (record.voteBefore || 0) - (record.voteAfter || 0);
            const distortions = [
              record.distortion1,
              record.distortion2,
              record.distortion3,
            ].filter(Boolean) as string[];

            return (
              <div
                key={record.id}
                className="p-4 rounded-xl apple-subpanel space-y-2.5 transition"
              >
                {/* Top Row: Date, Emotion & Before/After Score */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[rgba(60,60,67,0.08)] dark:border-white/5 pb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1 text-[11px] font-medium text-[#6E6E73] dark:text-[#A1A1A6]">
                      <Calendar className="w-3 h-3" />
                      <span>{record.date}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-[#1C1C1E] dark:text-[#F5F5F7] font-medium text-xs">
                      {record.emotion}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 justify-between sm:justify-end">
                    {/* Scores Comparison */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-[#6E6E73] dark:text-[#A1A1A6]">Score:</span>
                      <span className="font-mono font-medium text-[#FF3B30] bg-[#FF3B30]/10 px-1.5 py-0.5 rounded-md">
                        {record.voteBefore ?? '—'}
                      </span>
                      <ArrowRight className="w-3 h-3 text-[#6E6E73]" />
                      <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                        {record.voteAfter ?? '—'}
                      </span>

                      {delta > 0 && (
                        <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-0.5">
                          <TrendingDown className="w-3 h-3" />
                          <span>-{delta} pts</span>
                        </span>
                      )}
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => deleteMentalCheckIn(record.id)}
                      title="Delete record"
                      className="p-1 rounded-md text-[#6E6E73] hover:text-[#FF3B30] hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Situation */}
                <div>
                  <span className="text-[10px] uppercase font-medium text-[#6E6E73] dark:text-[#A1A1A6] tracking-wider">
                    Situation
                  </span>
                  <p className="text-xs text-[#1C1C1E] dark:text-[#F5F5F7] mt-0.5 leading-relaxed">
                    {record.situation}
                  </p>
                </div>

                {/* Cognitive Distortions identified */}
                {distortions.length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase font-medium text-[#6E6E73] dark:text-[#A1A1A6] tracking-wider">
                      Emotional Distortions Identified
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {distortions.map((d, i) => (
                        <span
                          key={i}
                          onClick={openLegendModal}
                          className="px-2 py-0.5 rounded-lg bg-black/5 dark:bg-white/10 text-[#1C1C1E] dark:text-[#F5F5F7] text-[11px] font-medium border border-[rgba(60,60,67,0.08)] dark:border-white/5 cursor-pointer hover:bg-black/10 transition"
                          title="Click to view definition"
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* After Thought / Reframing */}
                {record.afterThought && (
                  <div className="p-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-[rgba(60,60,67,0.08)] dark:border-white/5 space-y-1">
                    <div className="flex items-center gap-1.5 text-[#0A84FF] text-xs font-medium">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Reframed After Thought</span>
                    </div>
                    <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6] italic leading-relaxed">
                      "{record.afterThought}"
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
