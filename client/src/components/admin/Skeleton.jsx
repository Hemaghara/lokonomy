import React from "react";

export const TableSkeleton = ({ rows = 8, cols = 6 }) => {
  return (
    <div className="rounded-2xl border border-slate-700/40 overflow-hidden bg-slate-900/30 animate-pulse">
      <div className="bg-slate-950/30 border-b border-slate-700/40 px-5 py-4 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-2 bg-slate-800 rounded-full flex-1" />
        ))}
      </div>
      <div className="divide-y divide-white/5">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-5 py-5 flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-800 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-slate-800 rounded-full w-1/3" />
              <div className="h-2 bg-slate-800/60 rounded-full w-1/4" />
            </div>
            <div className="h-3 bg-slate-800 rounded-full w-20 hidden md:block" />
            <div className="h-3 bg-slate-800 rounded-full w-24 hidden lg:block" />
            <div className="h-8 w-20 bg-slate-800 rounded-lg shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const CardSkeleton = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 space-y-4"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 bg-slate-800 rounded-xl" />
            <div className="h-5 w-16 bg-slate-800 rounded-md" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-slate-800 rounded-full w-3/4" />
            <div className="h-3 bg-slate-800/60 rounded-full w-1/2" />
          </div>
          <div className="pt-4 border-t border-white/5 flex justify-between">
            <div className="h-3 bg-slate-800 rounded-full w-20" />
            <div className="h-3 bg-slate-800 rounded-full w-12" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const StatsSkeleton = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse mb-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 space-y-3"
        >
          <div className="h-3 bg-slate-800 rounded-full w-20" />
          <div className="h-8 bg-slate-800 rounded-lg w-1/2" />
          <div className="h-2 bg-slate-800/60 rounded-full w-3/4" />
        </div>
      ))}
    </div>
  );
};
