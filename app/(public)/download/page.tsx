'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2, Download as DownloadIcon } from 'lucide-react';

export default function DownloadPage() {
    const searchParams = useSearchParams();
    const key = searchParams.get('key');

    useEffect(() => {
        if (key) {
            // Delay slightly for UX so the page renders before initiating download
            const timer = setTimeout(() => {
                window.location.href = `/api/download?key=${encodeURIComponent(key)}`;
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [key]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 text-neutral-100 p-4">
            <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-2xl max-w-md w-full text-center space-y-6 shadow-xl">
                <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-indigo-500/20">
                    <DownloadIcon className="w-8 h-8 text-indigo-400" />
                </div>
                
                <div>
                    <h1 className="text-xl font-bold text-white tracking-tight mb-2">Downloading File</h1>
                    <p className="text-sm text-neutral-400">
                        Please wait while we securely retrieve your document. The download should begin automatically.
                    </p>
                </div>
                
                <div className="pt-4 flex justify-center pb-2">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                </div>
                
                <div className="text-xs text-neutral-500 pt-4 border-t border-neutral-800/50">
                    If the download doesn't start automatically,{' '}
                    <a 
                        href={`/api/download?key=${key ? encodeURIComponent(key) : ''}`} 
                        className="text-indigo-400 font-medium hover:underline"
                    >
                        click here
                    </a>
                    .
                </div>
            </div>
        </div>
    );
}
