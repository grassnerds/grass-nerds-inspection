'use client';
import { useState } from 'react';

export default function ResolveModal({ itemLabel, drivers, onResolve, onCancel }) {
  const [note, setNote] = useState('');
  const [resolvedBy, setResolvedBy] = useState('');

  return (
    <div className="fixed inset-0 bg-gn-navy/60 flex items-center justify-center z-[1000] p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-[400px] shadow-2xl">
        <h3 className="text-gn-navy font-bold text-lg m-0 mb-1">Resolve Issue</h3>
        <span className="inline-block bg-red-50 text-red-500 text-sm px-3 py-1 rounded-xl font-semibold mb-4">
          {itemLabel}
        </span>

        <div className="mb-3">
          <label className="text-xs font-semibold text-gray-400 block mb-1">Resolved by</label>
          <select
            value={resolvedBy}
            onChange={e => setResolvedBy(e.target.value)}
            className="w-full p-2.5 rounded-lg border-2 border-gray-200 text-sm font-semibold text-gn-navy bg-white"
          >
            <option value="">Select person...</option>
            {drivers.map(d => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="text-xs font-semibold text-gray-400 block mb-1">Resolution note</label>
          <textarea
            placeholder="e.g. Replaced unit, ordered new part, repaired in shop..."
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={3}
            className="w-full p-2.5 rounded-lg border-2 border-gray-200 text-sm text-gn-navy resize-y font-body"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-lg border-2 border-gray-200 bg-white text-gray-400 text-sm font-bold cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => onResolve({ resolvedBy, note })}
            disabled={!resolvedBy}
            className={`flex-1 py-3 rounded-lg border-none text-sm font-bold ${
              resolvedBy
                ? 'bg-gn-lime text-gn-navy cursor-pointer'
                : 'bg-gray-300 text-white cursor-not-allowed'
            }`}
          >
            Mark Resolved
          </button>
        </div>
      </div>
    </div>
  );
}
