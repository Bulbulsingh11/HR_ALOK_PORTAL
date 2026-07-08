/**
 * IMPORTANT: Vercel Serverless Function for cron jobs.
 * 
 * Note: EmailJS dashboard must have "Allow EmailJS API for non-browser applications" 
 * enabled (Account > Security), otherwise these REST API requests get silently blocked.
 * 
 * Note: SUPABASE_SERVICE_ROLE_KEY must never be exposed to the frontend bundle — 
 * it should only be read inside /api serverless functions (which run server-side on Vercel, 
 * not bundled into the client JS).
 */

import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  // Verify the request is authorized
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const emailjsPrivateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!supabaseUrl || !supabaseServiceKey || !emailjsPrivateKey) {
    console.error('Missing required environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Use service role key to bypass RLS
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Fetch all active employees who haven't received both forms
    const { data: employees, error } = await supabase
      .from('employee_triggers')
      .select('*')
      .eq('employment_status', 'active')
      .or('onboarding_form_sent.eq.false,experience_form_sent.eq.false');

    if (error) {
      console.error('Error fetching employee triggers:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!employees || employees.length === 0) {
      console.log('No pending feedback triggers found.');
      return res.status(200).json({ processed: 0, sent: [] });
    }

    const sentEmails: string[] = [];
    const now = Date.now();

    for (const row of employees) {
      const joinDate = new Date(row.date_of_joining).getTime();
      const daysSinceJoining = Math.floor((now - joinDate) / 86400000);

      // Onboarding Form (6 weeks / 42 days)
      if (daysSinceJoining >= 42 && !row.onboarding_form_sent) {
        console.log(`Sending onboarding form to ${row.employee_email}...`);
        try {
          const emailRes = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              service_id: 'service_l1uaxok',
              template_id: 'template_zceq0wb',
              user_id: 'zUAWBN4oEdvyuq03C',
              accessToken: emailjsPrivateKey,
              template_params: {
                to_email: row.employee_email,
                subject: 'Onboarding Feedback Form | ALOK Masterbatches',
                message: '<p>It has been 6 weeks since you joined ALOK Masterbatches. Please share your onboarding feedback: <a href="https://docs.google.com/forms/d/e/1FAIpQLSfTWLKTir5kTVfK-aAGG7FIniCnJkKpo5ht_uBfcP-QR1qroQ/viewform">Fill Onboarding Feedback Form</a></p>'
              }
            })
          });

          if (emailRes.ok) {
            console.log(`Successfully sent onboarding form to ${row.employee_email}`);
            sentEmails.push(`${row.employee_name} (${row.employee_email}) - Onboarding`);
            await supabase
              .from('employee_triggers')
              .update({
                onboarding_form_sent: true,
                onboarding_form_sent_at: new Date().toISOString()
              })
              .eq('id', row.id);
          } else {
            const errText = await emailRes.text();
            console.error(`Failed to send onboarding form to ${row.employee_email}: ${errText}`);
          }
        } catch (emailErr) {
          console.error(`Exception while sending onboarding form to ${row.employee_email}:`, emailErr);
        }
      }

      // Experience Form (180 days)
      if (daysSinceJoining >= 180 && !row.experience_form_sent) {
        console.log(`Sending experience form to ${row.employee_email}...`);
        try {
          const emailRes = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              service_id: 'service_l1uaxok',
              template_id: 'template_zceq0wb',
              user_id: 'zUAWBN4oEdvyuq03C',
              accessToken: emailjsPrivateKey,
              template_params: {
                to_email: row.employee_email,
                subject: 'Employee Experience Feedback | ALOK Masterbatches',
                message: '<p>It has been 6 months since you joined ALOK Masterbatches. Please share your experience feedback: <a href="https://docs.google.com/forms/d/e/1FAIpQLScUad1roMCwiIiQD8GgMtcQrcqJJjAO1mP_7fhkOPHu-duitw/viewform">Fill Experience Feedback Form</a></p>'
              }
            })
          });

          if (emailRes.ok) {
            console.log(`Successfully sent experience form to ${row.employee_email}`);
            sentEmails.push(`${row.employee_name} (${row.employee_email}) - Experience`);
            await supabase
              .from('employee_triggers')
              .update({
                experience_form_sent: true,
                experience_form_sent_at: new Date().toISOString()
              })
              .eq('id', row.id);
          } else {
            const errText = await emailRes.text();
            console.error(`Failed to send experience form to ${row.employee_email}: ${errText}`);
          }
        } catch (emailErr) {
          console.error(`Exception while sending experience form to ${row.employee_email}:`, emailErr);
        }
      }
    }

    return res.status(200).json({
      processed: employees.length,
      sent: sentEmails
    });

  } catch (err: any) {
    console.error('Unhandled error in check-feedback-triggers:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
