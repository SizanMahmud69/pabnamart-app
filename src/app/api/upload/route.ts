
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
 
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const jsonResponse = await handleUpload({
      body: request.body,
      request,
      onBeforeUpload: async (pathname) => {
        // Generate a random pathname for the blob
        const filename = `${pathname}-${Math.random().toString(36).slice(2)}`;
        return {
          pathname: filename,
          // Disallow overwriting existing blobs
        };
      },
      onUploadCompleted: async ({ blob, token }) => {
        console.log('blob upload completed', blob, token);
      },
    });
 
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
