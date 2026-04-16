'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

// ─── Editable List Component (reused for trucks, drivers, checklist items) ───
function EditableList({ title, tableName, columns, nameField = 'name' }) {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [newExtra, setNewExtra] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase.from(tableName).select('*').order(nameField);
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addItem = async () => {
    if (!newItem.trim()) return;
    const row = { [nameField]: newItem.trim() };
    if (columns.extra) row[columns.extra.field] = newExtra.trim();
    if (tableName === 'drivers' || tableName === 'trucks') row.is_active = true;
    await supabase.from(tableName).insert(row);
    setNewItem('');
    setNewExtra('');
    load();
  };

  const toggleActive = async (id, currentState) => {
    await supabase.from(tableName).update({ is_active: !currentState }).eq('id', id);
    load();
  };

  const deleteItem = async (id) => {
    if (!confirm('Are you sure? This cannot be undone.')) return;
    await supabase.from(tableName).delete().eq('id', id);
    load();
  };

  return (
    <div className="bg-white rounded-xl p-5 mb-4 shadow-sm">
      <h3 className="text-gn-navy font-extrabold text-base m-0 mb-3 border-b-[3px] border-gn-lime pb-2">
        {title}
      </h3>
      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : (
        <>
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex-1">
                <span className={`text-sm font-semibold ${
                  item.is_active === false ? 'text-gray-300 line-through' : 'text-gn-navy'
                }`}>
                  {item[nameField]}
                </span>
                {columns.extra && item[columns.extra.field] && (
                  <span className="text-xs text-gray-400 ml-2">
                    ({item[columns.extra.field]})
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {'is_active' in item && (
                  <button
                    onClick={() => toggleActive(item.id, item.is_active)}
                    className={`text-xs px-2.5 py-1 rounded-full border-none font-bold cursor-pointer ${
                      item.is_active
                        ? 'bg-green-50 text-green-600'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {item.is_active ? 'Active' : 'Inactive'}
                  </button>
                )}
                <button
                  onClick={() => deleteItem(item.id)}
                  className="text-xs text-red-400 bg-transparent border-none cursor-pointer hover:text-red-600"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
          <div className="flex gap-2 mt-3">
            <input
              type="text"
              placeholder={`Add ${title.toLowerCase().replace(/s$/, '')}...`}
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addItem()}
              className="flex-1 p-2.5 rounded-lg border-2 border-gray-200 text-sm text-gn-navy"
            />
            {columns.extra && (
              <input
                type="text"
                placeholder={columns.extra.placeholder}
                value={newExtra}
                onChange={e => setNewExtra(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addItem()}
                className="w-24 p-2.5 rounded-lg border-2 border-gray-200 text-sm text-gn-navy"
              />
            )}
            <button
              onClick={addItem}
              className="px-4 py-2.5 rounded-lg border-none bg-gn-lime text-gn-navy text-sm font-bold cursor-pointer"
            >
              + Add
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Checklist Editor (sections + items) ───
function ChecklistEditor() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newItemInputs, setNewItemInputs] = useState({});

  const load = async () => {
    const { data: secs } = await supabase.from('checklist_sections').select('*').order('sort_order');
    const { data: items } = await supabase.from('checklist_items').select('*').order('sort_order');
    const grouped = (secs || []).map(s => ({
      ...s,
      items: (items || []).filter(i => i.section_id === s.id),
    }));
    setSections(grouped);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addItem = async (sectionId) => {
    const label = newItemInputs[sectionId]?.trim();
    if (!label) return;
    const section = sections.find(s => s.id === sectionId);
    const maxOrder = Math.max(0, ...section.items.map(i => i.sort_order));
    await supabase.from('checklist_items').insert({
      section_id: sectionId,
      label,
      item_type: 'yes_no',
      sort_order: maxOrder + 1,
    });
    setNewItemInputs(prev => ({ ...prev, [sectionId]: '' }));
    load();
  };

  const deleteItem = async (id) => {
    await supabase.from('checklist_items').delete().eq('id', id);
    load();
  };

  const changeItemType = async (id, newType) => {
    await supabase.from('checklist_items').update({ item_type: newType }).eq('id', id);
    load();
  };

  return (
    <div className="bg-white rounded-xl p-5 mb-4 shadow-sm">
      <h3 className="text-gn-navy font-extrabold text-base m-0 mb-3 border-b-[3px] border-gn-lime pb-2">
        Checklist Sections & Items
      </h3>
      <p className="text-xs text-gray-400 mb-4">
        Add or remove items from each section. Changes take effect immediately on the inspection form.
      </p>
      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : (
        sections.map(section => (
          <div key={section.id} className="mb-5">
            <h4 className="text-sm font-bold text-gn-navy mb-2 flex items-center gap-2">
              <span>{section.icon}</span> {section.name}
              <span className="text-xs text-gray-400 font-normal">({section.items.length} items)</span>
            </h4>
            {section.items.map(item => (
              <div key={item.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 ml-4">
                <span className="text-sm text-gray-700">{item.label}</span>
                <div className="flex items-center gap-2">
                  <select
                    value={item.item_type}
                    onChange={e => changeItemType(item.id, e.target.value)}
                    className="text-[11px] p-1 rounded border border-gray-200 text-gray-500"
                  >
                    <option value="yes_no">Yes/No</option>
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                  </select>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="text-xs text-red-400 bg-transparent border-none cursor-pointer hover:text-red-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
            <div className="flex gap-2 mt-2 ml-4">
              <input
                type="text"
                placeholder="Add new item..."
                value={newItemInputs[section.id] || ''}
                onChange={e => setNewItemInputs(prev => ({ ...prev, [section.id]: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addItem(section.id)}
                className="flex-1 p-2 rounded-lg border-2 border-gray-200 text-sm text-gn-navy"
              />
              <button
                onClick={() => addItem(section.id)}
                className="px-3 py-2 rounded-lg border-none bg-gn-lime text-gn-navy text-xs font-bold cursor-pointer"
              >
                + Add
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Admin Page ───
export default function Admin() {
  return (
    <div className="min-h-screen bg-gray-100 font-body">
      <div className="bg-gradient-to-br from-gn-navy to-gn-navy-light p-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-gn-lime text-xl font-extrabold m-0">Admin Panel</h1>
            <p className="text-white/60 text-xs m-0">Manage trucks, drivers, and checklist items</p>
          </div>
          <Link
            href="/dashboard"
            className="bg-white/15 border border-white/20 text-white/80 rounded-lg px-3 py-2 text-xs font-bold no-underline"
          >
            ← Dashboard
          </Link>
        </div>
      </div>

      <div className="max-w-[500px] mx-auto p-4">
        <EditableList
          title="Trucks"
          tableName="trucks"
          columns={{ extra: { field: 'equipment_color', placeholder: 'Color' } }}
        />

        <EditableList
          title="Drivers"
          tableName="drivers"
          columns={{ extra: { field: 'initials', placeholder: 'Initials' } }}
        />

        <ChecklistEditor />

        <Link
          href="/"
          className="block w-full py-3.5 rounded-xl border-2 border-gn-navy bg-white text-gn-navy text-sm font-bold text-center no-underline mt-4"
        >
          ← Back to Inspection Form
        </Link>
      </div>
    </div>
  );
}
