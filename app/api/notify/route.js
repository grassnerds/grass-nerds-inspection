import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    const { inspectionId } = await request.json();

    // Fetch inspection with related data
    const { data: inspection } = await supabase
      .from('inspections')
      .select('*, trucks(*), drivers(*)')
      .eq('id', inspectionId)
      .single();

    if (!inspection) {
      return Response.json({ error: 'Inspection not found' }, { status: 404 });
    }

    // Fetch responses that are "no"
    const { data: responses } = await supabase
      .from('inspection_responses')
      .select('*, checklist_items(*, checklist_sections(*))')
      .eq('inspection_id', inspectionId)
      .eq('value', 'no');

    const flaggedItems = (responses || []).map(r => ({
      section: r.checklist_items?.checklist_sections?.name || '',
      item: r.checklist_items?.label || '',
    }));

    // Get manager email from settings
    const { data: setting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'manager_email')
      .single();

    const managerEmail = setting?.value || process.env.MANAGER_EMAIL;

    if (!managerEmail) {
      return Response.json({ error: 'No manager email configured' }, { status: 400 });
    }

    // Build email HTML
    const truckName = inspection.trucks?.name || 'Unknown';
    const driverName = inspection.drivers?.name || 'Unknown';
    const flaggedHtml = flaggedItems.length > 0
      ? `
        <div style="background:#fde8e8;border:2px solid #e74c3c;border-radius:12px;padding:16px;margin:16px 0;">
          <h3 style="color:#e74c3c;margin:0 0 8px;">⚠ Flagged Items (${flaggedItems.length})</h3>
          ${flaggedItems.map(f => `<div style="padding:4px 0;font-size:14px;"><strong style="color:#e74c3c;">NO</strong> — ${f.section} > ${f.item}</div>`).join('')}
        </div>
      `
      : `
        <div style="background:#e8f7e0;border:2px solid #c1d62f;border-radius:12px;padding:16px;margin:16px 0;text-align:center;">
          <p style="color:#162f6e;font-weight:bold;">🎉 All items passed! No issues flagged.</p>
        </div>
      `;

    const html = `
      <div style="font-family:'Segoe UI',sans-serif;max-width:500px;margin:0 auto;">
        <div style="background:#162f6e;padding:20px;border-radius:12px 12px 0 0;">
          <h1 style="color:#c1d62f;margin:0;font-size:20px;">GRASS NERDS</h1>
          <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:13px;">Truck Inspection Submitted</p>
        </div>
        <div style="background:#fff;padding:20px;border-radius:0 0 12px 12px;border:1px solid #e0e3ea;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
            <div><span style="color:#8890a0;font-size:12px;">Driver</span><br/><strong>${driverName}</strong></div>
            <div><span style="color:#8890a0;font-size:12px;">Truck</span><br/><strong>${truckName}</strong></div>
            <div><span style="color:#8890a0;font-size:12px;">Miles</span><br/><strong>${inspection.miles || 'N/A'}</strong></div>
            <div><span style="color:#8890a0;font-size:12px;">Date</span><br/><strong>${inspection.date}</strong></div>
          </div>
          ${flaggedHtml}
          ${inspection.comments ? `<p style="color:#555;font-size:14px;"><strong>Comments:</strong> ${inspection.comments}</p>` : ''}
        </div>
      </div>
    `;

    // Send email via SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Grass Nerds Inspections" <${process.env.SMTP_USER}>`,
      to: managerEmail,
      subject: `🚛 Inspection: ${truckName} — ${driverName} (${flaggedItems.length > 0 ? `${flaggedItems.length} issues` : 'All clear'})`,
      html,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
