const GA4_MEASUREMENT_ID = process.env.GA4_MEASUREMENT_ID;
const GA4_API_SECRET = process.env.GA4_API_SECRET;

export async function sendGaPurchase({
  clientId,
  orderId,
  value,
  currency,
  item,
}) {
  if (!GA4_MEASUREMENT_ID || !GA4_API_SECRET) {
    console.warn("[GA4] Missing GA4_MEASUREMENT_ID or GA4_API_SECRET");
    return;
  }

  if (!clientId) {
    console.warn("[GA4] Missing clientId, purchase event skipped");
    return;
  }

  const url =
    `https://region1.google-analytics.com/mp/collect` +
    `?measurement_id=${encodeURIComponent(GA4_MEASUREMENT_ID)}` +
    `&api_secret=${encodeURIComponent(GA4_API_SECRET)}`;

  const body = {
    client_id: clientId,
    events: [
      {
        name: "purchase",
        params: {
          transaction_id: orderId,
          value,
          currency,
          items: [item],
        },
      },
    ],
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`[GA4] Request failed: ${response.status} ${text}`);
  }
}