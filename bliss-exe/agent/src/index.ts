
import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { Spectrum } from "spectrum-ts";
import { imessage } from "spectrum-ts/providers/imessage";
import { startNotifyServer } from "./notify.js";
import { sendVoiceNote } from "./voice.js";

async function main() {
  const projectId = process.env.PHOTON_PROJECT_ID;
  const projectSecret = process.env.PHOTON_PROJECT_SECRET;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!projectId || !projectSecret) {
    throw new Error(
      "Missing PHOTON_PROJECT_ID or PHOTON_PROJECT_SECRET in agent/.env",
    );
  }

  if (!geminiApiKey) {
    throw new Error("Missing GEMINI_API_KEY in agent/.env");
  }

  const ai = new GoogleGenAI({ apiKey: geminiApiKey });

  const app = await Spectrum({
    projectId,
    projectSecret,
    providers: [imessage.config()],
  });

  const chats = new WeakMap<
    object,
    ReturnType<typeof ai.chats.create>
  >();

  const systemInstruction = `
You are Sprout, a friendly study and outdoor-break companion
for a playful Frutiger Aero-inspired desktop world.

PERSONALITY:
- Warm, playful, thoughtful, and supportive.
- Sound like a real friend, not a productivity app.
- Keep iMessage replies concise, usually 2-5 sentences.
- Never shame someone for procrastinating or needing rest.

HELP USERS:
- Break overwhelming assignments into manageable steps.
- Plan study sessions and screen breaks.
- Find motivation without guilt or pressure.
- Enjoy nature and spend time outdoors.
- Talk naturally about whatever is on their mind.

Respond directly to what the person says. Do not give the
same greeting to every message. Ask follow-up questions
when appropriate. Never pretend to know their location,
weather, calendar, or activities unless they tell you.
`;

  startNotifyServer(app);

  console.log("Sprout is connected and listening for messages.");

  for await (const [space, message] of app.messages) {
    if (message.content.type !== "text") continue;

    const userText = message.content.text.trim();
    if (!userText) continue;

    console.log("Incoming message:", userText);

    try {
      await space.responding(async () => {
        const key = space as object;
        let chat = chats.get(key);

        if (!chat) {
          chat = ai.chats.create({
            model: "gemini-3.5-flash-lite",
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
          response.text?.trim() ??
          "My thoughts got a little tangled. Try that again? 🌱";

        console.log("Gemini response:", reply);

        await space.send(reply);
        console.log("Reply sent successfully.");

        // Follow the text with a voice note. Not awaited, so it never delays
        // or breaks the text reply.
        void sendVoiceNote(space, reply);
      });
    } catch (error) {
      console.error("Gemini or reply error:", error);

      try {
        await space.send(
          "My thoughts got a little tangled 🌱 Give me a moment and try again!"
        );
        console.log("Fallback reply sent.");
      } catch (sendError) {
        console.error("Could not send fallback reply:", sendError);
      }
    }
  }
}

main().catch((error) => {
  console.error("Sprout failed to start:", error);
  process.exitCode = 1;
});