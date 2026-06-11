type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<boolean> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim() ?? "EventPlanner <onboarding@resend.dev>";

  if (!key) {
    console.warn("[email] RESEND_API_KEY not set — skipping send to", to);
    return false;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[email] send failed:", err);
    return false;
  }

  return true;
}
