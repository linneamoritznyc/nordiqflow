import { NextRequest, NextResponse } from "next/server";
import {
  readMeetingNotes,
  addMeetingNote,
  updateMeetingNote,
} from "@/lib/sheets";

export async function GET() {
  try {
    const notes = await readMeetingNotes();
    return NextResponse.json({ notes });
  } catch (error) {
    console.error("Failed to read meeting notes:", error);
    return NextResponse.json(
      { error: "Failed to read meeting notes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rowIndex, date, contact, organization, type, notes, followUp, status } = body;

    if (rowIndex) {
      // Update existing note
      await updateMeetingNote(rowIndex, {
        date,
        contact,
        organization,
        type,
        notes,
        followUp,
        status,
      });
    } else {
      // Add new note
      await addMeetingNote({
        date,
        contact,
        organization,
        type,
        notes,
        followUp,
        status,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save meeting note:", error);
    return NextResponse.json(
      { error: "Failed to save meeting note" },
      { status: 500 }
    );
  }
}
