export const config = {
    runtime: 'edge', // Using Edge runtime for fast, lightweight execution
};

// In-memory rate limiting Map (per edge isolate)
const rateLimit = new Map();

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // Basic IP-based Rate Limiting (5 requests per minute per IP)
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 5;

    if (!rateLimit.has(ip)) {
        rateLimit.set(ip, { count: 1, resetTime: now + windowMs });
    } else {
        const data = rateLimit.get(ip);
        if (now > data.resetTime) {
            rateLimit.set(ip, { count: 1, resetTime: now + windowMs });
        } else if (data.count >= maxRequests) {
            return new Response(JSON.stringify({ error: 'Too Many Requests. Please try again later.' }), {
                status: 429,
                headers: { 'Content-Type': 'application/json' },
            });
        } else {
            data.count++;
        }
    }

    try {
        const { email } = await req.json();

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return new Response(JSON.stringify({ error: 'Invalid email address' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            console.error("Missing Supabase environment variables.");
            return new Response(JSON.stringify({ error: 'Server configuration error' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Send to Supabase via REST API
        // We use the REST API here so we don't have to install the @supabase/supabase-js package
        const response = await fetch(`${SUPABASE_URL}/rest/v1/subscribers`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (!response.ok) {
            // Handle unique constraint violation (duplicate email)
            if (data.code === '23505') {
                return new Response(JSON.stringify({ error: 'already_subscribed' }), {
                    status: 409, // Conflict
                    headers: { 'Content-Type': 'application/json' },
                });
            }
            throw new Error(data.message || 'Error inserting into database');
        }

        return new Response(JSON.stringify({ success: true, user: data[0] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Subscription error:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
