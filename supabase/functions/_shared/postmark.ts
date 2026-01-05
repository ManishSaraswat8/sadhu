/**
 * Postmark Email Utility
 * Shared utility for sending emails via Postmark API
 */

interface PostmarkEmailOptions {
  to: string;
  templateId?: number;
  templateAlias?: string;
  templateModel?: Record<string, any>;
  from?: string;
  subject?: string;
  htmlBody?: string;
  textBody?: string;
  tag?: string;
  metadata?: Record<string, string>;
}

interface PostmarkResponse {
  To: string;
  SubmittedAt: string;
  MessageID: string;
  ErrorCode: number;
  Message: string;
}

const POSTMARK_API_KEY = Deno.env.get("POSTMARK_API_KEY");
const POSTMARK_FROM_EMAIL = Deno.env.get("POSTMARK_FROM_EMAIL") || "noreply@sadhu.com";
const POSTMARK_SERVER_TOKEN = Deno.env.get("POSTMARK_SERVER_TOKEN") || POSTMARK_API_KEY;

const POSTMARK_API_URL = "https://api.postmarkapp.com";

/**
 * Send an email via Postmark
 */
export async function sendPostmarkEmail(
  options: PostmarkEmailOptions
): Promise<PostmarkResponse> {
  if (!POSTMARK_SERVER_TOKEN) {
    throw new Error("POSTMARK_SERVER_TOKEN or POSTMARK_API_KEY environment variable is not set");
  }

  const {
    to,
    templateId,
    templateAlias,
    templateModel,
    from = POSTMARK_FROM_EMAIL,
    subject,
    htmlBody,
    textBody,
    tag,
    metadata,
  } = options;

  // Validate required fields
  if (!to) {
    throw new Error("Recipient email address is required");
  }

  // If using a template, use template endpoint
  if (templateId || templateAlias) {
    const templatePayload: any = {
      From: from,
      To: to,
    };

    if (templateId) {
      templatePayload.TemplateId = templateId;
    } else if (templateAlias) {
      templatePayload.TemplateAlias = templateAlias;
    }

    if (templateModel) {
      templatePayload.TemplateModel = templateModel;
    }

    if (tag) {
      templatePayload.Tag = tag;
    }

    if (metadata) {
      templatePayload.Metadata = metadata;
    }

    const response = await fetch(`${POSTMARK_API_URL}/email/withTemplate`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": POSTMARK_SERVER_TOKEN,
      },
      body: JSON.stringify(templatePayload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Postmark API error: ${error.Message || response.statusText}`);
    }

    return await response.json();
  }

  // Otherwise, use standard email endpoint
  if (!subject || (!htmlBody && !textBody)) {
    throw new Error("Subject and either htmlBody or textBody are required when not using a template");
  }

  const emailPayload: any = {
    From: from,
    To: to,
    Subject: subject,
  };

  if (htmlBody) {
    emailPayload.HtmlBody = htmlBody;
  }

  if (textBody) {
    emailPayload.TextBody = textBody;
  }

  if (tag) {
    emailPayload.Tag = tag;
  }

  if (metadata) {
    emailPayload.Metadata = metadata;
  }

  const response = await fetch(`${POSTMARK_API_URL}/email`, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": POSTMARK_SERVER_TOKEN,
    },
    body: JSON.stringify(emailPayload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Postmark API error: ${error.Message || response.statusText}`);
  }

  return await response.json();
}

/**
 * Send a batch of emails via Postmark
 */
export async function sendPostmarkBatch(
  emails: PostmarkEmailOptions[]
): Promise<PostmarkResponse[]> {
  if (!POSTMARK_SERVER_TOKEN) {
    throw new Error("POSTMARK_SERVER_TOKEN or POSTMARK_API_KEY environment variable is not set");
  }

  const messages = emails.map((email) => {
    const {
      to,
      templateId,
      templateAlias,
      templateModel,
      from = POSTMARK_FROM_EMAIL,
      subject,
      htmlBody,
      textBody,
      tag,
      metadata,
    } = email;

    if (templateId || templateAlias) {
      const message: any = {
        From: from,
        To: to,
      };

      if (templateId) {
        message.TemplateId = templateId;
      } else if (templateAlias) {
        message.TemplateAlias = templateAlias;
      }

      if (templateModel) {
        message.TemplateModel = templateModel;
      }

      if (tag) {
        message.Tag = tag;
      }

      if (metadata) {
        message.Metadata = metadata;
      }

      return message;
    }

    const message: any = {
      From: from,
      To: to,
      Subject: subject,
    };

    if (htmlBody) {
      message.HtmlBody = htmlBody;
    }

    if (textBody) {
      message.TextBody = textBody;
    }

    if (tag) {
      message.Tag = tag;
    }

    if (metadata) {
      message.Metadata = metadata;
    }

    return message;
  });

  const response = await fetch(`${POSTMARK_API_URL}/email/batch`, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": POSTMARK_SERVER_TOKEN,
    },
    body: JSON.stringify({ Messages: messages }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Postmark API error: ${error.Message || response.statusText}`);
  }

  const result = await response.json();
  return result;
}

