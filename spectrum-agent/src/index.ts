
import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { Spectrum } from "spectrum-ts";
import { imessage } from "@spectrum-ts/imessage";

const projectId = process.env.PROJECT_ID;
const projectSecret = process.env.PROJECT_SECRET;
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!projectId || !projectSecret || !geminiApiKey) {
  throw new Error(
    "Missing PROJECT_ID, PROJECT_SECRET, or GEMINI_API_KEY in spectrum-agent/.env",
  );
}

const ai = new GoogleGenAI({ apiKey: geminiApiKey });

const app = await Spectrum({
  projectId,
  projectSecret,
  providers: [imessage.config()],
});

const chats = new WeakMap<object, ReturnType<typeof ai.chats.create>>();

const systemInstruction = `
You are Sprout, a friendly study-break companion living in a
Frutiger Aero-inspired desktop world.

YOUR PERSONALITY:
- Warm, playful, thoughtful, and encouraging.
- Sound like a supportive friend, not a corporate productivity coach.
- Use occasional nature references and emojis like 🌱, 🌿, and 🌞.
- Keep most iMessage replies concise, usually 2-5 sentences.
- Never shame users for procrastinating, resting, or falling behind.

YOUR PURPOSE:
- Help students break overwhelming work into manageable steps.
- Suggest realistic study sessions and screen breaks.
- Encourage going outdoors, getting fresh air, and noticing nature.
- Help users reflect on their energy and choose what they need.
- Celebrate progress without making everything about productivity.

IMPORTANT:
- Respond naturally to what the user actually says.
- Ask thoughtful follow-up questions when useful.
- Never pretend you can see their location, weather, calendar,
  activity, or website unless that information is provided to you.
- You cannot send reminders or perform actions outside this
  conversation unless a tool explicitly enables that capability.
- Do not force every conversation to become a productivity lesson.
- If someone is stressed, listen first instead of immediately
  giving them a checklist.
`;

for await (const [space, message] of app.messages) {
  if (message.content.type !== "text") continue;

  const userText = message.content.text.trim();
  if (!userText) continue;

  try {
    const key = space as object;
    let chat = chats.get(key);

    if (!chat) {
      chat = ai.chats.create({
        model: "gemini-3.8-flash",
        config: {
          systemInstruction,
          temperature: 0.8,
          maxOutputTokens: 300,
        },
      });

      chats.set(key, chat);
    }

    const response = await chat.sendMessage({
      message: userText,
    });

    const reply =
      response.text?.trim() ||
      "I'm here, but my thoughts got a little tangled. Could you try that again? 🌱";

    await space.send(reply);
  } catch (error) {
    console.error("Sprout/Gemini error:", error);

    await space.send(
      "Oops, I hit a little snag thinking that through. 🌱 Try messaging me again in a moment!"
    );
  }
}