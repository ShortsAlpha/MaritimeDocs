import { SignOutButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

export default function PendingPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-muted/20 p-4">
            <div className="max-w-md w-full bg-card border shadow-sm rounded-2xl p-8 text-center space-y-6">
                <div className="mx-auto w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-6">
                    <Clock className="w-8 h-8" />
                </div>
                
                <h1 className="text-2xl font-bold tracking-tight">Account Pending Approval</h1>
                
                <p className="text-muted-foreground">
                    Your account is currently under review by system administrators. 
                    You will be able to access the system once authorization is granted.
                </p>

                <div className="pt-6">
                    <SignOutButton>
                        <Button variant="outline" className="w-full">
                            Sign Out
                        </Button>
                    </SignOutButton>
                </div>
            </div>
        </div>
    );
}
