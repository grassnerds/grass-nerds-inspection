'use client';
import { useState } from 'react';
import Section from './Section';
import YesNoToggle from './YesNoToggle';
import SignaturePad from './SignaturePad';
import { submitInspection } from '../lib/data';

export default function InspectionForm({ sections, drivers, trucks, onSubmitted }) {
  const [driverId, setDriverId] = useState('');
  const [truckId, setTruckId] = useState('');
  const [miles, setMiles] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [comments, setComments] = useState('');
  const [techName, setTechName] = useState('');
  const [signature, setSignature] = useState(null);
  const [milesToOilChange, setMilesToOilChange] = useState('');
  const [responses, setResponses] = useState({}); // { checklistItemId: 'yes'|'no'|text }
  const [submitting, setSubmitting] = useState(false);

  const updateResponse = (itemId, value) => {
    setResponses(prev => ({ ...prev, [itemId]: value }));
  };

  // Count completion
  const totalItems = sections.reduce((sum, s) => sum + s.items.filter(i => i.item_type === 'yes_no').length, 0);
  const completedItems = Object.values(responses).filter(v => v === 'yes' || v === 'no').length;
  const pct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const result = await submitInspection({
        truckId, driverId, miles, date, comments, techName, signature, milesToOilChange, responses,
      });
      // Gather flagged items for the confirmation screen
      const flagged = [];
      sections.forEach(section => {
        section.items.forEach(item => {
          if (responses[item.id] === 'no') {
            flagged.push({ section: section.name, item: item.label });
          }
        });
      });
      const driverName = drivers.find(d => d.id === driverId)?.name || '';
      const truckName = trucks.find(t => t.id === truckId)?.name || '';
      onSubmitted({ ...result, flagged, driverName, truckName, date, miles, comments });
    } catch (err) {
      alert('Error submitting inspection: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[500px] mx-auto px-4 pb-24 pt-4">
      {/* Vehicle Info */}
      <Section title="Vehicle Information" icon="🚛">
        <div className="mb-3">
          <label className="text-xs font-semibold text-gray-400 block mb-1">Driver Name</label>
          <select
            value={driverId}
            onChange={e => setDriverId(e.target.value)}
            className="w-full p-3 rounded-lg border-2 border-gray-200 text-sm font-semibold text-gn-navy bg-white"
          >
            <option value="">Select driver...</option>
            {drivers.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label className="text-xs font-semibold text-gray-400 block mb-1">Truck Name</label>
          <select
            value={truckId}
            onChange={e => setTruckId(e.target.value)}
            className="w-full p-3 rounded-lg border-2 border-gray-200 text-sm font-semibold text-gn-navy bg-white"
          >
            <option value="">Select truck...</option>
            {trucks.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-1">Miles</label>
            <input
              type="text"
              placeholder="e.g. 100,700"
              value={miles}
              onChange={e => setMiles(e.target.value)}
              className="w-full p-3 rounded-lg border-2 border-gray-200 text-sm font-semibold text-gn-navy"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full p-3 rounded-lg border-2 border-gray-200 text-sm font-semibold text-gn-navy"
            />
          </div>
        </div>
      </Section>

      {/* Dynamic checklist sections from database */}
      {sections.map(section => (
        <Section key={section.id} title={section.name} icon={section.icon || '📋'}>
          {section.items.map(item => {
            if (item.item_type === 'text' || item.item_type === 'number') {
              return (
                <div key={item.id} className="py-2.5 border-b border-gray-100">
                  <label className="text-xs font-semibold text-gray-400 block mb-1">{item.label}</label>
                  <input
                    type={item.item_type === 'number' ? 'number' : 'text'}
                    placeholder={`Enter ${item.label.toLowerCase()}...`}
                    value={responses[item.id] || ''}
                    onChange={e => updateResponse(item.id, e.target.value)}
                    className="w-full p-2.5 rounded-lg border-2 border-gray-200 text-sm font-semibold text-gn-navy"
                  />
                </div>
              );
            }
            return (
              <YesNoToggle
                key={item.id}
                label={item.label}
                value={responses[item.id]}
                onChange={val => updateResponse(item.id, val)}
              />
            );
          })}
        </Section>
      ))}

      {/* Comments */}
      <Section title="Additional Comments" icon="📝">
        <textarea
          placeholder="Truck needs, equipment needs, or other notes..."
          value={comments}
          onChange={e => setComments(e.target.value)}
          rows={4}
          className="w-full p-3 rounded-lg border-2 border-gray-200 text-sm text-gn-navy resize-y font-body"
        />
      </Section>

      {/* Tech Sign-Off */}
      <Section title="Tech Sign-Off" icon="✏️">
        <div className="mb-3">
          <label className="text-xs font-semibold text-gray-400 block mb-1">Tech Name</label>
          <input
            type="text"
            placeholder="Your name"
            value={techName}
            onChange={e => setTechName(e.target.value)}
            className="w-full p-3 rounded-lg border-2 border-gray-200 text-sm font-semibold text-gn-navy"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-400 block mb-1">Signature (draw below)</label>
          <SignaturePad onSignatureChange={setSignature} />
        </div>
      </Section>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!driverId || !truckId || !techName || submitting}
        className={`w-full py-4 rounded-xl border-none text-lg font-extrabold tracking-wide mt-2 ${
          !driverId || !truckId || !techName || submitting
            ? 'bg-gray-300 text-white cursor-not-allowed'
            : 'bg-gn-lime text-gn-navy cursor-pointer shadow-lg'
        }`}
      >
        {submitting ? 'Submitting...' : 'Submit Inspection ✓'}
      </button>
    </div>
  );
}
