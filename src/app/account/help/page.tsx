
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const faqs = [
    {
        question: "How do I place an order?",
        answer: "To place an order, simply browse our products, add items to your cart, and proceed to checkout. Follow the on-screen instructions to complete your purchase."
    },
    {
        question: "What payment methods do you accept?",
        answer: "We accept various payment methods, including credit/debit cards, mobile banking, and cash on delivery."
    },
    {
        question: "How can I track my order?",
        answer: "Once your order is shipped, you will receive a tracking number via email. You can use this number on our website to track your order's status."
    },
    {
        question: "What is your return policy?",
        answer: "We have a 7-day return policy for most items. Please visit our 'Returns' page for more details on the process and eligibility."
    }
]

export default function HelpCenterPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-3xl mx-auto">
                <Card>
                    <CardHeader className="text-center">
                        <HelpCircle className="mx-auto h-12 w-12 text-primary" />
                        <CardTitle className="text-3xl mt-2">Help Center</CardTitle>
                        <CardDescription>Find answers to frequently asked questions.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="single" collapsible className="w-full">
                            {faqs.map((faq, index) => (
                                <AccordionItem key={index} value={`item-${index}`}>
                                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                                    <AccordionContent>
                                        {faq.answer}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
