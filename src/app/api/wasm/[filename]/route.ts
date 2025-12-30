import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await context.params;
    
    // Solo permitir archivos .wasm
    if (!filename.endsWith('.wasm')) {
      return new NextResponse('Not Found', { status: 404 });
    }

    // Leer archivo desde public/wasm/
    const filePath = join(process.cwd(), 'public', 'wasm', filename);
    const fileBuffer = await readFile(filePath);

    // Retornar con headers correctos
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/wasm',
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving WASM:', error);
    return new NextResponse('Not Found', { status: 404 });
  }
}
