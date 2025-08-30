
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ProductCardSkeletonProps {
    size?: 'default' | 'small';
}

export default function ProductCardSkeleton({ size = 'default' }: ProductCardSkeletonProps) {
    const isSmall = size === 'small';
    return (
        <Card className="flex h-full flex-col overflow-hidden rounded-lg">
            <div className="relative aspect-square w-full overflow-hidden">
                <Skeleton className="h-full w-full" />
            </div>
            <CardContent className={cn("flex flex-col flex-grow space-y-2", isSmall ? "p-2" : "p-3")}>
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className={cn("w-full", isSmall ? "h-8" : "h-10")} />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex justify-between items-center pt-1">
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className={cn("rounded-md", isSmall ? "h-7 w-7" : "h-9 w-9")} />
                </div>
            </CardContent>
        </Card>
    );
}
