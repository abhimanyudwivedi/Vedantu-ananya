// G.711 mu-law codec + resampling utilities

// Decode a buffer of mu-law bytes → Int16Array (PCM samples)
export function mulawToLinear(mulawBuffer: Buffer): Int16Array {
  const out = new Int16Array(mulawBuffer.length);
  for (let i = 0; i < mulawBuffer.length; i++) {
    let b = ~mulawBuffer[i] & 0xff;
    const sign = b & 0x80 ? -1 : 1;
    const exponent = (b >> 4) & 0x07;
    const mantissa = b & 0x0f;
    let sample = ((0x21 + (mantissa << 1)) << exponent) - 0x84;
    out[i] = sign * sample;
  }
  return out;
}

// Encode Int16Array PCM samples → Buffer of mu-law bytes
export function linearToMulaw(samples: Int16Array): Buffer {
  const out = Buffer.alloc(samples.length);
  for (let i = 0; i < samples.length; i++) {
    let s = samples[i];
    const sign = s < 0 ? 0x80 : 0;
    if (s < 0) s = -s;
    if (s > 32635) s = 32635;
    s += 0x84;
    let exp = 7;
    for (let mask = 0x4000; (s & mask) === 0 && exp > 0; exp--, mask >>= 1) {}
    const mantissa = (s >> (exp + 3)) & 0x0f;
    out[i] = (~(sign | (exp << 4) | mantissa)) & 0xff;
  }
  return out;
}

// Upsample 8 kHz → 16 kHz (linear interpolation — good enough for speech)
export function upsample8to16(samples: Int16Array): Int16Array {
  const out = new Int16Array(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    out[i * 2] = samples[i];
    out[i * 2 + 1] = i < samples.length - 1
      ? Math.round((samples[i] + samples[i + 1]) / 2)
      : samples[i];
  }
  return out;
}

// Downsample 24 kHz → 8 kHz (simple decimation — good enough for phone audio)
export function downsample24to8(samples: Int16Array): Int16Array {
  // 24000 / 8000 = 3 → take every 3rd sample
  const outLen = Math.floor(samples.length / 3);
  const out = new Int16Array(outLen);
  for (let i = 0; i < outLen; i++) {
    out[i] = samples[i * 3];
  }
  return out;
}

// Convert Int16Array to base64 (little-endian PCM, for Gemini)
export function pcmToBase64(samples: Int16Array): string {
  const buf = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    buf.writeInt16LE(samples[i], i * 2);
  }
  return buf.toString("base64");
}

// Convert base64 PCM from Gemini back to Int16Array
export function base64ToPcm(b64: string): Int16Array {
  const buf = Buffer.from(b64, "base64");
  const samples = new Int16Array(buf.length / 2);
  for (let i = 0; i < samples.length; i++) {
    samples[i] = buf.readInt16LE(i * 2);
  }
  return samples;
}
