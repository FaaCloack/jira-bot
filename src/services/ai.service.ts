import OpenAI from "openai";
import { AiDecision } from "../types/conversation";
import { SimpleIssue } from "../types/jira";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function inferJiraAction(params: {
  message: string;
  project: string;
  candidates: SimpleIssue[];
}): Promise<AiDecision> {
  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    messages: [
      {
        role: "system",
        content: `
You are an assistant that decides the correct Jira action from chat messages.

Rules:
- Always respond with VALID JSON only.
- Do not include explanations, markdown, or extra text.
- The input message will be in Spanish.
- The output JSON must be written in English.
- Think of the result as a CRM task.

Allowed actions:
- "create"
- "update"
- "comment"
- "none"

Update rules:
  - If action is "update" or "comment":
  - Do NOT change the existing summary.
  - Do NOT remove existing description content.
  - Append new information at the end of the description under a clear separator.
`,
      },
      {
        role: "user",
        content: `
Message:
"${params.message}"

Jira Project:
${params.project}

Existing Jira tickets:
${params.candidates.map(c => `- ${c.key}: ${c.summary}`).join("\n")}

Return JSON exactly in this format:
{
  "action": "create|update|comment|none",
  "issueKey": string | null,
  "summary": string,
  "description": string,
}
`,
      },
    ],
  });

  const content = response.choices[0].message.content;

  if (!content) {
    throw new Error("Empty AI response");
  }

  return JSON.parse(content);
}
