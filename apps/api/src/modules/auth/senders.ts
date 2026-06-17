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
