import React, { useState, useEffect } from 'react';
import { X, Brain, BookOpen, Sparkles, HelpCircle, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { COGNITIVE_DISTORTIONS } from '../types';

export const MentalCheckInModal: React.FC = () => {
  const {
    modalState,
    closeMentalModal,
    openLegendModal,
    addMentalCheckIn,
  } = useApp();

  const { isMentalCheckInOpen } = modalState;

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [situation, setSituation] = useState('');
  const [emotion, setEmotion] = useState('');
  const [voteBefore, setVoteBefore] = useState<number>(75);
  const [distortion1, setDistortion1] = useState(COGNITIVE_DISTORTIONS[0].name);
  const [distortion2, setDistortion2] = useState('');
  const [distortion3, setDistortion3] = useState('');
  const [afterThought, setAfterThought] = useState('');
  const [voteAfter, setVoteAfter] = useState<number>(30);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isMentalCheckInOpen) {
      setDate(new Date().toISOString().split('T')[0]);
      setSituation('');
      setEmotion('');
      setVoteBefore(75);
      setDistortion1(COGNITIVE_DISTORTIONS[0].name);
      setDistortion2('');
      setDistortion3('');
      setAfterThought('');
      setVoteAfter(30);
    }
  }, [isMentalCheckInOpen]);

  if (!isMentalCheckInOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!situation.trim() || !emotion.trim()) return;

    try {
      setIsSubmitting(true);
      await addMentalCheckIn({
        date: date || new Date().toISOString().split('T')[0],
        situation: situation.trim(),
        emotion: emotion.trim(),
        voteBefore: Number(voteBefore),
        distortion1: distortion1 || undefined,
        distortion2: distortion2 || undefined,
        distortion3: distortion3 || undefined,
        afterThought: afterThought.trim() || undefined,
        voteAfter: Number(voteAfter),
      });

      closeMentalModal();
    } finally {
      setIsSubmitting(false);
    }
  };

  const distortionOptions = COGNITIVE_DISTORTIONS.map((d) => d.name);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-xl apple-panel rounded-2xl shadow-2xl border border-white/60 dark:border-white/10 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[rgba(60,60,67,0.12)] dark:border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#0A84FF]/10 text-[#0A84FF] flex items-center justify-center">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#1C1C1E] dark:text-[#F5F5F7]">
                Mental Wellbeing Check (MEN)
              </h3>
              <p className="text-[11px] text-[#6E6E73] dark:text-[#A1A1A6]">Thought Record & Cognitive Distortion Evaluation</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openLegendModal}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/10 text-[#1C1C1E] dark:text-[#F5F5F7] text-xs font-medium hover:bg-black/10 transition cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#0A84FF]" />
              <span>Distortions Legend</span>
            </button>
            <button
              onClick={closeMentalModal}
              className="p-1 rounded-md text-[#6E6E73] hover:text-[#1C1C1E] dark:hover:text-[#F5F5F7] hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form Body matching the attached screenshot */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 overflow-y-auto flex-1 text-xs">
          
          {/* Row 1: Date & Vote Before */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#1C1C1E] dark:text-[#F5F5F7] mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/70 dark:bg-black/20 text-[#1C1C1E] dark:text-[#F5F5F7] focus:outline-none border border-[rgba(60,60,67,0.15)] dark:border-white/10 focus:border-[#0A84FF]"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-medium text-[#1C1C1E] dark:text-[#F5F5F7]">
                  Vote Before (1 - 100)
                </label>
                <span className="font-mono font-medium text-[#0A84FF]">
                  {voteBefore} / 100
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={voteBefore}
                onChange={(e) => setVoteBefore(Number(e.target.value))}
                className="w-full accent-[#0A84FF] cursor-pointer"
              />
              <p className="text-[10px] text-[#6E6E73] dark:text-[#A1A1A6]">Initial emotional intensity or distress</p>
            </div>
          </div>

          {/* Row 2: Situation */}
          <div>
            <label className="block font-medium text-[#1C1C1E] dark:text-[#F5F5F7] mb-1">
              Situation *
            </label>
            <textarea
              required
              rows={2}
              placeholder="What specific event, thought, or trigger happened?"
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/70 dark:bg-black/20 text-[#1C1C1E] dark:text-[#F5F5F7] focus:outline-none border border-[rgba(60,60,67,0.15)] dark:border-white/10 focus:border-[#0A84FF]"
            />
          </div>

          {/* Row 3: Emotion */}
          <div>
            <label className="block font-medium text-[#1C1C1E] dark:text-[#F5F5F7] mb-1">
              Emotion *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Overwhelmed, Anxious, Frustrated, Inadequate"
              value={emotion}
              onChange={(e) => setEmotion(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/70 dark:bg-black/20 text-[#1C1C1E] dark:text-[#F5F5F7] focus:outline-none border border-[rgba(60,60,67,0.15)] dark:border-white/10 focus:border-[#0A84FF]"
            />
          </div>

          {/* Row 4: Emotional Distortions (Primary, Secondary, Tertiary) */}
          <div className="p-3.5 rounded-xl apple-subpanel space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5" />
                <span>Identified Emotional Distortions</span>
              </span>
              <button
                type="button"
                onClick={openLegendModal}
                className="text-[11px] text-[#0A84FF] hover:underline cursor-pointer"
              >
                View definitions legend →
              </button>
            </div>

            <div className="space-y-2">
              <div>
                <label className="block text-[11px] text-[#6E6E73] dark:text-[#A1A1A6] mb-0.5">
                  Emotional Distortion (Primary) *
                </label>
                <select
                  value={distortion1}
                  onChange={(e) => setDistortion1(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white/70 dark:bg-black/20 text-[#1C1C1E] dark:text-[#F5F5F7] border border-[rgba(60,60,67,0.15)] dark:border-white/10 focus:outline-none"
                >
                  {distortionOptions.map((opt) => (
                    <option key={opt} value={opt} className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-[#6E6E73] dark:text-[#A1A1A6] mb-0.5">
                    Emotional Distortion (1) - Secondary
                  </label>
                  <select
                    value={distortion2}
                    onChange={(e) => setDistortion2(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-white/70 dark:bg-black/20 text-[#1C1C1E] dark:text-[#F5F5F7] border border-[rgba(60,60,67,0.15)] dark:border-white/10 focus:outline-none"
                  >
                    <option value="" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">-- None --</option>
                    {distortionOptions.map((opt) => (
                      <option key={opt} value={opt} className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-[#6E6E73] dark:text-[#A1A1A6] mb-0.5">
                    Emotional Distortion (2) - Tertiary
                  </label>
                  <select
                    value={distortion3}
                    onChange={(e) => setDistortion3(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-white/70 dark:bg-black/20 text-[#1C1C1E] dark:text-[#F5F5F7] border border-[rgba(60,60,67,0.15)] dark:border-white/10 focus:outline-none"
                  >
                    <option value="" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">-- None --</option>
                    {distortionOptions.map((opt) => (
                      <option key={opt} value={opt} className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Row 5: After Thought */}
          <div>
            <label className="block font-medium text-[#1C1C1E] dark:text-[#F5F5F7] mb-1">
              After Thought (Rational Perspective / Reframe)
            </label>
            <textarea
              rows={2}
              placeholder="What is a more realistic, objective, and compassionate perspective?"
              value={afterThought}
              onChange={(e) => setAfterThought(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/70 dark:bg-black/20 text-[#1C1C1E] dark:text-[#F5F5F7] focus:outline-none border border-[rgba(60,60,67,0.15)] dark:border-white/10 focus:border-[#0A84FF]"
            />
          </div>

          {/* Row 6: Vote (1:100) After */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-medium text-[#1C1C1E] dark:text-[#F5F5F7]">
                Vote (1:100) After Thought
              </label>
              <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                {voteAfter} / 100
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={voteAfter}
              onChange={(e) => setVoteAfter(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex items-center justify-between text-[10px] text-[#6E6E73] dark:text-[#A1A1A6]">
              <span>Distress reduction:</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {voteBefore - voteAfter > 0 ? `-${voteBefore - voteAfter} points` : 'No change'}
              </span>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-[#0A84FF] hover:bg-[#0071E3] active:scale-98 text-white font-medium text-sm shadow-xs transition cursor-pointer"
            >
              Save Mental Wellbeing Check
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
