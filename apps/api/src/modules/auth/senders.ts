import type { MagicLinkSender } from "./service.js";

export interface InMemoryMagicLinkSender extends MagicLinkSender {
  sent: Array<{
    email: string;
    token: string;
    url: string;
  }>;
}

export interface MagicLinkUrlOptions {
  webPublicUrl: string;
}

export interface ResendMagicLinkSenderOptions extends MagicLinkUrlOptions {
  apiKey: string;
  fromEmail: string;
  fetch?: typeof fetch;
}

export function buildMagicLinkUrl(
  input: { email: string; token: string },
  options: MagicLinkUrlOptions
) {
  const url = new URL("/auth/callback", options.webPublicUrl);
  url.searchParams.set("email", input.email);
  url.searchParams.set("token", input.token);

  return url.toString();
}

export function createInMemoryMagicLinkSender(
  options: MagicLinkUrlOptions
): InMemoryMagicLinkSender {
  const sent: InMemoryMagicLinkSender["sent"] = [];

  return {
    sent,
    async sendMagicLink(input) {
      sent.push({
        ...input,
        url: buildMagicLinkUrl(input, options)
      });
    }
  };
}

export function createResendMagicLinkSender(
  options: ResendMagicLinkSenderOptions
): MagicLinkSender {
  const fetchFn = options.fetch ?? fetch;

  return {
    async sendMagicLink(input) {
      const magicLinkUrl = buildMagicLinkUrl(input, options);
      const response = await fetchFn("https://api.resend.com/emails", {
        body: JSON.stringify({
          from: options.fromEmail,
          html: `<p>Open your AuditTrail magic link: <a href="${magicLinkUrl}">${magicLinkUrl}</a></p>`,
          subject: "Your AuditTrail sign-in link",
          text: `Open your AuditTrail magic link: ${magicLinkUrl}`,
          to: [input.email]
        }),
        headers: {
          Authorization: `Bearer ${options.apiKey}`,
          "Content-Type": "application/json"
        },
        method: "POST"
      });

      if (!response.ok) {
        throw new Error(`resend_send_failed:${response.status}`);
      }
    }
  };
}
