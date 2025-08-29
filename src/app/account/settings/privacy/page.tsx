
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
    return (
        <div className="bg-purple-50/30 min-h-screen">
            <div className="container mx-auto max-w-2xl px-4 py-6">
                 <Button asChild variant="ghost" className="mb-4">
                    <Link href="/account/settings">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Settings
                    </Link>
                </Button>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl">Privacy Policy</CardTitle>
                        <CardDescription>Last updated: October 26, 2023</CardDescription>
                    </CardHeader>
                    <CardContent className="prose max-w-none">
                        <p>Welcome to PabnaMart. We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about our policy, or our practices with regards to your personal information, please contact us.</p>
                        
                        <h2>1. What Information We Collect</h2>
                        <p>We collect personal information that you voluntarily provide to us when you register on the website, express an interest in obtaining information about us or our products and services, when you participate in activities on the website or otherwise when you contact us.</p>
                        
                        <h2>2. How We Use Your Information</h2>
                        <p>We use personal information collected via our website for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.</p>
                        
                        <h2>3. Will Your Information Be Shared With Anyone?</h2>
                        <p>We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations.</p>
                        
                        <h2>4. How Long Do We Keep Your Information?</h2>
                        <p>We keep your information for as long as necessary to fulfill the purposes outlined in this privacy policy unless otherwise required by law.</p>

                        <h2>5. How Do We Keep Your Information Safe?</h2>
                        <p>We aim to protect your personal information through a system of organizational and technical security measures.</p>

                        <h2>6. Pricing and Rounding Policy</h2>
                        <p>To ensure clarity and simplicity in our pricing, all final product prices are rounded to the nearest whole number. If a price calculation (e.g., after a discount) results in a decimal value, the following rounding rule is applied:</p>
                        <ul>
                            <li>If the decimal part is between .01 and .50, the price will be rounded down to the nearest whole number (e.g., ৳100.50 becomes ৳100).</li>
                            <li>If the decimal part is between .51 and .99, the price will be rounded up to the nearest whole number (e.g., ৳100.51 becomes ৳101).</li>
                        </ul>
                        <p>This policy ensures that all prices displayed at checkout are clear, simple, and free of confusing decimal points.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
