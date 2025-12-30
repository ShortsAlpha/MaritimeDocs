'use client'

import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { reviewDocument } from "@/app/actions/document-review";
import { format } from "date-fns";

export function ReviewCard({ doc }: { doc: any }) {
    const [rejecting, setRejecting] = useState(false);
    const [reason, setReason] = useState("");

    const handleApprove = async () => {
        await reviewDocument(doc.id, "APPROVED");
    };

    const handleReject = async () => {
        if (!reason) return alert("Please provide a reason.");
        await reviewDocument(doc.id, "REJECTED", reason);
        setRejecting(false);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">{doc.documentType.title}</CardTitle>
                <div className="text-sm text-muted-foreground">Student: {doc.user.name || doc.user.email}</div>
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="text-xs text-muted-foreground">
                    Uploaded: {format(new Date(doc.createdAt), "PP p")}
                </div>
                {doc.expiryDate && (
                    <div className="text-xs font-semibold text-amber-600">
                        Expires: {format(new Date(doc.expiryDate), "PP")}
                    </div>
                )}
                <div className="mt-2">
                    <a href={doc.fileUrl} target="_blank" className="text-blue-500 hover:underline text-sm font-medium">
                        View Document
                    </a>
                </div>

                {rejecting && (
                    <div className="mt-4 space-y-2">
                        <Input
                            placeholder="Reason for rejection..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="text-sm"
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setRejecting(false)}>Cancel</Button>
                            <Button variant="destructive" size="sm" onClick={handleReject}>Confirm Reject</Button>
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter className="justify-end gap-2">
                {!rejecting && (
                    <>
                        <Button variant="outline" size="sm" onClick={() => setRejecting(true)}>Reject</Button>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={handleApprove}>Approve</Button>
                    </>
                )}
            </CardFooter>
        </Card>
    );
}
