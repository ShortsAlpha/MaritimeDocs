'use server'

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createDocumentType(formData: FormData) {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const isRequired = formData.get("isRequired") === "on";
    const category = formData.get("category") as "OFFICE" | "STUDENT";

    if (!title) {
        throw new Error("Title is required");
    }

    await db.documentType.create({
        data: {
            title,
            description,
            isRequired,
            category: category || "STUDENT"
        },
    });

    revalidatePath("/admin/settings");
}

export async function deleteDocumentType(id: string) {
    await db.documentType.delete({
        where: { id },
    });

    revalidatePath("/admin/settings");
}
