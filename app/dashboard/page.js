'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import ResolveModal from '../../components/ResolveModal';
import { getInspections, getTruckHistory, resolveIssue, getFormConfig, getInspectionDetail, deleteInspection } from '../../lib/data';

const DASHBOARD_PASSWORD = 'grassrules';

// ─── Password Gate ───
function PasswordGate({ onUnlock }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pw === DASHBOARD_PASSWORD) {
      sessionStorage.setItem('dashboard_auth', 'true');
      onUnlock();
    } else {
      setError(true);
      setPw('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-body flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-[360px] mx-4">
        <div className="text-center mb-6">
          <div className="bg-gradient-to-br from-gn-navy to-gn-navy-light w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">🔒</span>
          </div>
          <h1 className="text-gn-navy text-xl font-extrabold m-0">Dashboard Login</h1>
          <p className="text-gray-400 text-sm mt-1">Enter the manager password</p>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={pw}
            onChange={(e) => { setPw(e.target.value); setError(false); }}
            placeholder="Password"
            className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-medium outline-none transition-colors ${
              error ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-gn-navy'
            }`}
            autoFocus
          />
          {error && <p className="text-red-500 text-xs mt-2 ml-1">Incorrect password. Try again.</p>}
          <button
            type="submit"
            className="w-full mt-4 py-3 rounded-xl bg-gn-navy text-white font-bold text-sm cursor-pointer border-none hover:bg-gn-navy-light transition-colors"
          >
            Unlock Dashboard
          </button>
        </form>
        <Link href="/" className="block text-center text-gray-400 text-xs mt-4 no-underline hover:text-gn-navy">
          ← Back to Inspection Form
        </Link>
      </div>
    </div>
  );
}

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

// ─── Inspection Detail View (view filled-out form) ───
function InspectionDetailView({ inspectionId, onBack, onDelete, drivers: driversList }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [resolvingItem, setResolvingItem] = useState(null);

  const loadDetail = () => {
    setLoading(true);
    getInspectionDetail(inspectionId)
      .then(setDetail)
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadDetail(); }, [inspectionId]);

  const handleResolve = async ({ resolvedBy, note }) => {
    try {
      await resolveIssue({
        inspectionId: resolvingItem.inspectionId,
        checklistItemId: resolvingItem.checklistItemId,
        resolvedBy,
        note,
      });
      setResolvingItem(null);
      loadDetail();
    } catch (err) {
      alert('Error resolving: ' + err.message);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteInspection(inspectionId);
      onDelete();
    } catch (err) {
      alert('Error deleting: ' + err.message);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 font-body flex items-center justify-center">
        <p className="text-gray-400">Loading inspection...</p>
      </div>
    );
  }

  if (!detail || !detail.inspection) {
    return (
      <div className="min-h-screen bg-gray-100 font-body flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Inspection not found.</p>
          <button onClick={onBack} className="text-gn-navy font-bold underline bg-transparent border-none cursor-pointer">Go Back</button>
        </div>
      </div>
    );
  }

  const { inspection, responses, resolutions } = detail;

  // Group responses by section
  const sectionMap = {};
  responses.forEach(r => {
    const sectionName = r.checklist_items?.checklist_sections?.name || 'Other';
    const sectionIcon = r.checklist_items?.checklist_sections?.icon || '📋';
    if (!sectionMap[sectionName]) sectionMap[sectionName] = { icon: sectionIcon, items: [] };
    const resolution = resolutions.find(res => res.checklist_item_id === r.checklist_item_id);
    sectionMap[sectionName].items.push({ ...r, resolution });
  });

  return (
    <div className="min-h-screen bg-gray-100 font-body">
      {resolvingItem && (
        <ResolveModal
          itemLabel={resolvingItem.label}
          drivers={driversList}
          onResolve={handleResolve}
          onCancel={() => setResolvingItem(null)}
        />
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-[360px] shadow-xl">
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">🗑️</div>
              <h3 className="text-gn-navy font-extrabold text-lg m-0">Delete Inspection?</h3>
              <p className="text-gray-500 text-sm mt-2">
                This will permanently delete this inspection and all its responses. This cannot be undone.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-600 font-bold text-sm cursor-pointer"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-3 rounded-xl border-none bg-red-500 text-white font-bold text-sm cursor-pointer hover:bg-red-600 transition-colors"
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-br from-gn-navy to-gn-navy-light p-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="bg-white/15 border-none text-white rounded-lg px-3 py-2 cursor-pointer text-sm"
          >
            ←
          </button>
          <div className="flex-1">
            <h1 className="text-gn-lime text-xl font-extrabold m-0">
              {inspection.trucks?.name || 'Unknown Truck'}
            </h1>
            <p className="text-white/60 text-xs m-0">
              Inspection on {new Date(inspection.date).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-red-500/20 border border-red-400/40 text-red-300 rounded-lg px-3 py-2 cursor-pointer text-xs font-bold hover:bg-red-500/30 transition-colors"
          >
            🗑 Delete
          </button>
        </div>
      </div>

      <div className="max-w-[500px] mx-auto p-4">
        {/* Vehicle info card */}
        <div className="bg-white rounded-xl p-4 mb-3 shadow-sm">
          <h3 className="text-gn-navy font-extrabold text-sm mb-3 uppercase tracking-wide">Vehicle Information</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-400 text-xs block">Driver</span>
              <span className="text-gn-navy font-bold">{inspection.drivers?.name || '—'}</span>
            </div>
            <div>
              <span className="text-gray-400 text-xs block">Truck</span>
              <span className="text-gn-navy font-bold">{inspection.trucks?.name || '—'}</span>
            </div>
            <div>
              <span className="text-gray-400 text-xs block">Miles</span>
              <span className="text-gn-navy font-bold">{inspection.miles || '—'}</span>
            </div>
            <div>
              <span className="text-gray-400 text-xs block">Date</span>
              <span className="text-gn-navy font-bold">{new Date(inspection.date).toLocaleDateString()}</span>
            </div>
            {inspection.tech_name && (
              <div>
                <span className="text-gray-400 text-xs block">Tech Name</span>
                <span className="text-gn-navy font-bold">{inspection.tech_name}</span>
              </div>
            )}
            {inspection.miles_to_oil_change && (
              <div>
                <span className="text-gray-400 text-xs block">Miles to Oil Change</span>
                <span className="text-gn-navy font-bold">{inspection.miles_to_oil_change}</span>
              </div>
            )}
          </div>
          {inspection.comments && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <span className="text-gray-400 text-xs block mb-1">Comments</span>
              <p className="text-gn-navy text-sm m-0">{inspection.comments}</p>
            </div>
          )}
        </div>

        {/* Checklist sections */}
        {Object.entries(sectionMap).map(([sectionName, section]) => (
          <div key={sectionName} className="bg-white rounded-xl p-4 mb-3 shadow-sm">
            <h3 className="text-gn-navy font-extrabold text-sm mb-3 uppercase tracking-wide">
              {section.icon} {sectionName}
            </h3>
            <div className="space-y-2">
              {section.items.map((item, idx) => {
                const isNo = item.value === 'no';
                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                      isNo ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
                    }`}
                  >
                    <span className={`text-sm ${isNo ? 'text-red-600 font-semibold' : 'text-gray-700'}`}>
                      {item.checklist_items?.label || 'Unknown'}
                    </span>
                    <div className="flex items-center gap-2">
                      {item.value === 'yes' ? (
                        <span className="bg-green-100 text-green-600 text-xs font-bold px-2.5 py-1 rounded-full">Yes</span>
                      ) : item.value === 'no' ? (
                        <>
                          <span className="bg-red-100 text-red-600 text-xs font-bold px-2.5 py-1 rounded-full">No</span>
                          {item.resolution ? (
                            <span className="bg-green-100 text-green-600 text-xs font-bold px-2 py-1 rounded-full">✓ Fixed</span>
                          ) : (
                            <button
                              onClick={() => setResolvingItem({
                                inspectionId: inspection.id,
                                checklistItemId: item.checklist_item_id,
                                label: item.checklist_items?.label || 'Unknown',
                              })}
                              className="bg-orange-100 text-orange-600 text-xs font-bold px-2 py-1 rounded-full border-none cursor-pointer hover:bg-orange-200"
                            >
                              Resolve
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-500 text-xs">{item.value || '—'}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Signature */}
        {inspection.signature_data && (
          <div className="bg-white rounded-xl p-4 mb-3 shadow-sm">
            <h3 className="text-gn-navy font-extrabold text-sm mb-3 uppercase tracking-wide">✍️ Signature</h3>
            <img src={inspection.signature_data} alt="Signature" className="max-w-full h-auto rounded-lg border border-gray-200" />
          </div>
        )}

        {/* Back button */}
        <button
          onClick={onBack}
          className="w-full py-3.5 rounded-xl border-2 border-gn-navy bg-white text-gn-navy text-sm font-bold cursor-pointer mt-2"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}

// ─── Truck Detail View ───
function TruckDetail({ truckName, truckId, drivers, onBack, onViewInspection }) {
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
      loadHistory();
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
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <strong className="text-gn-navy text-sm">
                      {new Date(insp.date).toLocaleDateString()}
                    </strong>
                    <div className="text-xs text-gray-400">
                      {insp.miles} mi | Tech: {insp.tech_name}
                    </div>
                  </div>
                  <button
                    onClick={() => onViewInspection(insp.id)}
                    className="bg-gn-navy/10 text-gn-navy text-xs font-bold px-3 py-1.5 rounded-lg border-none cursor-pointer hover:bg-gn-navy/20 transition-colors"
                  >
                    View Form
                  </button>
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
  const [authenticated, setAuthenticated] = useState(false);
  const [inspections, setInspections] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [viewingInspection, setViewingInspection] = useState(null);

  // Check if already authenticated this session
  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('dashboard_auth') === 'true') {
      setAuthenticated(true);
    }
  }, []);

  const loadData = () => {
    setLoading(true);
    Promise.all([getInspections(), getFormConfig()])
      .then(([insps, config]) => {
        setInspections(insps);
        setDrivers(config.drivers);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (authenticated) loadData();
  }, [authenticated]);

  // Show password gate if not authenticated
  if (!authenticated) {
    return <PasswordGate onUnlock={() => setAuthenticated(true)} />;
  }

  // Show inspection detail view
  if (viewingInspection) {
    return (
      <InspectionDetailView
        inspectionId={viewingInspection}
        drivers={drivers}
        onBack={() => setViewingInspection(null)}
        onDelete={() => {
          setViewingInspection(null);
          loadData(); // refresh after delete
        }}
      />
    );
  }

  if (selectedTruck) {
    return (
      <TruckDetail
        truckName={selectedTruck.name}
        truckId={selectedTruck.id}
        drivers={drivers}
        onBack={() => setSelectedTruck(null)}
        onViewInspection={(id) => setViewingInspection(id)}
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
          <div className="flex gap-2">
            <Link
              href="/admin"
              className="bg-white/15 border border-white/20 text-white/80 rounded-lg px-3 py-2 text-xs font-bold no-underline hover:bg-white/25 transition-colors"
            >
              ⚙ Admin
            </Link>
            <button
              onClick={() => {
                sessionStorage.removeItem('dashboard_auth');
                setAuthenticated(false);
              }}
              className="bg-red-500/20 border border-red-400/30 text-red-300 rounded-lg px-3 py-2 text-xs font-bold cursor-pointer hover:bg-red-500/30 transition-colors"
            >
              🔒 Lock
            </button>
          </div>
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
              className="bg-white rounded-xl p-4 mb-2.5 shadow-sm border-l-4 border-gn-lime"
            >
              <div
                onClick={() => setSelectedTruck({ id: insp.truck_id, name: insp.trucks?.name || 'Unknown' })}
                className="cursor-pointer flex justify-between items-center hover:opacity-80 transition-opacity"
              >
                <div>
                  <strong className="text-gn-navy text-sm">{insp.trucks?.name || 'Unknown'}</strong>
                  <div className="text-gray-400 text-xs mt-0.5">
                    {insp.drivers?.name || ''} · {new Date(insp.date).toLocaleDateString()} · {insp.miles} mi
                  </div>
                </div>
                <div className="text-gray-300 text-lg">›</div>
              </div>
              <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => setViewingInspection(insp.id)}
                  className="flex-1 py-2 rounded-lg bg-gn-navy/10 text-gn-navy text-xs font-bold border-none cursor-pointer hover:bg-gn-navy/20 transition-colors"
                >
                  📄 View Form
                </button>
                <button
                  onClick={() => setSelectedTruck({ id: insp.truck_id, name: insp.trucks?.name || 'Unknown' })}
                  className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold border-none cursor-pointer hover:bg-gray-200 transition-colors"
                >
                  📊 Truck History
                </button>
              </div>
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
