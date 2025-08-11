import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    let merit = await db.merit.findFirst()
    
    if (!merit) {
      merit = await db.merit.create({
        data: { count: 0 }
      })
    }

    return NextResponse.json({ count: merit.count })
  } catch (error) {
    console.error('Error fetching merit:', error)
    return NextResponse.json({ error: 'Failed to fetch merit' }, { status: 500 })
  }
}

export async function POST() {
  try {
    let merit = await db.merit.findFirst()
    
    if (!merit) {
      merit = await db.merit.create({
        data: { count: 1 }
      })
    } else {
      merit = await db.merit.update({
        where: { id: merit.id },
        data: { count: merit.count + 1 }
      })
    }

    return NextResponse.json({ count: merit.count })
  } catch (error) {
    console.error('Error adding merit:', error)
    return NextResponse.json({ error: 'Failed to add merit' }, { status: 500 })
  }
}