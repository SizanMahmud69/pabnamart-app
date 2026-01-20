import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";

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
                        <CardTitle className="text-3xl">Privacy & Terms</CardTitle>
                        <CardDescription>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</CardDescription>
                    </CardHeader>
                    <CardContent className="prose max-w-none prose-sm sm:prose-base">
                        <h2>Privacy Policy</h2>
                        <p>Welcome to PabnaMart. We are committed to protecting your personal information and your right to privacy. This policy explains what information we collect, how we use it, and what rights you have in relation to it.</p>
                        
                        <h3>1. What Information We Collect</h3>
                        <p>We collect personal information that you voluntarily provide to us when you register an account, place an order, or contact us. This includes:</p>
                        <ul>
                            <li><strong>Identity Data:</strong> Name, username, or similar identifier.</li>
                            <li><strong>Contact Data:</strong> Email address, phone numbers, and shipping addresses.</li>
                            <li><strong>Financial Data:</strong> For online payments, we collect the payment account number and transaction ID to verify your payment. We do not store credit card details.</li>
                            <li><strong>Transaction Data:</strong> Details about products you have purchased from us, order history, and payments.</li>
                            <li><strong>Technical Data:</strong> Firebase Cloud Messaging (FCM) tokens for sending push notifications to your device.</li>
                            <li><strong>Profile Data:</strong> Your username, password (hashed), wishlist, collected vouchers, reviews, and feedback.</li>
                            <li><strong>Usage Data:</strong> Information about how you use our website, such as your browsing history, which may be used to provide personalized product recommendations.</li>
                        </ul>
                        
                        <h3>2. How We Use Your Information</h3>
                        <p>We use your personal information for the following purposes:</p>
                        <ul>
                            <li>To create and manage your account.</li>
                            <li>To process and deliver your orders, including managing payments and shipping.</li>
                            <li>To manage our relationship with you, including sending notifications about your order status, returns, and available vouchers.</li>
                            <li>To provide personalized recommendations and improve your shopping experience.</li>
                            <li>To manage and display customer reviews.</li>
                            <li>To ensure the security of our services and prevent fraud.</li>
                        </ul>
                        
                        <h3>3. How We Share Your Information</h3>
                        <p>We do not sell or rent your personal information to third parties. Your information is only used to provide and improve our services. We do not share your information with external parties except where necessary for service delivery (which is managed internally in this app).</p>
                        
                        <h3>4. Data Security & Retention</h3>
                        <p>We have implemented appropriate security measures to prevent your personal information from being accidentally lost, used, or accessed in an unauthorized way. We will only retain your personal data for as long as your account is active or as necessary to fulfill the purposes we collected it for, including for the purposes of satisfying any legal, accounting, or reporting requirements.</p>

                        <h3>5. Pricing and Rounding Policy</h3>
                        <p>To ensure clarity and simplicity in our pricing, all final product prices are rounded to the nearest whole number. If a price calculation (e.g., after a discount) results in a decimal value, the following rounding rule is applied:</p>
                        <ul>
                            <li>If the decimal part is between .01 and .50, the price will be rounded down to the nearest whole number (e.g., ৳100.50 becomes ৳100).</li>
                            <li>If the decimal part is between .51 and .99, the price will be rounded up to the nearest whole number (e.g., ৳100.51 becomes ৳101).</li>
                        </ul>
                        <p>This policy ensures that all prices displayed at checkout are clear, simple, and free of confusing decimal points.</p>

                        <Separator className="my-8" />
                        
                        <h2>Terms and Conditions</h2>
                        <p>By accessing and using PabnaMart, you accept and agree to be bound by these Terms and Conditions.</p>

                        <h3>1. Accounts</h3>
                        <p>When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password.</p>
                        
                        <h3>2. Orders & Payments</h3>
                        <p>Placing an order constitutes an offer to purchase a product. All orders are subject to availability and confirmation of the order price. We reserve the right to refuse or cancel any order for any reason, including but not limited to: product availability, errors in the description or price of the product, or error in your order. For online payments, you are required to provide a valid transaction ID and the account number from which the payment was made for verification purposes.</p>
                        
                        <h3>3. User Content (Reviews)</h3>
                        <p>You are solely responsible for the content you post, including reviews and images. By posting content, you grant us a non-exclusive, royalty-free, perpetual, and irrevocable right to use, reproduce, modify, and display such content. Content must not be illegal, obscene, threatening, or defamatory.</p>

                        <h3>4. Returns and Vouchers</h3>
                        <p>Returns are subject to our return policy, which may require you to request a return within a specified period after delivery. Approved returns may be compensated via a store voucher. Vouchers, whether for returns or promotions, are subject to their own terms, such as minimum spend and usage limits, and are not redeemable for cash.</p>
                        
                        <h3>5. Limitation of Liability</h3>
                        <p>In no event shall PabnaMart, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages resulting from your access to or use of, or inability to access or use, the service.</p>

                        <h3>6. Termination</h3>
                        <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}