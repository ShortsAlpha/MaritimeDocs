'use client'

import { useState, useTransition } from "react"
import { Course, DocumentType } from "@prisma/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FileText, Loader2, Plus, X, Search } from "lucide-react"
import { getCourseRequiredDocs, toggleCourseDocument } from "@/app/actions/courses"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

interface CourseDocumentsDialogProps {
    course: Course
    allDocTypes: DocumentType[]
}

export function CourseDocumentsDialog({ course, allDocTypes }: CourseDocumentsDialogProps) {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [loading, setLoading] = useState(false)
    const [linkedDocIds, setLinkedDocIds] = useState<Set<string>>(new Set())
    const [searchQuery, setSearchQuery] = useState("")

    async function handleOpen(isOpen: boolean) {
        setOpen(isOpen)
        if (isOpen) {
            setLoading(true)
            const linked = await getCourseRequiredDocs(course.id)
            setLinkedDocIds(new Set(linked.map((d: any) => d.documentTypeId)))
            setLoading(false)
        }
    }

    async function handleToggle(docTypeId: string) {
        startTransition(async () => {
            // Optimistic update
            const nextSet = new Set(linkedDocIds)
            if (nextSet.has(docTypeId)) nextSet.delete(docTypeId)
            else nextSet.add(docTypeId)
            setLinkedDocIds(nextSet)

            // Server update
            await toggleCourseDocument(course.id, docTypeId)
        })
    }

    const filteredDocs = allDocTypes.filter(doc => 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        doc.category.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <Dialog open={open} onOpenChange={handleOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30">
                    <FileText className="h-4 w-4" />
                    <span className="sr-only">Documents</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[900px] w-[95vw] max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-xl leading-tight">
                        <div className="flex items-center gap-2 shrink-0">
                            <FileText className="w-5 h-5 text-indigo-600" />
                            Required Documents:
                        </div>
                        <span className="font-normal text-muted-foreground">{course.title}</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="relative mt-2">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search document types..."
                        className="pl-9 bg-muted/30 border-border"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex-1 overflow-hidden mt-4 bg-muted/10 rounded-xl border border-border">
                    {loading ? (
                        <div className="h-48 flex items-center justify-center text-muted-foreground">
                            <Loader2 className="w-6 h-6 animate-spin mr-2" />
                            Loading configuration...
                        </div>
                    ) : (
                        <ScrollArea className="h-[400px]">
                            <div className="p-3 space-y-2">
                                {filteredDocs.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No documents found matching your search.
                                    </div>
                                ) : (
                                    filteredDocs.map(doc => {
                                        const isLinked = linkedDocIds.has(doc.id)
                                        return (
                                            <div 
                                                key={doc.id} 
                                                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                                                    isLinked 
                                                        ? "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/50" 
                                                        : "bg-card border-border hover:border-slate-300 dark:hover:border-slate-700"
                                                }`}
                                            >
                                                <div className="flex flex-col gap-1 min-w-0 pr-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-sm text-foreground truncate">
                                                            {doc.title}
                                                        </span>
                                                        <Badge variant="outline" className="text-[10px] h-5 uppercase shrink-0">
                                                            {doc.category}
                                                        </Badge>
                                                    </div>
                                                    {doc.description && (
                                                        <span className="text-xs text-muted-foreground truncate">
                                                            {doc.description}
                                                        </span>
                                                    )}
                                                </div>

                                                <Button 
                                                    size="sm" 
                                                    variant={isLinked ? "outline" : "default"}
                                                    className={`shrink-0 min-w[80px] h-8 ${isLinked ? 'text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:hover:bg-red-900/30' : ''}`}
                                                    onClick={() => handleToggle(doc.id)}
                                                    disabled={isPending}
                                                >
                                                    {isLinked ? (
                                                        <>
                                                            <X className="w-3 h-3 mr-1.5" />
                                                            Remove
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Plus className="w-3 h-3 mr-1.5" />
                                                            Add
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </ScrollArea>
                    )}
                </div>

                <div className="mt-4 pt-4 border-t border-border flex justify-between items-center text-sm text-muted-foreground">
                    <span>Selected: <strong className="text-foreground">{linkedDocIds.size}</strong> documents</span>
                    <Button variant="outline" onClick={() => setOpen(false)}>Done</Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
