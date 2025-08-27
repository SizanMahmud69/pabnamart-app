
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";
import StarRating from "@/components/StarRating";
import { Separator } from "@/components/ui/separator";

const reviews = [
    { 
        productName: "Classic Leather Watch",
        rating: 5,
        comment: "Absolutely love this watch! Great quality and looks amazing.",
        date: "2023-10-20"
    },
    {
        productName: "Wireless Bluetooth Headphones",
        rating: 4,
        comment: "Incredible sound quality and very long battery life. Highly recommended!",
        date: "2023-10-18"
    }
];

export default function ReviewsPage() {
    return (
        <div className="bg-purple-50/30 min-h-screen">
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-6">My Reviews</h1>
                <Card>
                    <CardContent className="p-6">
                        {reviews.length > 0 ? (
                            <div className="space-y-6">
                                {reviews.map((review, index) => (
                                    <div key={index}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-semibold">{review.productName}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <StarRating rating={review.rating} />
                                                </div>
                                            </div>
                                            <p className="text-sm text-muted-foreground">{review.date}</p>
                                        </div>
                                        <p className="text-muted-foreground mt-2">{review.comment}</p>
                                        {index < reviews.length - 1 && <Separator className="mt-6" />}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <Star className="mx-auto h-16 w-16 text-muted-foreground" />
                                <h2 className="mt-4 text-xl font-semibold">No Reviews Yet</h2>
                                <p className="text-muted-foreground">You haven't reviewed any products.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
