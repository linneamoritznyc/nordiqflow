import { NextResponse } from "next/server";
import { parseCV } from "@/lib/claude";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let cvText: string;

    if (contentType.includes("application/json")) {
      const body = await request.json();
      cvText = body.text;
    } else if (contentType.includes("multipart/form-data")) {
      // Handle file upload — extract text from PDF
      // TODO: Add pdf-parse for PDF text extraction
      return NextResponse.json(
        { error: "PDF upload not yet implemented. Please paste text instead." },
        { status: 501 }
      );
    } else {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400 }
      );
    }

    if (!cvText || cvText.trim().length < 50) {
      return NextResponse.json(
        { error: "CV text is too short. Please provide more content." },
        { status: 400 }
      );
    }

    const result = await parseCV(cvText);
    return NextResponse.json(result);
  } catch (error) {
    console.error("CV parse error:", error);
    return NextResponse.json(
      { error: "Failed to parse CV. Please try again." },
      { status: 500 }
    );
  }
}
