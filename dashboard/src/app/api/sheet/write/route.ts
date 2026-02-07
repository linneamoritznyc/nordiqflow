import { NextRequest, NextResponse } from "next/server";
import { updateRow } from "@/lib/sheets";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rowIndex, event, gamePlan, fundingDeadline, fundingEligibility } =
      body;

    if (!rowIndex || typeof rowIndex !== "number") {
      return NextResponse.json(
        { error: "rowIndex is required and must be a number" },
        { status: 400 }
      );
    }

    await updateRow(rowIndex, {
      event,
      gamePlan,
      fundingDeadline,
      fundingEligibility,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to write to sheet:", error);
    return NextResponse.json(
      { error: "Failed to update spreadsheet" },
      { status: 500 }
    );
  }
}
