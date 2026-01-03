
"use client";

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingInputProps {
    rating: number;
    onRatingChange: (rating: number) => void;
    totalStars?: number;
    className?: string;
}

export default function StarRatingInput({ rating, onRatingChange, totalStars = 5, className }: StarRatingInputProps) {
    const [hoverRating, setHoverRating] = useState(0);

    return (
        <div className={cn("flex items-center gap-1", className)}>
            {[...Array(totalStars)].map((_, index) => {
                const starValue = index + 1;
                return (
                    <button
                        key={starValue}
                        type="button"
                        onClick={() => onRatingChange(starValue)}
                        onMouseEnter={() => setHoverRating(starValue)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="cursor-pointer"
                    >
                        <Star
                            className={cn(
                                "h-6 w-6 transition-colors",
                                starValue <= (hoverRating || rating)
                                    ? "text-accent fill-accent"
                                    : "text-muted-foreground/50"
                            )}
                        />
                    </button>
                );
            })}
        </div>
    );
}
