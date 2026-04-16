'use client';
import Link from 'next/link';

export default function Header({ progress }) {
  const { completed = 0, total = 1, pct = 0 } = progress || {};

  return (
    <div className="bg-gradient-to-br from-gn-navy to-gn-navy-light p-5 pb-6 sticky top-0 z-50">
      <div className="max-w-[500px] mx-auto flex items-center justify-between">
        <div>
          <h1 className="text-gn-lime text-lg font-black tracking-wider font-heading m-0">
            GRASS NERDS
          </h1>
          <p className="text-white/60 text-xs m-0">Monthly Truck Inspection</p>
        </div>
        <Link
          href="/dashboard"
          className="bg-gn-lime/15 border border-gn-lime/40 text-gn-lime rounded-lg px-3 py-2 text-xs font-bold no-underline hover:bg-gn-lime/25 transition-colors"
        >
          📊 Dashboard
        </Link>
      </div>
      {progress && (
        <div className="max-w-[500px] mx-auto mt-3">
          <div className="flex justify-between text-[11px] text-white/50 mb-1">
            <span>Progress</span>
            <span>{pct}% ({completed}/{total})</span>
          </div>
          <div className="h-1.5 bg-white/15 rounded-full">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${pct}%`,
                background: pct === 100
                  ? '#c1d62f'
                  : 'linear-gradient(90deg, #c1d62f, #e0eb6a)',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
