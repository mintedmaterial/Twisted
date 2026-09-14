import { NextResponse } from 'next/server';

export async function GET() {
	return NextResponse.redirect('https://twistedcustomleather.com/submit-your-gear', 308);
}
