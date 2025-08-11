'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Settings, Save, ArrowLeft, Star } from 'lucide-react'
import Link from 'next/link'

interface MeritData {
  count: number
}

export default function AdminPage() {
  const [merit, setMerit] = useState<MeritData>({ count: 0 })
  const [newCount, setNewCount] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMerit()
  }, [])

  const fetchMerit = async () => {
    try {
      const response = await fetch('/api/merit')
      const data = await response.json()
      setMerit(data)
      setNewCount(data.count.toString())
    } catch (error) {
      console.error('Failed to fetch merit:', error)
      setError('Failed to fetch current merit count')
    } finally {
      setLoading(false)
    }
  }

  const updateMerit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSuccess(false)
    setError('')

    try {
      const count = parseInt(newCount)
      if (isNaN(count) || count < 0) {
        setError('Please enter a valid positive number')
        return
      }

      const response = await fetch('/api/merit/admin', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ count }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setMerit(data)
        setSuccess(true)
      } else {
        setError('Failed to update merit count')
      }
    } catch (error) {
      console.error('Failed to update merit:', error)
      setError('Failed to update merit count')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Settings className="h-8 w-8" />
              Admin Panel
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage the shared merit box settings
            </p>
          </div>
          <Link href="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Merit Box
            </Button>
          </Link>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Current Merit Status
              </CardTitle>
              <CardDescription>
                View the current merit count in the shared pool
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div className="text-4xl font-bold text-primary">
                  {merit.count}
                </div>
                <Badge variant="secondary">
                  {merit.count} {merit.count === 1 ? 'point' : 'points'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Update Merit Count</CardTitle>
              <CardDescription>
                Manually set the total merit count. Use this feature responsibly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={updateMerit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="merit-count">New Merit Count</Label>
                  <Input
                    id="merit-count"
                    type="number"
                    min="0"
                    value={newCount}
                    onChange={(e) => setNewCount(e.target.value)}
                    placeholder="Enter new merit count"
                    className="text-lg"
                  />
                </div>

                {success && (
                  <Alert className="border-green-200 bg-green-50">
                    <AlertDescription className="text-green-800">
                      Merit count updated successfully!
                    </AlertDescription>
                  </Alert>
                )}

                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  disabled={saving}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Update Merit Count'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Admin Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Changes made here will immediately affect the main merit box</p>
                <p>• Please ensure you have proper authorization before making changes</p>
                <p>• All changes are logged and can be audited</p>
                <p>• Consider the impact on the community before modifying counts</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}