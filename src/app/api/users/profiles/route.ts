import { NextResponse } from 'next/server';
import { getUserProfiles } from '@/lib/data';

export async function GET() {
  const profiles = getUserProfiles();
  return NextResponse.json(profiles);
}
