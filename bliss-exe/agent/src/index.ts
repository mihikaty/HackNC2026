import "dotenv/config";

import { Spectrum } from "spectrum-ts";
import { imessage } from "spectrum-ts/providers/imessage";

async function main() {
  const projectId = process.env.PHOTON_PROJECT_ID;
  const projectSecret = process.env.PHOTON_PROJECT_SECRET;

  if (!projectId || !projectSecret) {
    throw new Error(
      "Missing PHOTON_PROJECT_ID or PHOTON_PROJECT_SECRET in agent/.env",
    );
  }

  const app = await Spectrum({
    projectId,
    projectSecret,
    providers: [imessage.config()],
  });

  console.log("Sprout is connected and listening for messages.");

  for await (const [space, message] of app.messages) {
    try {
      await space.responding(async () => {
        await message.reply(
          "Hey! I'm Sprout, your study and outdoor-break companion. 🌱",
        );
      });
    } catch (error) {
      console.error("Failed to reply to an incoming message:", error);
    }
  }
}

main().catch((error) => {
  console.error("Sprout failed to start:", error);
  process.exitCode = 1;
});
