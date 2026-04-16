'use client';

export default function Section({ title, icon, children }) {
  return (
    <div className="bg-white rounded-xl p-5 pb-3 mb-4 shadow-sm">
      <div className="flex items-center gap-2.5 mb-3 pb-2.5 border-b-[3px] border-gn-lime">
        <span className="text-xl">{icon}</span>
        <h2 className="m-0 text-base font-extrabold text-gn-navy uppercase tracking-wide font-heading">
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}
