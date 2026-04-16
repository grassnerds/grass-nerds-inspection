'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import ResolveModal from '../../components/ResolveModal';
import { getInspections, getTruckHistory, resolveIssue, getFormConfig } from '../../lib/data';

// ─── Issue Tag ───
function IssueTag({ label, resolved, onResolveClick }) {
  if (resolved) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 text-xs mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-green-600 font-bold">✓ {label}</span>
          <span className="text-gray-400">— resolved</span>
        </div>
        <div className="text-green-500 text-[11px] mt-0.5">
          {resolved.resolved_by} · {new Date(resolved.resolved_at).toLocaleDateString()}
          {resolved.resolution_note ? ` — ${resolved.resolution_note}` : ''}
        </div>
      </div>
    );
  }
  return (
    <button
      onClick={onResolveClick}
      className="bg-red-50 text-red-500 text-xs px-3 py-1.5 rounded-lg font-semibold border border-dashed border-red-400 cursor-pointer text-left mb-1 block hover:bg-red-100 transition-colors"
    >
      ⚠ {label} <span className="text-red-300 font-normal ml-1">tap to resolve</span>
    </button>
  );
}

// ─── Truck Detail View ───
function TruckDetail({ truckName, truckId, drivers, onBack }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('open');
  const [resolvingItem, setResolvingItem] = useState(null);

  const loadHistory = () => {
    setLoading(true);
    getTruckHistory(truckId)
      .then(setHistory)
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadHistory(); }, [truckId]);

  const handleResolve = async ({ resolvedBy, note }) => {
    try {
      await resolveIssue({
        inspectionId: resolvingItem.inspectionId,
        checklistItemId: resolvingItem.checklistItemId,
        resolvedBy,
        note,
      });
      setResolvingItem(null);
      loadHistory(); // refresh
    } catch (err) {
      alert('Error resolving: ' + err.message);
    }
  };

  // Count stats
  let totalOpen = 0;
  let totalResolved = 0;
  history.forEach(insp => {
    const noItems = (insp.inspection_responses || []).filter(r => r.value === 'no');
    const resolutions = insp.issue_resolutions || [];
    noItems.forEach(item => {
      const isResolved = resolutions.some(r => r.checklist_item_id === item.checklist_item_id);
      if (isResolved) totalResolved++;
      else totalOpen++;
    });
  });

  return (
    <div className="min-h-screen bg-gray-100 font-body">
      {resolvingItem && (
        <ResolveModal
          itemLabel={resolvingItem.label}
          drivers={drivers}
          onResolve={handleResolve}
          onCancel={() => setResolvingItem(null)}
        />
      )}
      <div className="bg-gradient-to-br from-gn-navy to-gn-navy-light p-5">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="bg-white/15 border-none text-white rounded-lg px-3 py-2 cursor-pointer text-sm"
          >
            ←
          </button>
          <div>
            <h1 className="text-gn-lime text-xl font-extrabold m-0">{truckName}</h1>
            <p className="text-white/60 text-xs m-0">Inspection History</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          {[
            { key: 'open', label: `Open (${totalOpen})` },
            { key: 'all', label: 'All' },
            { key: 'resolved', label: `Resolved (${totalResolved})` },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3.5 py-1.5 rounded-full border-none text-xs font-bold cursor-pointer ${
                filter === f.key
                  ? 'bg-gn-lime text-gn-navy'
                  : 'bg-white/15 text-white/60'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-[500px] mx-auto p-4">
        {loading ? (
          <p className="text-center text-gray-400 py-8">Loading history...</p>
        ) : history.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No inspections yet for this truck.</p>
        ) : (
          history.map((insp) => {
            const noItems = (insp.inspection_responses || []).filter(r => r.value === 'no');
            const resolutions = insp.issue_resolutions || [];

            const items = noItems.map(r => {
              const resolution = resolutions.find(res => res.checklist_item_id === r.checklist_item_id);
              return {
                checklistItemId: r.checklist_item_id,
                label: r.checklist_items?.label || 'Unknown',
                section: r.checklist_items?.checklist_sections?.name || '',
                resolved: resolution || null,
                inspectionId: insp.id,
              };
            });

            const visibleItems = items.filter(item => {
              if (filter === 'open') return !item.resolved;
              if (filter === 'resolved') return !!item.resolved;
              return true;
            });

            if (noItems.length > 0 && visibleItems.length === 0 && filter !== 'all') return null;

            const openCount = items.filter(i => !i.resolved).length;
            const resolvedCount = items.filter(i => i.resolved).length;

            return (
              <div
                key={insp.id}
                className="bg-white rounded-xl p-4 mb-3 shadow-sm"
                style={{
                  borderLeft: `4px solid ${
                    noItems.length === 0 ? '#c1d62f' : openCount === 0 ? '#4a9e2b' : openCount >= 3 ? '#e74c3c' : '#f0ad4e'
                  }`,
                }}
              >
                <div className="flex justify-between mb-2">
                  <strong className="text-gn-navy text-sm">
                    {new Date(insp.date).toLocaleDateString()}
                  </strong>
                  <span className="text-xs text-gray-400">
                    {insp.miles} mi | Tech: {insp.tech_name}
                  </span>
                </div>
                {noItems.length === 0 ? (
                  <span className="text-green-500 text-xs font-semibold">✓ All items passed</span>
                ) : (
                  <div>
                    <div className="flex gap-3 mb-2 text-xs">
                      {openCount > 0 && (
                        <span className="text-red-500 font-bold">● {openCount} open</span>
                      )}
                      {resolvedCount > 0 && (
                        <span className="text-green-600 font-bold">✓ {resolvedCount} resolved</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      {(filter === 'all' ? items : visibleItems).map((item, j) => (
                        <IssueTag
                          key={j}
                          label={item.label}
                          resolved={item.resolved}
                          onResolveClick={() =>
                            setResolvingItem({
                              inspectionId: item.inspectionId,
                              checklistItemId: item.checklistItemId,
                              label: item.label,
                            })
                          }
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}

        <button
          onClick={onBack}
          className="w-full py-3.5 rounded-xl border-2 border-gn-navy bg-white text-gn-navy text-sm font-bold cursor-pointer mt-2"
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───
export default function Dashboard() {
  const [inspections, setInspections] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTruck, setSelectedTruck] = useState(null);

  useEffect(() => {
    Promise.all([getInspections(), getFormConfig()])
      .then(([insps, config]) => {
        setInspections(insps);
        setDrivers(config.drivers);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (selectedTruck) {
    return (
      <TruckDetail
        truckName={selectedTruck.name}
        truckId={selectedTruck.id}
        drivers={drivers}
        onBack={() => setSelectedTruck(null)}
      />
    );
  }

  // Group inspections by truck (latest per truck)
  const truckMap = {};
  inspections.forEach(insp => {
    const tid = insp.truck_id;
    if (!truckMap[tid] || new Date(insp.submitted_at) > new Date(truckMap[tid].submitted_at)) {
      truckMap[tid] = insp;
    }
  });
  const latestByTruck = Object.values(truckMap);

  // Stats
  const uniqueTrucks = new Set(inspections.map(i => i.truck_id)).size;
  const thisMonth = inspections.filter(i => {
    const d = new Date(i.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  return (
    <div className="min-h-screen bg-gray-100 font-body">
      <div className="bg-gradient-to-br from-gn-navy to-gn-navy-light p-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-gn-lime text-xl font-extrabold m-0">Fleet Dashboard</h1>
            <p className="text-white/60 text-xs m-0">Manager View</p>
          </div>
          <Link
            href="/admin"
            className="bg-white/15 border border-white/20 text-white/80 rounded-lg px-3 py-2 text-xs font-bold no-underline hover:bg-white/25 transition-colors"
          >
            ⚙ Admin
          </Link>
        </div>
      </div>

      <div className="max-w-[500px] mx-auto p-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Trucks', value: uniqueTrucks, color: 'text-gn-navy' },
            { label: 'This Month', value: `${thisMonth.length}`, color: 'text-gn-lime' },
            { label: 'Total', value: inspections.length, color: 'text-gray-500' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-lg p-3 text-center shadow-sm">
              <div className={`text-2xl font-extrabold ${s.color}`}>{s.value}</div>
              <div className="text-[11px] text-gray-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        <h2 className="text-gn-navy text-base font-extrabold mb-3">Recent Inspections</h2>

        {loading ? (
          <p className="text-center text-gray-400 py-8">Loading...</p>
        ) : latestByTruck.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm">
            <div className="text-3xl mb-3">📋</div>
            <p className="text-gray-500 text-sm">No inspections submitted yet.</p>
            <Link href="/" className="text-gn-navy font-bold text-sm underline">
              Submit the first one →
            </Link>
          </div>
        ) : (
          latestByTruck.map((insp) => (
            <div
              key={insp.id}
              onClick={() => setSelectedTruck({ id: insp.truck_id, name: insp.trucks?.name || 'Unknown' })}
              className="bg-white rounded-xl p-4 mb-2.5 shadow-sm cursor-pointer flex justify-between items-center hover:shadow-md transition-shadow border-l-4 border-gn-lime"
            >
              <div>
                <strong className="text-gn-navy text-sm">{insp.trucks?.name || 'Unknown'}</strong>
                <div className="text-gray-400 text-xs mt-0.5">
                  {insp.drivers?.name || ''} · {new Date(insp.date).toLocaleDateString()} · {insp.miles} mi
                </div>
              </div>
              <div className="text-gray-300 text-lg">›</div>
            </div>
          ))
        )}

        <div className="flex gap-3 mt-4">
          <Link
            href="/"
            className="flex-1 py-3.5 rounded-xl border-2 border-gn-navy bg-white text-gn-navy text-sm font-bold text-center no-underline"
          >
            ← Inspection Form
          </Link>
          <Link
            href="/admin"
            className="flex-1 py-3.5 rounded-xl border-none bg-gn-navy text-white text-sm font-bold text-center no-underline"
          >
            ⚙ Admin Panel
          </Link>
        </div>
      </div>
    </div>
  );
}
