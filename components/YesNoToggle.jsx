'use client';

export default function YesNoToggle({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
      <span className="text-sm font-medium text-gn-navy flex-1">{label}</span>
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => onChange('yes')}
          className={`px-4 py-1.5 rounded-full border-2 text-xs font-bold transition-all ${
            value === 'yes'
              ? 'border-gn-lime bg-gn-lime text-gn-navy'
              : 'border-gray-200 bg-white text-gray-400'
          }`}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => onChange('no')}
          className={`px-4 py-1.5 rounded-full border-2 text-xs font-bold transition-all ${
            value === 'no'
              ? 'border-red-500 bg-red-500 text-white'
              : 'border-gray-200 bg-white text-gray-400'
          }`}
        >
          No
        </button>
      </div>
    </div>
  );
}
