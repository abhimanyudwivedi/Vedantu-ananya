import { NextRequest } from "next/server";
import textToSpeech from "@google-cloud/text-to-speech";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

function getTtsClient() {
  const credsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (credsJson) {
    return new textToSpeech.TextToSpeechClient({ credentials: JSON.parse(credsJson) });
  }
  return new textToSpeech.TextToSpeechClient();
}

export async function GET(req: NextRequest) {
  const text = new URL(req.url).searchParams.get("text") ?? "Namaste";
  try {
    const client = getTtsClient();
    const [response] = await client.synthesizeSpeech({
      input: { text },
      voice: { languageCode: "hi-IN", name: "hi-IN-Neural2-A", ssmlGender: "FEMALE" },
      audioConfig: { audioEncoding: "MP3", speakingRate: 0.95, pitch: 0.5 },
    });
    const audio = response.audioContent;
    if (!audio) return new Response("No audio", { status: 500 });
    const bytes = typeof audio === "string" ? Buffer.from(audio, "base64") : Buffer.from(audio);
    return new Response(new Uint8Array(bytes), {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=3600" },
    });
  } catch (err) {
    return new Response(`TTS error: ${(err as Error).message}`, { status: 500 });
  }
}
