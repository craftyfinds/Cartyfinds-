import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://craftyfinds.github.io",
  "http://localhost:3000",
  "http://localhost:8000",
  "http://localhost",
]);

function jsonResponse(status: number, body: Record<string, unknown> | null, origin: string | null) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": origin ?? "https://craftyfinds.github.io",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Rate-Limit-Remaining",
  };

  return new Response(body ? JSON.stringify(body) : null, {
    status,
    headers,
  });
}

function normalizeNumber(value: unknown, fallback = 0) {
  const num = Number(value ?? fallback);
  return Number.isFinite(num) ? num : fallback;
}

serve(async (req) => {
  const origin = req.headers.get("Origin");
  const requestOrigin = origin && allowedOrigins.has(origin) ? origin : "https://craftyfinds.github.io";

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": requestOrigin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Rate-Limit-Remaining",
      },
    });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" }, requestOrigin);
  }

  if (origin && !allowedOrigins.has(origin)) {
    return jsonResponse(403, { error: "Origin not allowed" }, origin || requestOrigin);
  }

  const rateLimitHeader = req.headers.get("x-rate-limit-remaining");
  if (rateLimitHeader === "0") {
    return jsonResponse(429, { error: "Rate limit exceeded" }, requestOrigin);
  }

  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return jsonResponse(400, { error: "Content-Type must be application/json" }, requestOrigin);
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse(400, { error: "Invalid JSON body" }, requestOrigin);
  }

  if (!payload || !Array.isArray(payload.items) || payload.items.length === 0) {
    return jsonResponse(400, { error: "items must be a non-empty array" }, requestOrigin);
  }

  const normalizedItems = payload.items.map((item: any, index: number) => {
    if (!item || typeof item !== "object") {
      throw new Error(`Item ${index} is invalid`);
    }

    const qty = Number(item.qty);
    const unitPrice = Number(item.unit_price);
    const computedLineTotal = qty * unitPrice;
    const givenLineTotal = Number(item.line_total ?? computedLineTotal);

    if (!Number.isFinite(qty) || qty < 1) {
      throw new Error(`Item ${index}: qty must be >= 1`);
    }
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      throw new Error(`Item ${index}: unit_price must be >= 0`);
    }
    if (Math.abs(givenLineTotal - computedLineTotal) > 0.01) {
      throw new Error(`Item ${index}: line_total does not match qty * unit_price`);
    }

    return {
      product_id: String(item.product_id ?? ""),
      title: String(item.title ?? "Product").trim(),
      qty: Math.round(qty),
      unit_price: Number(unitPrice.toFixed(2)),
      line_total: Number(givenLineTotal.toFixed(2)),
    };
  });

  let subtotal = normalizeNumber(payload.subtotal, 0);
  const computedSubtotal = normalizedItems.reduce((sum: number, item: any) => sum + item.line_total, 0);

  if (payload.subtotal !== undefined && Math.abs(subtotal - computedSubtotal) > 0.01) {
    return jsonResponse(400, { error: "subtotal does not match items total" }, requestOrigin);
  }

  subtotal = Number(computedSubtotal.toFixed(2));

  const shippingFee = normalizeNumber(payload.shipping_fee, 0);
  const total = normalizeNumber(payload.total, subtotal + shippingFee);

  if (Math.abs(total - (subtotal + shippingFee)) > 0.01) {
    return jsonResponse(400, { error: "total does not match subtotal + shipping_fee" }, requestOrigin);
  }

  const order = {
    customer_name: String(payload.customer_name ?? "Guest").trim() || "Guest",
    customer_email: String(payload.customer_email ?? "").trim(),
    customer_phone: String(payload.customer_phone ?? "").trim(),
    shipping_address: payload.shipping_address && typeof payload.shipping_address === "object" ? payload.shipping_address : {},
    items: normalizedItems,
    subtotal: Number(subtotal.toFixed(2)),
    shipping_fee: Number(shippingFee.toFixed(2)),
    total: Number(total.toFixed(2)),
    payment_method: String(payload.payment_method ?? "cod").trim() || "cod",
    payment_status: "pending",
    status: "new",
  };

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SECRET_KEY");

  if (!supabaseUrl || !serviceKey) {
    return jsonResponse(500, { error: "Supabase function environment variables are missing" }, requestOrigin);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  try {
    const { data, error } = await supabase.from("orders").insert([order]).select().single();

    if (error) {
      console.error("Insert order error:", error);
      return jsonResponse(500, { error: error.message || "Failed to create order" }, requestOrigin);
    }

    return jsonResponse(200, { order: data }, requestOrigin);
  } catch (error) {
    console.error("Server error:", error);
    return jsonResponse(500, { error: "Server error" }, requestOrigin);
  }
});

