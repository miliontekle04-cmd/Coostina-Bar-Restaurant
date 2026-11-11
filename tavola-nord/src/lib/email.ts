type Email = { to: string; subject: string; text: string; replyTo?: string };

/**
 * Sends through Resend when a key is configured. A failed email never fails the booking:
 * the record is already saved and staff can see it in the admin panel.
 */
export async function sendEmail(email: Email): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) {
    console.info(`[email] Skipped "${email.subject}" because RESEND_API_KEY or EMAIL_FROM is not set.`);
    return;
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        // Several addresses can be given with commas, such as EMAIL_TO_RESTAURANT="a@x.no,b@y.no".
        to: email.to.split(",").map((address) => address.trim()).filter(Boolean),
        subject: email.subject,
        text: email.text,
        // Guests who reply to their confirmation reach the restaurant inbox.
        reply_to: email.replyTo ?? restaurantInbox()?.split(",").map((address) => address.trim()).filter(Boolean),
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) console.error(`[email] Resend returned ${response.status} for "${email.subject}".`);
  } catch (error) {
    console.error(`[email] Could not send "${email.subject}".`, error);
  }
}

export function restaurantInbox(): string | null {
  return process.env.EMAIL_TO_RESTAURANT ?? null;
}
