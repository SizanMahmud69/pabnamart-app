
import { processWithdrawals } from '@/app/affiliate/actions';
import { NextResponse } from 'next/server';

/**
 * Endpoint for automated withdrawal processing.
 * This can be called by Vercel Cron or a similar service once per day.
 * URL: /api/cron/withdrawals
 */
export async function GET(request: Request) {
  // Check for authorization header if using Vercel Cron secret
  // const authHeader = request.headers.get('authorization');
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return new Response('Unauthorized', { status: 401 });
  // }

  try {
    console.log("CRON: Starting automatic withdrawal process...");
    const result = await processWithdrawals(false); // false means it respects the dates in settings
    console.log("CRON: Process finished.", result);
    
    return NextResponse.json({ 
      success: true, 
      message: result?.message || "Processed",
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("CRON: Error processing withdrawals:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
