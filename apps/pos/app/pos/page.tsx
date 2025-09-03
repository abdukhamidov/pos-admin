"use client";

import { useEffect, useMemo, useState } from "react";

// Local UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

type Product = { id: string; name: string; price: number; stock: number; categoryId?: string };
type Category = { id: string; name: string };
type CartItem = { id: string; name: string; price: number; quantity: number };
type SaleRow = { id: string; total: number; createdAt: string; sellerName?: string; items?: { id: string; name?: string; nameSnapshot?: string; qty: number; price: number }[] };
type ActiveShift = { id: string; startedAt: string; sellerName?: string | null };

const fmtMoney = (n: number) => new Intl.NumberFormat("ru-RU").format(n) + " сум";
const lineTotal = (q: number, p: number) => q * p;
const fmtDateTime = (iso: string | Date) => new Date(iso).toLocaleString("ru-RU");

async function fetchCategories(): Promise<Category[]> {
  const r = await fetch("/api/pos/categories", { cache: "no-store" });
  if (!r.ok) return [];
  return r.json();
}

async function fetchProducts(query: string, categoryId?: string): Promise<Product[]> {
  const sp = new URLSearchParams();
  if (query) sp.set("query", query);
  if (categoryId && categoryId !== "all") sp.set("categoryId", categoryId);
  const r = await fetch("/api/pos/products" + (sp.size ? `?${sp}` : ""), { cache: "no-store" });
  if (!r.ok) return [];
  return r.json();
}

async function createCheckout(payload: { items: { productId: string; qty: number; price: number; name?: string }[]; payment: { method: "cash" | "card" | "mixed"; paid: number }; note?: string }) {
  // Create draft sale
  const sale = await fetch("/api/pos/sales", { method: "POST" }).then(r => r.json());
  // Add items
  for (const it of payload.items) {
    const res = await fetch(`/api/pos/sales/${sale.id}/add-item`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: it.productId, qty: it.qty }),
    });
    if (!res.ok) throw new Error((await res.json()).error || "ADD_ITEM_FAILED");
  }
  // Complete sale (server will compute totals and attach to shift)
  const done = await fetch(`/api/pos/sales/${sale.id}/complete`, { method: "POST" });
  if (!done.ok) throw new Error((await done.json()).error || "COMPLETE_FAILED");
  return done.json();
}

async function fetchSales(take = 50): Promise<SaleRow[]> {
  const r = await fetch("/api/pos/sales", { cache: "no-store" });
  if (!r.ok) return [];
  const rows = (await r.json()) as any[];
  return rows.slice(0, take).map(x => ({ id: x.id, total: x.total, createdAt: x.createdAt, sellerName: x.seller?.name || x.seller?.username || x.sellerName, items: x.items }));
}

async function fetchActiveShift(): Promise<ActiveShift | null> {
  const r = await fetch("/api/pos/shifts/current", { cache: "no-store" });
  if (!r.ok) return null;
  return r.json();
}

async function openShift(openingCash: number) {
  const r = await fetch("/api/pos/shifts/open", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ openingCash }),
  });
  if (!r.ok) throw new Error(await r.text());
}

async function closeShift(closingCash: number) {
  const r = await fetch("/api/pos/shifts/close", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ closingCash }),
  });
  if (!r.ok) throw new Error(await r.text());
}

export default function PosPage() {
  // data
  const [cats, setCats] = useState<Category[]>([]);
  const [activeCat, setActiveCat] = useState("all");
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // shift
  const [shift, setShift] = useState<ActiveShift | null>(null);
  const shiftOpened = Boolean(shift?.id);
  const refreshShift = async () => setShift(await fetchActiveShift());
  useEffect(() => { refreshShift(); }, []);

  // cart & payment
  const [cart, setCart] = useState<CartItem[]>([]);
  const [payOpen, setPayOpen] = useState(false);
  const [payMethod, setPayMethod] = useState<"cash" | "card" | "mixed">("cash");
  const [paidAmount, setPaidAmount] = useState(0);
  const [note, setNote] = useState("");
  const [payStep, setPayStep] = useState<"form" | "success">("form");

  // history
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<SaleRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyTake, setHistoryTake] = useState(50);
  const refreshHistory = async (take = historyTake) => { try { setHistoryLoading(true); setHistory(await fetchSales(take)); } finally { setHistoryLoading(false); } };

  // open/close shift dialogs
  const [openShiftDialog, setOpenShiftDialog] = useState(false);
  const [closeShiftDialog, setCloseShiftDialog] = useState(false);
  const [cashStart, setCashStart] = useState(0);
  const [cashEnd, setCashEnd] = useState(0);
  const [shiftTotal, setShiftTotal] = useState(0);

  // initial data
  useEffect(() => { (async () => { setCats([{ id: "all", name: "Все" }, ...(await fetchCategories())]); })(); }, []);
  useEffect(() => { (async () => { setLoading(true); try { setProducts(await fetchProducts(query, activeCat)); } finally { setLoading(false); } })(); }, [query, activeCat]);

  // cart helpers
  const addToCart = (p: Product) => setCart(xs => {
    const i = xs.findIndex(x => x.id === p.id);
    if (i >= 0) { const cp=[...xs]; cp[i]={...cp[i], quantity: cp[i].quantity+1}; return cp; }
    return [...xs, { id: p.id, name: p.name, price: p.price, quantity: 1 }];
  });
  const inc = (id: string) => setCart(xs => xs.map(x => x.id===id?{...x, quantity:x.quantity+1}:x));
  const dec = (id: string) => setCart(xs => xs.map(x => x.id===id?{...x, quantity:x.quantity-1}:x).filter(x => x.quantity>0));
  const removeItem = (id: string) => setCart(xs => xs.filter(x => x.id!==id));
  const clearCart = () => setCart([]);
  const total = useMemo(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart]);

  // payment flows
  const openPayment = () => {
    if (!shiftOpened) { alert("Откройте смену перед продажей"); return; }
    setPaidAmount(total);
    setPayStep("form");
    setPayOpen(true);
  };
  const submitPayment = async () => {
    try {
      if (cart.length===0) return alert("Корзина пуста");
      if (!shiftOpened) return alert("Откройте смену перед продажей");
      await createCheckout({ items: cart.map(c=>({ productId:c.id, qty:c.quantity, price:c.price, name:c.name })), payment:{ method:payMethod, paid:paidAmount }, note });
      setPayStep("success");
      clearCart();
      if (historyOpen) await refreshHistory();
      await refreshShift();
      setTimeout(()=>{ setPayOpen(false); setPayStep("form"); }, 1000);
    } catch(e:any){ alert(e?.message||String(e)); }
  };

  // when closing dialog opens, compute shift total
  useEffect(() => {
    if (!closeShiftDialog || !shift?.id) return;
    (async () => {
      try {
        const r = await fetch('/api/pos/sales?status=COMPLETED', { cache: 'no-store' });
        if (!r.ok) { setShiftTotal(0); return; }
        const rows = await r.json();
        const sum = Array.isArray(rows) ? rows.filter((x:any) => x.shiftId === shift.id).reduce((s:number, x:any)=> s + (x.total||0), 0) : 0;
        setShiftTotal(sum);
        if (cashEnd === 0) setCashEnd(sum);
      } catch { setShiftTotal(0); }
    })();
  }, [closeShiftDialog, shift?.id]);

  // UI
  return (
    <div className="min-h-screen bg-background">
      {/* Topbar */}
      <div className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center text-xs font-semibold">POS</div>
            <div className="text-sm text-muted-foreground hidden sm:block">Касса</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Статус смены:</span>
              {shiftOpened ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">Открыта</span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600">Закрыта</span>
              )}
            </div>
            {shiftOpened ? (
              <Button variant="secondary" size="sm" onClick={() => setCloseShiftDialog(true)}>Закрыть смену</Button>
            ) : (
              <Button size="sm" onClick={() => setOpenShiftDialog(true)}>Открыть смену</Button>
            )}
            <Separator orientation="vertical" className="h-6" />
            <div className="text-sm"><span className="text-muted-foreground mr-1">Продавец:</span><span className="font-medium">{shift?.sellerName || "-"}</span></div>
            <Separator orientation="vertical" className="h-6" />
            <a href="/login"><Button variant="outline" size="sm">Выйти</Button></a>
          </div>
        </div>
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6 py-2">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex items-center gap-2">
              {cats.map(c => (
                <Button key={c.id} size="sm" variant={activeCat===c.id?"default":"secondary"} className="rounded-full" onClick={()=>setActiveCat(c.id)}>{c.id==='all' ? 'Все' : c.name}</Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto w-full max-w-7xl px-4 md:px-6 py-4 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        {/* Left: search + products */}
        <div className="min-h-[60vh]">
          <div className="flex items-center gap-2 mb-4">
            <Input placeholder="Поиск товаров…" value={query} onChange={e=>setQuery(e.target.value)} />
            <Button variant="outline" onClick={()=>setQuery("")}>Сбросить</Button>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {Array.from({length:8}).map((_,i)=> (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="py-3"><div className="h-4 w-2/3 bg-muted rounded"/></CardHeader>
                  <CardContent className="flex items-end justify-between gap-2"><div className="space-y-2"><div className="h-4 w-16 bg-muted rounded"/><div className="h-3 w-20 bg-muted rounded"/></div><div className="h-9 w-16 bg-muted rounded-md"/></CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {products.map(p=>{ const out=(p.stock??0)<=0; return (
                <Card key={p.id} className={`transition-colors ${out?'bg-rose-50 border-rose-200':'border-muted/70 hover:border-foreground/20'}`}>
                  <CardHeader className="py-3"><CardTitle className="text-base line-clamp-2">{p.name}</CardTitle></CardHeader>
                  <CardContent className="flex items-end justify-between gap-2">
                    <div className="text-sm">
                      <div className="font-medium">{fmtMoney(p.price)}</div>
                      <div className={`${out?'text-rose-600':'text-muted-foreground'} text-xs`}>{out? 'Нет в наличии' : `Остаток: ${p.stock ?? 0}`}</div>
                    </div>
                    <Button size="sm" disabled={out} onClick={()=>addToCart(p)}>В чек</Button>
                  </CardContent>
                </Card>
              )})}
              {products.length===0 && (<div className="col-span-full text-center text-sm text-muted-foreground py-10">Товары не найдены.</div>)}
            </div>
          )}
        </div>

        {/* Right: cart */}
        <Card className="h-[78vh] flex flex-col sticky top-[72px]">
          <CardHeader className="py-3"><CardTitle className="text-lg">Корзина</CardTitle></CardHeader>
          <Separator />
          <CardContent className="flex-1 p-0 flex flex-col">
            <ScrollArea className="flex-1 p-4">
              {cart.length===0? (<p className="text-sm text-muted-foreground">Корзина пуста</p>) : (
                <div className="space-y-3">
                  {cart.map(i=> (
                    <div key={i.id} className="flex items-center justify-between gap-2 border rounded-lg p-2">
                      <div className="min-w-0"><div className="font-medium truncate">{i.name}</div><div className="text-xs text-muted-foreground">{fmtMoney(i.price)} × {i.quantity}</div></div>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="outline" onClick={()=>dec(i.id)}>−</Button>
                        <div className="w-8 text-center">{i.quantity}</div>
                        <Button size="icon" onClick={()=>inc(i.id)}>+</Button>
                        <Button size="icon" variant="ghost" onClick={()=>removeItem(i.id)}>✕</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            <Separator />
            <div className="p-4 space-y-3">
              <div className="flex justify-between font-semibold"><span>Итого</span><span>{fmtMoney(total)}</span></div>
              <div className="flex gap-2">
                <Button className="flex-1" disabled={cart.length===0 || !shiftOpened} onClick={openPayment}>Оплатить</Button>
                <Button className="flex-1" variant="outline" disabled={cart.length===0} onClick={clearCart}>Очистить</Button>
                <Button variant="secondary" onClick={()=>{ setHistoryOpen(true); refreshHistory(); }}>История</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment */}
      <Dialog open={payOpen} onOpenChange={(o)=>{ setPayOpen(o); if(!o) setPayStep("form"); }}>
        <DialogContent className="sm:max-w-md">
          {payStep==='form' ? (
            <>
              <DialogHeader><DialogTitle>Оплата</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label>Способ оплаты</Label>
                  <Select value={payMethod} onValueChange={v=>setPayMethod(v as any)}>
                    <SelectTrigger><SelectValue placeholder="Выберите способ"/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Наличные</SelectItem>
                      <SelectItem value="card">Карта</SelectItem>
                      <SelectItem value="mixed">Смешанный</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2"><Label>Сумма</Label><Input type="number" value={paidAmount} onChange={e=>setPaidAmount(Number(e.target.value||0))}/></div>
                <div className="grid gap-2"><Label>Примечание</Label><Input placeholder="например, сдача, №-5" value={note} onChange={e=>setNote(e.target.value)}/></div>
                <Separator />
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">К оплате</span><span className="font-semibold">{fmtMoney(total)}</span></div>
              </div>
              <DialogFooter className="gap-2"><Button variant="outline" onClick={()=>setPayOpen(false)}>Отмена</Button><Button onClick={submitPayment}>Оплатить</Button></DialogFooter>
            </>
          ) : (
            <div className="py-8 text-center space-y-4">
              <div className="mx-auto h-14 w-14 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-3xl">✓</div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Спасибо за покупку</h3>
                <p className="text-sm text-muted-foreground">Оплата принята. Чек сформирован.</p>
              </div>
              <div className="text-sm text-muted-foreground">К оплате: <span className="font-medium text-foreground">{fmtMoney(total)}</span></div>
              <div><Button size="sm" variant="secondary" onClick={()=>{ setPayOpen(false); setPayStep("form"); }}>Закрыть</Button></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* History */}
      <Dialog open={historyOpen} onOpenChange={o=>setHistoryOpen(o)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>История продаж</DialogTitle></DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm text-muted-foreground">Записей: {history.length}</div>
            <div className="flex items-center gap-2">
              <Select value={String(historyTake)} onValueChange={v=>{ const t=Number(v); setHistoryTake(t); refreshHistory(t); }}>
                <SelectTrigger className="w-[120px]"><SelectValue placeholder="Показывать"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={()=>refreshHistory()}>Обновить</Button>
            </div>
          </div>
          <div className="border rounded-lg">
            <ScrollArea className="h-[420px]">
              {historyLoading? (
                <div className="p-6 text-sm text-muted-foreground">Загрузка…</div>
              ) : history.length===0? (
                <div className="p-6 text-sm text-muted-foreground">Записей пока нет.</div>
              ) : (
                <div className="divide-y">
                  {history.map(row=>{
                    const seller=row.sellerName?.trim()||"-";
                    const grouped=new Map<string,{qty:number;price:number}>();
                    for(const it of (row.items??[])){
                      const name=(it.name||it.nameSnapshot||'').trim();
                      const g=grouped.get(name)||{qty:0,price:it.price};
                      g.qty+=it.qty; g.price=it.price; grouped.set(name,g);
                    }
                    return (
                      <div key={row.id} className="px-4 py-3">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{fmtMoney(row.total)}</div>
                          <div className="text-xs text-muted-foreground">{fmtDateTime(row.createdAt)}</div>
                        </div>
                        <div className="mt-2 space-y-1">
                          {Array.from(grouped.entries()).map(([name,g])=> (
                            <div key={name} className="text-sm flex items-center justify-between">
                              <div className="text-foreground/90">{name} <span className="text-muted-foreground">× {g.qty}</span></div>
                              <div className="text-muted-foreground">{fmtMoney(lineTotal(g.qty,g.price))}</div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground"><span>Продавец: {seller}</span><span>Итого: <span className="text-foreground">{fmtMoney(row.total)}</span></span></div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
          <DialogFooter className="gap-2"><Button variant="outline" onClick={()=>setHistoryOpen(false)}>Закрыть</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Открыть смену */}
      <Dialog open={openShiftDialog} onOpenChange={setOpenShiftDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Открыть смену</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Стартовая наличность</Label>
              <Input type="number" value={cashStart} onChange={e=>setCashStart(Number(e.target.value||0))} placeholder="0"/>
            </div>
          </div>
          <DialogFooter className="gap-2"><Button variant="outline" onClick={()=>setOpenShiftDialog(false)}>Отмена</Button><Button onClick={async()=>{ try{ await openShift(cashStart); setOpenShiftDialog(false); setCashStart(0); await refreshShift(); }catch(e:any){ alert(e?.message||String(e)); } }}>Открыть</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Закрыть смену */}
      <Dialog open={closeShiftDialog} onOpenChange={setCloseShiftDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Закрыть смену</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">Сумма продаж за смену: <span className="text-foreground font-medium">{fmtMoney(shiftTotal)}</span></div>
            <div className="grid gap-2">
              <Label>Фактическая наличность</Label>
              <Input type="number" value={cashEnd} onChange={e=>setCashEnd(Number(e.target.value||0))} placeholder="0"/>
            </div>
          </div>
          <DialogFooter className="gap-2"><Button variant="outline" onClick={()=>setCloseShiftDialog(false)}>Отмена</Button><Button variant="destructive" onClick={async()=>{ try{ await closeShift(cashEnd); setCloseShiftDialog(false); setCashEnd(0); await refreshShift(); await refreshHistory(); setHistoryOpen(true); }catch(e:any){ alert(e?.message||String(e)); } }}>Закрыть</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

