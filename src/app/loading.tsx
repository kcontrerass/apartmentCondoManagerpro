export default function Loading() {
    return (
        <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-900">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium animate-pulse">Loading application...</p>
            </div>
        </div>
    );
}
