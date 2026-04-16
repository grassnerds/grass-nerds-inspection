import { supabase } from './supabase';

// ─── Fetch form config (sections + items, drivers, trucks) ───
export async function getFormConfig() {
  const [sectionsRes, itemsRes, driversRes, trucksRes] = await Promise.all([
    supabase.from('checklist_sections').select('*').order('sort_order'),
    supabase.from('checklist_items').select('*').order('sort_order'),
    supabase.from('drivers').select('*').eq('is_active', true).order('name'),
    supabase.from('trucks').select('*').eq('is_active', true).order('name'),
  ]);

  // Group items under their sections
  const sections = (sectionsRes.data || []).map(section => ({
    ...section,
    items: (itemsRes.data || []).filter(item => item.section_id === section.id),
  }));

  return {
    sections,
    drivers: driversRes.data || [],
    trucks: trucksRes.data || [],
  };
}

// ─── Submit an inspection ───
export async function submitInspection({ truckId, driverId, miles, date, comments, techName, signature, milesToOilChange, responses }) {
  // 1. Insert the inspection record
  const { data: inspection, error: inspError } = await supabase
    .from('inspections')
    .insert({
      truck_id: truckId,
      driver_id: driverId,
      miles,
      date,
      comments,
      tech_name: techName,
      signature_data: signature,
      miles_to_oil_change: milesToOilChange,
    })
    .select()
    .single();

  if (inspError) throw inspError;

  // 2. Insert all responses
  const responseRows = Object.entries(responses).map(([checklistItemId, value]) => ({
    inspection_id: inspection.id,
    checklist_item_id: checklistItemId,
    value,
  }));

  if (responseRows.length > 0) {
    const { error: respError } = await supabase
      .from('inspection_responses')
      .insert(responseRows);
    if (respError) throw respError;
  }

  // 3. Send email notification
  try {
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inspectionId: inspection.id }),
    });
  } catch (e) {
    console.warn('Email notification failed:', e);
  }

  return inspection;
}

// ─── Get all inspections (dashboard) ───
export async function getInspections() {
  const { data, error } = await supabase
    .from('inspections')
    .select(`
      *,
      trucks ( id, name, equipment_color ),
      drivers ( id, name, initials )
    `)
    .order('submitted_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// ─── Get inspection detail with responses ───
export async function getInspectionDetail(inspectionId) {
  const [inspRes, respRes, resolRes] = await Promise.all([
    supabase.from('inspections').select('*, trucks(*), drivers(*)').eq('id', inspectionId).single(),
    supabase.from('inspection_responses').select('*, checklist_items(*, checklist_sections(*))').eq('inspection_id', inspectionId),
    supabase.from('issue_resolutions').select('*').eq('inspection_id', inspectionId),
  ]);

  return {
    inspection: inspRes.data,
    responses: respRes.data || [],
    resolutions: resolRes.data || [],
  };
}

// ─── Get inspections for a specific truck ───
export async function getTruckHistory(truckId) {
  const { data, error } = await supabase
    .from('inspections')
    .select(`
      *,
      drivers ( id, name, initials ),
      inspection_responses ( *, checklist_items ( *, checklist_sections(*) ) ),
      issue_resolutions ( * )
    `)
    .eq('truck_id', truckId)
    .order('date', { ascending: false });

  if (error) throw error;
  return data || [];
}

// ─── Resolve an issue ───
export async function resolveIssue({ inspectionId, checklistItemId, resolvedBy, note }) {
  const { data, error } = await supabase
    .from('issue_resolutions')
    .insert({
      inspection_id: inspectionId,
      checklist_item_id: checklistItemId,
      resolved_by: resolvedBy,
      resolution_note: note,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
