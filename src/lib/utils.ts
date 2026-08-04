import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to convert RGB to HSL
export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h * 360, s * 100, l * 100];
}

/**
 * Formats quantity to show up to 3 decimal places ONLY if it's a decimal.
 * Removes unnecessary trailing zeros.
 */
export function formatQuantity(val: number): string {
    if (isNaN(val)) return '0';
    return Number(val.toFixed(3)).toString();
}

/**
 * Custom money rounding: If decimal part > 0.55, round up. Otherwise, round down.
 * Returns only integer values as requested.
 */
export function formatMoney(val: number): string {
    if (isNaN(val)) return '0';
    const integerPart = Math.floor(val);
    const decimalPart = val - integerPart;
    if (decimalPart > 0.55) {
        return (integerPart + 1).toString();
    }
    return integerPart.toString();
}

/**
 * Returns the numeric version of formatMoney for internal calculations.
 */
export function roundMoney(val: number): number {
    return parseInt(formatMoney(val), 10);
}
