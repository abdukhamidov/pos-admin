import { Telegraf, Markup } from 'telegraf'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'

// Локальный инстанс Prisma, чтобы не тянуть TS-модуль @mini/db
const prisma = new PrismaClient()

const envSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_ALLOWED_IDS: z.string().optional(),
  NODE_ENV: z.string().optional(),
})

const parsed = envSchema.safeParse(process.env)
if (!parsed.success) {
  console.error('Missing env:', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

const BOT_TOKEN = parsed.data.TELEGRAM_BOT_TOKEN
const INITIAL_ALLOWED = (parsed.data.TELEGRAM_ALLOWED_IDS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

function formatDayKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tashkent',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

// Seed initial allowed IDs into DB once
async function seedAllowed() {
  for (const tgId of INITIAL_ALLOWED) {
    await prisma.telegramAccess.upsert({
      where: { tgId },
      create: { tgId, isAdmin: true },
      update: {},
    })
  }
}

async function ensureAllowed(tgId, name) {
  const found = await prisma.telegramAccess.findUnique({ where: { tgId: String(tgId) } })
  if (found) return found
  // If present in initial list, auto-create as admin
  if (INITIAL_ALLOWED.includes(String(tgId))) {
    return prisma.telegramAccess.create({ data: { tgId: String(tgId), isAdmin: true, name } })
  }
  return null
}

function mainMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('Сегодня', 'rep_today'), Markup.button.callback('Вчера', 'rep_yesterday')],
    [Markup.button.callback('Открытые смены', 'rep_open_shifts')],
    [Markup.button.callback('Выручка 7 дней', 'rep_rev7')],
    [Markup.button.callback('Админка', 'admin_menu')],
  ])
}

function adminMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('Добавить ID', 'admin_add'), Markup.button.callback('Удалить ID', 'admin_del')],
    [Markup.button.callback('Список', 'admin_list')],
    [Markup.button.callback('Назад', 'back_main')],
  ])
}

const pending = new Map() // chatId -> { mode: 'add'|'del' }

const bot = new Telegraf(BOT_TOKEN)

bot.start(async (ctx) => {
  const user = ctx.from
  const allowed = await ensureAllowed(user.id, `${user.first_name || ''} ${user.last_name || ''}`.trim())
  if (!allowed) return ctx.reply('Доступ запрещён')
  await ctx.reply('Добро пожаловать! Выберите отчёт:', mainMenu())
})

bot.action('back_main', async (ctx) => {
  await ctx.editMessageText('Меню отчётов:', mainMenu())
})

bot.action('rep_today', async (ctx) => reportFor(ctx, 0))
bot.action('rep_yesterday', async (ctx) => reportFor(ctx, -1))

bot.action('rep_open_shifts', async (ctx) => {
  const user = ctx.from
  const allowed = await ensureAllowed(user.id, `${user.first_name || ''} ${user.last_name || ''}`.trim())
  if (!allowed) return ctx.reply('Доступ запрещён')
  const shifts = await prisma.shift.findMany({
    where: { endedAt: null },
    include: { seller: true, branch: true },
    orderBy: { startedAt: 'asc' },
  })
  if (shifts.length === 0) return ctx.reply('Открытых смен нет', mainMenu())
  const lines = shifts.map((s) => `• ${s.branch.name}: ${s.seller.name} (с ${new Date(s.startedAt).toLocaleString('ru-RU')})`)
  await ctx.reply(`Открытые смены:\n${lines.join('\n')}`, mainMenu())
})

bot.action('rep_rev7', async (ctx) => {
  const user = ctx.from
  const allowed = await ensureAllowed(user.id, `${user.first_name || ''} ${user.last_name || ''}`.trim())
  if (!allowed) return ctx.reply('Доступ запрещён')
  const since = new Date(Date.now() - 6 * 24 * 3600 * 1000)
  // days list
  const days = [...Array(7).keys()].map((i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return formatDayKey(d)
  })
  const rows = await prisma.sale.groupBy({
    by: ['day'],
    where: { status: 'COMPLETED', day: { in: days } },
    _sum: { total: true },
  })
  const map = Object.fromEntries(rows.map((r) => [r.day, r._sum.total || 0]))
  const lines = days.map((d) => `${d}: ${Intl.NumberFormat('ru-RU').format(map[d] || 0)} сум`)
  await ctx.reply(`Выручка за 7 дней:\n${lines.join('\n')}`, mainMenu())
})

async function reportFor(ctx, offsetDays) {
  const user = ctx.from
  const allowed = await ensureAllowed(user.id, `${user.first_name || ''} ${user.last_name || ''}`.trim())
  if (!allowed) return ctx.reply('Доступ запрещён')
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  const day = formatDayKey(d)
  const sales = await prisma.sale.findMany({ where: { day, status: 'COMPLETED' }, select: { total: true } })
  const revenue = sales.reduce((s, x) => s + x.total, 0)
  const count = sales.length
  const avg = count ? Math.round(revenue / count) : 0
  await ctx.reply(
    `Отчёт за ${day}:\n• Чеков: ${count}\n• Выручка: ${Intl.NumberFormat('ru-RU').format(revenue)} сум\n• Средний чек: ${Intl.NumberFormat('ru-RU').format(avg)} сум`,
    mainMenu(),
  )
}

// Admin area
bot.action('admin_menu', async (ctx) => {
  const user = ctx.from
  const allowed = await ensureAllowed(user.id, `${user.first_name || ''} ${user.last_name || ''}`.trim())
  if (!allowed?.isAdmin) return ctx.reply('Нет прав администратора')
  await ctx.editMessageText('Админка:', adminMenu())
})

bot.action('admin_list', async (ctx) => {
  const user = ctx.from
  const allowed = await ensureAllowed(user.id, `${user.first_name || ''} ${user.last_name || ''}`.trim())
  if (!allowed?.isAdmin) return ctx.reply('Нет прав администратора')
  const all = await prisma.telegramAccess.findMany({ orderBy: { createdAt: 'desc' } })
  const lines = all.map((x) => `${x.tgId}${x.isAdmin ? ' (admin)' : ''}${x.name ? ' — ' + x.name : ''}`)
  await ctx.reply(lines.length ? lines.join('\n') : 'Список пуст')
})

bot.action('admin_add', async (ctx) => {
  const user = ctx.from
  const allowed = await ensureAllowed(user.id, `${user.first_name || ''} ${user.last_name || ''}`.trim())
  if (!allowed?.isAdmin) return ctx.reply('Нет прав администратора')
  pending.set(ctx.chat.id, { mode: 'add' })
  await ctx.reply('Отправьте числовой Telegram ID для добавления доступа')
})

bot.action('admin_del', async (ctx) => {
  const user = ctx.from
  const allowed = await ensureAllowed(user.id, `${user.first_name || ''} ${user.last_name || ''}`.trim())
  if (!allowed?.isAdmin) return ctx.reply('Нет прав администратора')
  pending.set(ctx.chat.id, { mode: 'del' })
  await ctx.reply('Отправьте числовой Telegram ID для удаления доступа')
})

bot.on('text', async (ctx) => {
  const state = pending.get(ctx.chat.id)
  if (!state) return
  const text = ctx.message.text.trim()
  if (!/^\d+$/.test(text)) return ctx.reply('Ожидается числовой ID')
  const tgId = text
  if (state.mode === 'add') {
    await prisma.telegramAccess.upsert({ where: { tgId }, create: { tgId }, update: {} })
    await ctx.reply(`Добавлен доступ для ${tgId}`)
  } else if (state.mode === 'del') {
    await prisma.telegramAccess.deleteMany({ where: { tgId } })
    await ctx.reply(`Удалён доступ для ${tgId}`)
  }
  pending.delete(ctx.chat.id)
})

async function bootstrap() {
  await seedAllowed()
  await bot.launch()
  console.log('Telegram bot started')
}

bootstrap().catch((e) => {
  console.error(e)
  process.exit(1)
})

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
