export async function initiateCall(toNumber: string, answerUrl: string) {
  const authId = process.env.VOBIZ_AUTH_ID!;
  const authToken = process.env.VOBIZ_AUTH_TOKEN!;
  const from = process.env.VOBIZ_FROM_NUMBER!;

  const res = await fetch(`https://api.vobiz.ai/api/v1/Account/${authId}/Call/`, {
    method: "POST",
    headers: {
      "X-Auth-ID": authId,
      "X-Auth-Token": authToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: toNumber, answer_url: answerUrl }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`vobiz call failed: ${res.status} ${text}`);
  }

  return res.json();
}
