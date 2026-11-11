import { NextResponse } from "next/server";

const MAX_BODY_BYTES = 16 * 1024;

export function jsonError(code: string, status: number, fields?: Record<string, string>) {
  return NextResponse.json({ error: code, ...(fields ? { fields } : {}) }, { status });
}

/** Parses a JSON body. Returns undefined when it is too large or isn't JSON. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    const text = await request.text();
    if (Buffer.byteLength(text) > MAX_BODY_BYTES) return undefined;
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
