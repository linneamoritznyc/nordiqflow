import { NextRequest, NextResponse } from "next/server";
import { readAllRows, readRowsForMonth } from "@/lib/sheets";

export async function GET(request: NextRequest) {
  try {
    const month = request.nextUrl.searchParams.get("month");

    const rows = month ? await readRowsForMonth(month) : await readAllRows();

    return NextResponse.json({ rows });
  } catch (error) {
    console.error("Failed to read sheet:", error);
    return NextResponse.json(
      { error: "Failed to read spreadsheet" },
      { status: 500 }
    );
  }
}
