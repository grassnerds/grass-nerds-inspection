'use client';

export default function SubmittedView({ data, onNewInspection }) {
  const flagged = data.flagged || [];

  return (
    <div className="min-h-screen bg-gray-100 font-body">
      <div className="bg-gradient-to-br from-gn-navy to-gn-navy-light p-8 text-center">
        <div className="text-6xl mb-2">✓</div>
        <h1 className="text-gn-lime text-2xl font-extrabold m-0">Inspection Submitted!</h1>
        <p className="text-white/70 text-sm mt-2">Manager has been notified via email</p>
      </div>
      <div className="max-w-[500px] mx-auto p-4">
        <div className="bg-white rounded-xl p-5 mb-4 shadow-sm">
          <h3 className="text-gn-navy font-bold mb-3 text-base">Summary</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-400">Driver:</span><br /><strong>{data.driverName}</strong></div>
            <div><span className="text-gray-400">Truck:</span><br /><strong>{data.truckName}</strong></div>
            <div><span className="text-gray-400">Miles:</span><br /><strong>{data.miles}</strong></div>
            <div><span className="text-gray-400">Date:</span><br /><strong>{data.date}</strong></div>
          </div>
        </div>

        {flagged.length > 0 ? (
          <div className="bg-red-50 border-2 border-red-500 rounded-xl p-5 mb-4">
            <h3 className="text-red-500 font-bold mb-2 text-base">
              ⚠ Flagged Items ({flagged.length})
            </h3>
            {flagged.map((f, i) => (
              <div key={i} className={`py-1.5 text-sm text-gray-700 ${i < flagged.length - 1 ? 'border-b border-red-100' : ''}`}>
                <span className="text-red-500 font-bold">NO</span> — {f.section} &gt; {f.item}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-green-50 border-2 border-gn-lime rounded-xl p-5 mb-4 text-center">
            <span className="text-3xl">🎉</span>
            <p className="text-gn-navy font-bold mt-2">All items passed! No issues flagged.</p>
          </div>
        )}

        {data.comments && (
          <div className="bg-white rounded-xl p-5 mb-4 shadow-sm">
            <h3 className="text-gn-navy font-bold mb-2 text-base">Comments</h3>
            <p className="text-sm text-gray-600 m-0">{data.comments}</p>
          </div>
        )}

        <button
          onClick={onNewInspection}
          className="w-full py-4 rounded-xl border-none bg-gradient-to-br from-gn-navy to-gn-navy-light text-white text-base font-bold cursor-pointer"
        >
          Start New Inspection
        </button>
      </div>
    </div>
  );
}
