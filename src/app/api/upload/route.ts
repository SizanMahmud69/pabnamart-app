
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
 
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const jsonResponse = await handleUpload({
      body: request.body,
      request,
      onBeforeUpload: async ({ filename }) => {
        // Generate a random pathname for the blob
        const blobFilename = `${filename}-${Math.random().toString(36).slice(2)}`;
        return {
          pathname: blobFilename,
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
