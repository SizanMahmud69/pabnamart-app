"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import StarRating from './StarRating';

interface ProductFiltersProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  priceRange: number[];
  onPriceChange: (range: number[]) => void;
  rating: number;
  onRatingChange: (rating: number) => void;
}

export default function ProductFilters({
  categories,
  selectedCategory,
  onCategoryChange,
  priceRange,
  onPriceChange,
  rating,
  onRatingChange,
}: ProductFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger id="category">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat} className="capitalize">
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Price Range</Label>
          <Slider
            min={0}
            max={1000}
            step={10}
            value={priceRange}
            onValueChange={onPriceChange}
            className="py-2"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>৳{priceRange[0]}</span>
            <span>৳{priceRange[1]}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Rating</Label>
          <RadioGroup 
            value={String(rating)} 
            onValueChange={(value) => onRatingChange(Number(value))}
            className="space-y-2"
          >
            {[4, 3, 2, 1, 0].map(r => (
              <div key={r} className="flex items-center space-x-2">
                <RadioGroupItem value={String(r)} id={`r-${r}`} />
                <Label htmlFor={`r-${r}`} className="flex items-center gap-2 cursor-pointer">
                  {r > 0 ? (
                    <>
                      <StarRating rating={r} />
                      <span className="text-muted-foreground">& up</span>
                    </>
                  ) : 'Any rating'}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  );
}
