'use client'

import { createDocumentType } from "@/app/actions/document-type";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useFormStatus } from "react-dom";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Adding..." : "Add Document Type"}
        </Button>
    );
}

export function CreateDocTypeForm() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Add New Document Type</CardTitle>
                <CardDescription>Define a new document that students need to upload.</CardDescription>
            </CardHeader>
            <form action={createDocumentType}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" name="title" placeholder="e.g. Passport" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea id="description" name="description" placeholder="Instructions for the student..." />
                    </div>
                    <div className="flex items-center space-x-2">
                        <input type="checkbox" id="isRequired" name="isRequired" className="h-4 w-4 rounded border-gray-300" />
                        <Label htmlFor="isRequired">Is Required?</Label>
                    </div>
                </CardContent>
                <CardFooter>
                    <SubmitButton />
                </CardFooter>
            </form>
        </Card>
    );
}
