import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url') || 'https://naturalist.example.com'
  const size = parseInt(searchParams.get('size') || '200')

  try {
    const qrBuffer = await QRCode.toBuffer(url, {
      width: size,
      margin: 2,
      color: {
        dark: '#1a3a2a',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    })

    return new NextResponse(new Uint8Array(qrBuffer), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400' // 1 day cache
      }
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to generate QR code' }, { status: 500 })
  }
}
