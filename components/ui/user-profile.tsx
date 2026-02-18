'use client';
import React from 'react';
import {
    Popover,
    PopoverBody,
    PopoverContent,
    PopoverDescription,
    PopoverHeader,
    PopoverTitle,
    PopoverTrigger,
    PopoverFooter,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { User, Settings, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser, useClerk } from "@clerk/nextjs";

export default function UserProfile() {
    // Check if context exists loosely? No, useUser throws.
    // Try to catch? Hooks can't be caught in-component.
    // Let's verify imports first.
    return <UserProfileContent />
}

function UserProfileContent() {
    const { user, isLoaded } = useUser();
    const { signOut, openUserProfile } = useClerk();

    if (!isLoaded || !user) return null;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" className="h-10 w-10 rounded-full p-0">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user.imageUrl} alt={user.fullName || "User"} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                            {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </PopoverTrigger>
            <PopoverContent className='w-64' align="end">
                <PopoverHeader>
                    <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={user.imageUrl} />
                            <AvatarFallback>{user.firstName?.charAt(0)}{user.lastName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col space-y-0.5">
                            <PopoverTitle className="text-sm font-semibold">{user.fullName}</PopoverTitle>
                            <PopoverDescription className='text-xs truncate max-w-[150px]'>{user.primaryEmailAddress?.emailAddress}</PopoverDescription>
                        </div>
                    </div>
                </PopoverHeader>
                <PopoverBody className="space-y-1 px-2 py-1">
                    <Button variant="ghost" className="w-full justify-start h-8 px-2" size="sm" onClick={() => openUserProfile()}>
                        <User className="mr-2 h-4 w-4" />
                        Manage account
                    </Button>
                    {/* Settings could be a separate page or just point to manage account for now */}
                    {/* <Button variant="ghost" className="w-full justify-start h-8 px-2" size="sm">
						<Settings className="mr-2 h-4 w-4" />
						Settings
					</Button> */}
                </PopoverBody>
                <PopoverFooter>
                    <Button
                        variant="ghost"
                        className="w-full justify-start h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        size="sm"
                        onClick={() => signOut()}
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                    </Button>
                </PopoverFooter>
            </PopoverContent>
        </Popover>
    );
}
