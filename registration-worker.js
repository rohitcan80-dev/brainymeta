/**
 * Brainy Bees Summer Camp - Cloudflare Worker
 * Handles registration form submissions
 * Stores in KV + sends email via Resend API
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
      const required = ["parentName","email","phone","childName","childAge","weeks","emergency"];
      for (const field of required) {
        if (!data[field] || !data[field].toString().trim()) {
          return new Response(
            JSON.stringify({ success: false, error: `Missing required field: ${field}` }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Generate registration ID
      const regId = `BB-${Date.now()}-${Math.random().toString(36).substr(2,6).toUpperCase()}`;
      const timestamp = new Date().toISOString();

      const registration = {
        id: regId,
        timestamp,
        status: "pending",
        parentName: data.parentName,
        email: data.email,
        phone: data.phone,
        childName: data.childName,
        childAge: data.childAge,
        weeks: data.weeks,
        emergency: data.emergency,
        medical: data.medical || "None provided",
      };

      // Store in Cloudflare KV
      await env.REGISTRATIONS.put(regId, JSON.stringify(registration), {
        expirationTtl: 60 * 60 * 24 * 365, // 1 year
      });

      // Add to registrations index
      const indexKey = "registrations_index";
      let index = [];
      try {
        const existing = await env.REGISTRATIONS.get(indexKey);
        if (existing) index = JSON.parse(existing);
      } catch(e) {}
      index.unshift({ id: regId, timestamp, childName: data.childName, email: data.email });
      await env.REGISTRATIONS.put(indexKey, JSON.stringify(index.slice(0, 500)));

      // Send confirmation email via Resend
      if (env.RESEND_API_KEY) {
        await sendEmails(env.RESEND_API_KEY, registration);
      }

      return new Response(
        JSON.stringify({ success: true, registrationId: regId }),
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

async function sendEmails(apiKey, reg) {
  const headers = {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  // Email to camp owner
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers,
    body: JSON.stringify({
      from: "Brainy Bees System <noreply@brainybeescamp.ca>",
      to: ["info@brainybeescamp.ca"],
      subject: `🐝 New Registration: ${reg.childName} (${reg.id})`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#FF8C00;padding:20px;border-radius:8px 8px 0 0;text-align:center">
            <h1 style="color:#fff;margin:0">🐝 New Camp Registration!</h1>
          </div>
          <div style="background:#f9f9f9;padding:24px;border:1px solid #eee">
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px;font-weight:bold;color:#666;width:40%">Registration ID</td><td style="padding:8px"><strong>${reg.id}</strong></td></tr>
              <tr style="background:#fff"><td style="padding:8px;font-weight:bold;color:#666">Parent Name</td><td style="padding:8px">${reg.parentName}</td></tr>
              <tr><td style="padding:8px;font-weight:bold;color:#666">Email</td><td style="padding:8px"><a href="mailto:${reg.email}">${reg.email}</a></td></tr>
              <tr style="background:#fff"><td style="padding:8px;font-weight:bold;color:#666">Phone</td><td style="padding:8px"><a href="tel:${reg.phone}">${reg.phone}</a></td></tr>
              <tr><td style="padding:8px;font-weight:bold;color:#666">Child's Name</td><td style="padding:8px">${reg.childName}</td></tr>
              <tr style="background:#fff"><td style="padding:8px;font-weight:bold;color:#666">Child's Age</td><td style="padding:8px">${reg.childAge}</td></tr>
              <tr><td style="padding:8px;font-weight:bold;color:#666">Weeks Requested</td><td style="padding:8px"><strong style="color:#FF8C00">${reg.weeks}</strong></td></tr>
              <tr style="background:#fff"><td style="padding:8px;font-weight:bold;color:#666">Emergency Contact</td><td style="padding:8px">${reg.emergency}</td></tr>
              <tr><td style="padding:8px;font-weight:bold;color:#666">Medical Info</td><td style="padding:8px">${reg.medical}</td></tr>
              <tr style="background:#fff"><td style="padding:8px;font-weight:bold;color:#666">Submitted</td><td style="padding:8px">${new Date(reg.timestamp).toLocaleString('en-CA', {timeZone:'America/Toronto'})}</td></tr>
            </table>
            <div style="margin-top:20px;padding:16px;background:#FFF9E6;border-radius:8px;border-left:4px solid #FF8C00">
              <p style="margin:0;font-weight:bold">⚡ Action Required: Contact ${reg.parentName} within 24 hours to confirm spot and arrange payment of $175/week.</p>
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
      from: "Brainy Bees Summer Camp <info@brainybeescamp.ca>",
      to: [reg.email],
      subject: `🐝 We received your registration for ${reg.childName}!`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#FF8C00;padding:32px;border-radius:8px 8px 0 0;text-align:center">
            <div style="font-size:3rem">🐝</div>
            <h1 style="color:#fff;margin:8px 0 0">Registration Received!</h1>
          </div>
          <div style="padding:32px;background:#fff;border:1px solid #eee">
            <p style="font-size:16px">Hi ${reg.parentName}!</p>
            <p style="color:#555;line-height:1.7">Thank you for registering <strong>${reg.childName}</strong> for Brainy Bees Summer Camp! We're so excited to have them join us.</p>
            <div style="background:#FFF9E6;border-radius:8px;padding:20px;margin:24px 0;border:1px solid #FFD700">
              <h3 style="margin:0 0 12px;color:#1A1A2E">📋 Your Registration Summary</h3>
              <p style="margin:4px 0;color:#555"><strong>Child:</strong> ${reg.childName} (${reg.childAge})</p>
              <p style="margin:4px 0;color:#555"><strong>Weeks:</strong> ${reg.weeks}</p>
              <p style="margin:4px 0;color:#555"><strong>Your Reference:</strong> ${reg.id}</p>
            </div>
            <div style="background:#E8F4FD;border-radius:8px;padding:20px;margin:24px 0">
              <h3 style="margin:0 0 8px;color:#1A1A2E">⏰ What Happens Next?</h3>
              <p style="margin:4px 0;color:#555">✅ We'll contact you within <strong>24 hours</strong> to confirm your spot</p>
              <p style="margin:4px 0;color:#555">💳 We'll discuss payment options ($175 per week)</p>
              <p style="margin:4px 0;color:#555">📋 We'll send you the full camp information package</p>
            </div>
            <div style="text-align:center;margin:32px 0">
              <a href="tel:6477132781" style="background:#FF8C00;color:#fff;padding:14px 32px;border-radius:50px;text-decoration:none;font-weight:bold;font-size:16px">📞 Call Us: 647-713-2781</a>
            </div>
            <div style="border-top:1px solid #eee;padding-top:20px;text-align:center;color:#999;font-size:13px">
              <p>Brainy Bees Summer Camp</p>
              <p>85 Ellesmere Rd, Unit 205, Scarborough, ON M1R 4B7</p>
              <p>📸 <a href="https://instagram.com/brainy_bees_" style="color:#FF8C00">@brainy_bees_</a></p>
            </div>
          </div>
        </div>
      `,
    }),
  });
}
