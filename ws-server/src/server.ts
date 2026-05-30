import "dotenv/config";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI, Modality, type LiveServerMessage } from "@google/genai";
import { GoogleAuth } from "google-auth-library";
import { IncomingMessage } from "http";
import {
  mulawToLinear,
  linearToMulaw,
  upsample8to16,
  downsample24to8,
  pcmToBase64,
  base64ToPcm,
} from "./audio";
import { STUDENTS, buildSystemPrompt } from "./prompt";

const PORT = parseInt(process.env.PORT ?? "8080");
const PROJECT = process.env.GOOGLE_CLOUD_PROJECT!;
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION ?? "us-central1";
const MODEL = "gemini-2.0-flash-live-001";

// Build GoogleGenAI client — supports service account JSON or ADC
function buildAI(): GoogleGenAI {
  const credsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (credsJson) {
    const credentials = JSON.parse(credsJson);
    return new GoogleGenAI({
      vertexai: true,
      project: PROJECT,
      location: LOCATION,
      googleAuthOptions: { credentials, scopes: ["https://www.googleapis.com/auth/cloud-platform"] },
    });
  }
  // Fallback: ADC (gcloud auth application-default login)
  return new GoogleGenAI({ vertexai: true, project: PROJECT, location: LOCATION });
}

const ai = buildAI();

// ── WebSocket server ──────────────────────────────────────────────────────────

const wss = new WebSocketServer({ port: PORT });
console.log(`[ws-server] Listening on ws://localhost:${PORT}`);

wss.on("connection", (vobizWs: WebSocket, req: IncomingMessage) => {
  // Extract studentId from query string: ?studentId=arjun
  const url = new URL(req.url ?? "/", `http://localhost`);
  // Support both ?studentId=X and /stream/X path
  const pathMatch = url.pathname.match(/\/stream\/([^/]+)/);
  const studentId = pathMatch?.[1] ?? url.searchParams.get("studentId") ?? "arjun";
  const student = STUDENTS.find((s) => s.id === studentId) ?? STUDENTS[0];

  console.log(`[ws-server] New call — student: ${student.studentName}, parent: ${student.parentName}`);
  // Open Gemini immediately — don't wait for "connected" event
  openGemini();

  let streamSid = "";
  let geminiSession: Awaited<ReturnType<typeof ai.live.connect>> | null = null;
  let geminiReady = false;
  // Buffer incoming audio until Gemini session is ready
  const audioQueue: Buffer[] = [];

  // ── Open Gemini Live session ────────────────────────────────────────────────
  async function openGemini() {
    try {
      geminiSession = await ai.live.connect({
        model: MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: { parts: [{ text: buildSystemPrompt(student) }] },
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
          },
        },
        callbacks: {
          onopen: () => {
            console.log("[gemini] Session open");
            geminiReady = true;
            // Flush any buffered audio
            for (const chunk of audioQueue) sendToGemini(chunk);
            audioQueue.length = 0;

            // Kick off the call — Ananya opens the conversation
            const openingText = `Namaste ${student.parentName} ji! Main Vedantu se Ananya bol rahi hoon. ${student.studentName} ke baare mein kuch update share karna tha — kya aap thodi der baat kar sakte hain?`;
            geminiSession!.sendClientContent({
              turns: [{ role: "user", parts: [{ text: `[System: The call just connected. Open the conversation warmly as Ananya. First line: "${openingText}"]` }] }],
              turnComplete: true,
            });
          },

          onmessage: (message: LiveServerMessage) => {
            // Extract audio chunks from Gemini response
            const parts = message.serverContent?.modelTurn?.parts;
            if (parts) {
              for (const part of parts) {
                if (part.inlineData?.data) {
                  sendAudioToVobiz(part.inlineData.data);
                }
              }
            }
          },

          onerror: (e: unknown) => console.error("[gemini] Error:", e),
          onclose: () => console.log("[gemini] Session closed"),
        },
      });
    } catch (err) {
      console.error("[gemini] Failed to open session:", err);
    }
  }

  // Send PCM audio from Gemini back to vobiz as mu-law
  function sendAudioToVobiz(base64Pcm24k: string) {
    if (!streamSid || vobizWs.readyState !== WebSocket.OPEN) return;
    try {
      const pcm24k = base64ToPcm(base64Pcm24k);
      const pcm8k = downsample24to8(pcm24k);
      const mulaw = linearToMulaw(pcm8k);
      const payload = mulaw.toString("base64");
      vobizWs.send(JSON.stringify({
        event: "media",
        streamSid,
        media: { payload },
      }));
    } catch (err) {
      console.error("[audio] Error sending to vobiz:", err);
    }
  }

  // Send mu-law audio from vobiz to Gemini as 16kHz PCM
  function sendToGemini(mulawBuf: Buffer) {
    if (!geminiSession || !geminiReady) {
      audioQueue.push(mulawBuf);
      return;
    }
    try {
      const pcm8k = mulawToLinear(mulawBuf);
      const pcm16k = upsample8to16(pcm8k);
      const b64 = pcmToBase64(pcm16k);
      geminiSession.sendRealtimeInput({
        audio: { data: b64, mimeType: "audio/pcm;rate=16000" },
      });
    } catch (err) {
      console.error("[audio] Error sending to Gemini:", err);
    }
  }

  // ── Handle vobiz messages ───────────────────────────────────────────────────
  vobizWs.on("message", (raw: Buffer) => {
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      console.log("[vobiz] non-JSON message:", raw.toString().slice(0, 200));
      return;
    }

    // Debug: log every event type seen
    if (msg.event && msg.event !== "media") console.log("[vobiz] event:", msg.event, JSON.stringify(msg).slice(0, 300));

    switch (msg.event) {
      case "connected":
        console.log("[vobiz] Connected — opening Gemini session");
        openGemini();
        break;

      case "start":
        streamSid = (msg.start as Record<string, string>)?.streamSid ?? "";
        console.log(`[vobiz] Stream started — SID: ${streamSid}`);
        break;

      case "media": {
        const payload = (msg.media as Record<string, string>)?.payload;
        if (payload) {
          const mulawBuf = Buffer.from(payload, "base64");
          sendToGemini(mulawBuf);
        }
        break;
      }

      case "stop":
        console.log("[vobiz] Stream stopped");
        geminiSession?.close();
        break;
    }
  });

  vobizWs.on("close", () => {
    console.log("[vobiz] WebSocket closed");
    geminiSession?.close();
  });

  vobizWs.on("error", (err) => console.error("[vobiz] WS error:", err));
});
