import { NextResponse } from "next/server";
import { backfillStudentNumbers } from "@/app/actions/students";

export async function GET() {
    try {
        const result = await backfillStudentNumbers();
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
