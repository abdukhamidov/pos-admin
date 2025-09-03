import { Card, CardContent, CardHeader, CardTitle } from "@mini/ui";
import { OpenShiftsInline } from "@/components/OpenShiftsInline";

export default function ReportsIndexPage() {
  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold">Отчёты</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle>Продажи</CardTitle></CardHeader>
          <CardContent>
            <a className="underline" href="/reports/sales">Список чеков с фильтрами</a>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Смены</CardTitle></CardHeader>
          <CardContent>
            <a className="underline" href="/reports/shifts">Сводка по сменам за период</a>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Выручка по дням</CardTitle></CardHeader>
          <CardContent>
            <a className="underline" href="/reports/revenue">Отчёт по выручке (дни/средний чек)</a>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Низкие остатки</CardTitle></CardHeader>
          <CardContent>
            <a className="underline" href="/reports/stock">Товары ниже порога</a>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Поступления</CardTitle></CardHeader>
          <CardContent>
            <a className="underline" href="/reports/receipts">Отчёт о приёмках (поступления)</a>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Открытые смены</CardTitle></CardHeader>
          <CardContent>
            <a className="underline" href="/reports/open-shifts">Список открытых смен</a>
          </CardContent>
        </Card>
      </div>

      {/* Встроенный список открытых смен */}
      <OpenShiftsInline />
    </main>
  );
}
