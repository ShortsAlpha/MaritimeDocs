import { db } from "@/lib/db";
import { CreateDocTypeForm } from "@/components/admin/create-doc-type-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteDocumentType } from "@/app/actions/document-type";
import { Button } from "@/components/ui/button";

export default async function AdminSettingsPage() {
    const docTypes = await db.documentType.findMany({
        orderBy: { title: 'asc' }
    });

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <div>
                <h2 className="text-2xl font-bold tracking-tight mb-4">Document Types</h2>
                <Card>
                    <CardHeader>
                        <CardTitle>Existing Types</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Required</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {docTypes.map((type: any) => (
                                    <TableRow key={type.id}>
                                        <TableCell className="font-medium">{type.title}</TableCell>
                                        <TableCell>
                                            {type.isRequired ? (
                                                <Badge variant="destructive">Required</Badge>
                                            ) : (
                                                <Badge variant="secondary">Optional</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <form action={deleteDocumentType.bind(null, type.id)}>
                                                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                                                    Delete
                                                </Button>
                                            </form>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {docTypes.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                                            No document types defined.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <div>
                <CreateDocTypeForm />
            </div>
        </div>
    );
}
