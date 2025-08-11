import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(request: NextRequest) {
  try {
    const { count } = await request.json()
    
    if (typeof count !== 'number' || count < 0) {
      return NextResponse.json({ error: 'Invalid count value' }, { status: 400 })
    }

    let merit = await db.merit.findFirst()
    
    if (!merit) {
      merit = await db.merit.create({
        data: { count }
      })
    } else {
      merit = await db.merit.update({
        where: { id: merit.id },
        data: { count }
      })
    }

    return NextResponse.json({ count: merit.count })
  } catch (error) {
    console.error('Error updating merit:', error)
    return NextResponse.json({ error: 'Failed to update merit' }, { status: 500 })
  }
}