const API_BASE = import.meta.env.PUBLIC_API_URL || "http://localhost:3001";

export async function submitWaitlistSignup(data: {
  email: string;
  referredBy?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}): Promise<{ queuePosition: number; referralCode: string; alreadySignedUp?: boolean }> {
  const res = await fetch(`${API_BASE}/public/waitlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Signup failed" }));
    throw new Error(err.error || "Signup failed");
  }

  return res.json();
}

export async function getWaitlistCount(): Promise<number> {
  const res = await fetch(`${API_BASE}/public/waitlist/count`);
  if (!res.ok) return 0;
  const data = await res.json();
  return data.count ?? 0;
}

export async function submitSurveyResponses(
  referralCode: string,
  responses: Record<string, string | string[]>,
): Promise<void> {
  const res = await fetch(`${API_BASE}/public/waitlist/${referralCode}/survey`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ responses }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed to submit survey" }));
    throw new Error(err.error || "Failed to submit survey");
  }
}
