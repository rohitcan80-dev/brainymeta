/**
 * Brainy Bee's STEM — Cloudflare Worker
 * Handles the "Contact Us" / free assessment request form on brainybee.ca.
 * Repurposed from the old summer camp registration worker — same
 * Worker name/deployment/KV namespace, new field names + copy.
 * Stores in KV + sends email via Resend API.
 * Deploy: wrangler deploy workers/registration.js
 */

export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    try {
      const data = await request.json();

      // Validate required fields
      const required = ["name", "email", "grade", "subject"];
      for (const field of required) {
        if (!data[field] || !data[field].toString().trim()) {
          return new Response(
            JSON.stringify({ success: false, error: `Missing required field: ${field}` }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Generate inquiry ID
      const inquiryId = `STEM-${Date.now()}-${Math.random().toString(36).substr(2,6).toUpperCase()}`;
      const timestamp = new Date().toISOString();

      const inquiry = {
        id: inquiryId,
        timestamp,
        status: "pending",
        parentName: data.name,
        email: data.email,
        grade: data.grade,
        subject: data.subject,
        message: data.message || "None provided",
      };

      // Store in Cloudflare KV (same REGISTRATIONS namespace, reused for inquiries)
      await env.REGISTRATIONS.put(inquiryId, JSON.stringify(inquiry), {
        expirationTtl: 60 * 60 * 24 * 365, // 1 year
      });

      // Add to inquiries index
      const indexKey = "inquiries_index";
      let index = [];
      try {
        const existing = await env.REGISTRATIONS.get(indexKey);
        if (existing) index = JSON.parse(existing);
      } catch(e) {}
      index.unshift({ id: inquiryId, timestamp, parentName: data.name, email: data.email });
      await env.REGISTRATIONS.put(indexKey, JSON.stringify(index.slice(0, 500)));

      // Send emails via Resend
      if (env.RESEND_API_KEY) {
        await sendEmails(env.RESEND_API_KEY, inquiry);
      }

      return new Response(
        JSON.stringify({ success: true, inquiryId }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } catch (err) {
      return new Response(
        JSON.stringify({ success: false, error: "Server error. Please call 647-713-2781." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  },
};

async function sendEmails(apiKey, inq) {
  const headers = {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  // Email to Brainy Bee's STEM
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers,
    body: JSON.stringify({
      from: "Brainy Bee's STEM <noreply@brainybee.ca>",
      to: ["info@brainybee.ca"],
      subject: `🐝 New assessment request: ${inq.parentName} (${inq.id})`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#1E5FA8;padding:20px;border-radius:8px 8px 0 0;text-align:center">
            <h1 style="color:#fff;margin:0">🐝 New Assessment Request!</h1>
          </div>
          <div style="background:#f9f9f9;padding:24px;border:1px solid #eee">
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px;font-weight:bold;color:#666;width:40%">Inquiry ID</td><td style="padding:8px"><strong>${inq.id}</strong></td></tr>
              <tr style="background:#fff"><td style="padding:8px;font-weight:bold;color:#666">Parent Name</td><td style="padding:8px">${inq.parentName}</td></tr>
              <tr><td style="padding:8px;font-weight:bold;color:#666">Email</td><td style="padding:8px"><a href="mailto:${inq.email}">${inq.email}</a></td></tr>
              <tr style="background:#fff"><td style="padding:8px;font-weight:bold;color:#666">Child's Grade</td><td style="padding:8px">${inq.grade}</td></tr>
              <tr><td style="padding:8px;font-weight:bold;color:#666">Subject Interest</td><td style="padding:8px"><strong style="color:#1E5FA8">${inq.subject}</strong></td></tr>
              <tr style="background:#fff"><td style="padding:8px;font-weight:bold;color:#666">Message</td><td style="padding:8px">${inq.message}</td></tr>
              <tr><td style="padding:8px;font-weight:bold;color:#666">Submitted</td><td style="padding:8px">${new Date(inq.timestamp).toLocaleString('en-CA', {timeZone:'America/Toronto'})}</td></tr>
            </table>
            <div style="margin-top:20px;padding:16px;background:#FFF9E6;border-radius:8px;border-left:4px solid #F0A93B">
              <p style="margin:0;font-weight:bold">⚡ Action Required: Contact ${inq.parentName} within 1 business day to schedule the free assessment.</p>
            </div>
          </div>
        </div>
      `,
    }),
  });

  // Confirmation email to parent
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers,
    body: JSON.stringify({
      from: "Brainy Bee's STEM <info@brainybee.ca>",
      to: [inq.email],
      subject: `🐝 We received your request for a free assessment!`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#1E5FA8;padding:32px;border-radius:8px 8px 0 0;text-align:center">
            <div style="font-size:3rem">🐝</div>
            <h1 style="color:#fff;margin:8px 0 0">Request Received!</h1>
          </div>
          <div style="padding:32px;background:#fff;border:1px solid #eee">
            <p style="font-size:16px">Hi ${inq.parentName}!</p>
            <p style="color:#555;line-height:1.7">Thanks for reaching out to Brainy Bee's STEM. We're excited to meet your child and find the right starting level for them.</p>
            <div style="background:#FFF9E6;border-radius:8px;padding:20px;margin:24px 0;border:1px solid #F0A93B">
              <h3 style="margin:0 0 12px;color:#0F3D66">📋 Your Request Summary</h3>
              <p style="margin:4px 0;color:#555"><strong>Grade:</strong> ${inq.grade}</p>
              <p style="margin:4px 0;color:#555"><strong>Subject interest:</strong> ${inq.subject}</p>
              <p style="margin:4px 0;color:#555"><strong>Your Reference:</strong> ${inq.id}</p>
            </div>
            <div style="background:#E7F0FA;border-radius:8px;padding:20px;margin:24px 0">
              <h3 style="margin:0 0 8px;color:#0F3D66">⏰ What Happens Next?</h3>
              <p style="margin:4px 0;color:#555">✅ We'll contact you within <strong>1 business day</strong> to schedule your free 20-minute assessment</p>
              <p style="margin:4px 0;color:#555">📋 We'll recommend the right starting level for your child</p>
            </div>
            <div style="text-align:center;margin:32px 0">
              <a href="tel:6477132781" style="background:#1E5FA8;color:#fff;padding:14px 32px;border-radius:50px;text-decoration:none;font-weight:bold;font-size:16px">📞 Call Us: 647-713-2781</a>
            </div>
            <div style="border-top:1px solid #eee;padding-top:20px;text-align:center;color:#999;font-size:13px">
              <p>Brainy Bee's STEM · Toronto, ON</p>
            </div>
          </div>
        </div>
      `,
    }),
  });
}
