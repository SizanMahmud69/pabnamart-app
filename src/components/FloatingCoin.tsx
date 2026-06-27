
"use client";

import { useState, useEffect, useRef } from 'react';
import { Coins } from 'lucide-react';
import Link from 'next/link';

export default function FloatingCoin() {
    const [position, setPosition] = useState({ x: 20, y: 150 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const coinRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const savedPos = localStorage.getItem('coinPosition');
        if (savedPos) {
            try {
                setPosition(JSON.parse(savedPos));
            } catch (e) {}
        }
    }, []);

    const handleTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true);
        const touch = e.touches[0];
        setDragStart({
            x: touch.clientX - position.x,
            y: touch.clientY - position.y
        });
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        const touch = e.touches[0];
        const newX = touch.clientX - dragStart.x;
        const newY = touch.clientY - dragStart.y;
        
        // Keep within bounds
        const boundedX = Math.max(10, Math.min(window.innerWidth - 70, newX));
        const boundedY = Math.max(10, Math.min(window.innerHeight - 70, newY));
        
        setPosition({ x: boundedX, y: boundedY });
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
        localStorage.setItem('coinPosition', JSON.stringify(position));
    };

    return (
        <div
            ref={coinRef}
            style={{ 
                left: `${position.x}px`, 
                top: `${position.y}px`,
                touchAction: 'none',
                zIndex: 9999
            }}
            className="fixed w-14 h-14 cursor-move select-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <Link href="/coins" draggable="false">
                <div className="w-full h-full bg-yellow-400 rounded-full flex items-center justify-center shadow-xl border-4 border-yellow-600 animate-bounce transition-transform active:scale-95">
                    <Coins className="text-yellow-900 h-8 w-8" />
                    <div className="absolute -top-1 -right-1 bg-primary text-[10px] text-white px-1.5 py-0.5 rounded-full font-bold">
                        Win
                    </div>
                </div>
            </Link>
        </div>
    );
}
