"use client"
import { Button, Card, CardContent, CardHeader, CardTitle } from '@mini/ui'

export default function InventoryIndexPage() {
  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold">Склад</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Приёмка товара</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Увеличение остатка при поступлении товара.</p>
            <a href="/inventory/receipt"><Button>Открыть приёмку</Button></a>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Корректировка</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Быстрое добавление/убавление остатков со ссылкой на причину.</p>
            <a href="/inventory/adjust"><Button variant="outline">Открыть корректировку</Button></a>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
