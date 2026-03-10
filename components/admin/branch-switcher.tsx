"use client"

import { useState, useEffect, useTransition } from "react"
import { Globe, Check, Building2 } from "lucide-react"
import { setActiveBranch, getAllBranches, getActiveBranchOverride } from "@/app/actions/branch-switch"

type Branch = {
    id: string
    code: string
    name: string
}

export function BranchSwitcher() {
    const [branches, setBranches] = useState<Branch[]>([])
    const [activeBranchId, setActiveBranchId] = useState<string | null>(null)
    const [isOpen, setIsOpen] = useState(false)
    const [isPending, startTransition] = useTransition()

    useEffect(() => {
        async function load() {
            const [branchList, override] = await Promise.all([
                getAllBranches(),
                getActiveBranchOverride()
            ])
            setBranches(branchList)
            setActiveBranchId(override)
        }
        load()
    }, [])

    // Don't render if user is not SUPER_ADMIN (no branches returned)
    if (branches.length === 0) return null

    const activeBranch = branches.find(b => b.id === activeBranchId)
    const label = activeBranch ? activeBranch.name : "All Branches"

    function handleSelect(branchId: string | null) {
        startTransition(async () => {
            await setActiveBranch(branchId)
            setActiveBranchId(branchId)
            setIsOpen(false)
        })
    }

    const FLAG_MAP: Record<string, string> = {
        HQ: "🇲🇹",
        BG: "🇧🇬",
        GR: "🇬🇷",
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={isPending}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-background hover:bg-muted transition-colors text-sm font-medium disabled:opacity-50"
            >
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{activeBranch ? FLAG_MAP[activeBranch.code] || activeBranch.code : "🌍"}</span>
                <svg className="h-3 w-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 z-50 w-56 rounded-lg border bg-popover p-1 shadow-lg animate-in fade-in-0 zoom-in-95">
                        {/* All Branches option */}
                        <button
                            onClick={() => handleSelect(null)}
                            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
                        >
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <span className="flex-1 text-left">All Branches</span>
                            {!activeBranchId && <Check className="h-4 w-4 text-primary" />}
                        </button>

                        <div className="my-1 h-px bg-border" />

                        {/* Individual branches */}
                        {branches.map(branch => (
                            <button
                                key={branch.id}
                                onClick={() => handleSelect(branch.id)}
                                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
                            >
                                <span className="text-base">{FLAG_MAP[branch.code] || "🏢"}</span>
                                <span className="flex-1 text-left">{branch.name}</span>
                                {activeBranchId === branch.id && <Check className="h-4 w-4 text-primary" />}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
