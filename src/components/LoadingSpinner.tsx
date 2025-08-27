import { Loader } from 'lucide-react';

export default function LoadingSpinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 z-50">
      <div className="flex flex-col items-center gap-4">
        <Loader className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
