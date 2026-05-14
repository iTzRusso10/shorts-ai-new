import { NextRequest, NextResponse } from "next/server";

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

type Params = {
  params: Promise<{ jobId: string }>;
};

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { jobId } = await params;
    const response = await fetch(`${FASTAPI_URL}/status/${jobId}`, { cache: "no-store" });
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "FastAPI non raggiungibile." },
      { status: 500 },
    );
  }
}
