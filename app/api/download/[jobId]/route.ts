import { NextRequest, NextResponse } from "next/server";

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

type Params = {
  params: Promise<{ jobId: string }>;
};

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { jobId } = await params;
    const response = await fetch(`${FASTAPI_URL}/download/${jobId}`, { cache: "no-store" });

    if (!response.ok || !response.body) {
      const data = await response.json().catch(() => ({ error: "Download non disponibile." }));
      return NextResponse.json(data, { status: response.status });
    }

    return new NextResponse(response.body, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "video/mp4",
        "Content-Disposition": response.headers.get("Content-Disposition") || `attachment; filename="${jobId}.mp4"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "FastAPI non raggiungibile." },
      { status: 500 },
    );
  }
}
