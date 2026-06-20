const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { pool, initDb } = require('./db.cjs')

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'konda-secret-2025'

// ── Auth middleware ──────────────────────────────────────────────
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch { res.status(401).json({ error: 'Invalid token' }) }
}

// ── Auth ─────────────────────────────────────────────────────────

router.post('/auth/signup', async (req, res) => {
  const { email, password, name } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
  try {
    const hash = await bcrypt.hash(password, 10)
    const { rows } = await pool.query(
      'INSERT INTO users (email, password_hash, name, verified) VALUES ($1, $2, $3, true) RETURNING id, email, name, created_at',
      [email.toLowerCase().trim(), hash, name?.trim() || null]
    )
    const user = rows[0]
    await pool.query('INSERT INTO balances (user_id, krw, usd) VALUES ($1, 0, 0)', [user.id])
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' })
    res.json({ token, user: { id: user.id, email: user.email } })
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: '이미 가입된 이메일입니다.' })
    res.status(500).json({ error: e.message })
  }
})

router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()])
    if (!rows.length) return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' })
    const user = rows[0]
    const ok = await bcrypt.compare(password, user.password_hash)
    if (!ok) return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' })
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' })
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.post('/auth/find-email', async (req, res) => {
  const { name } = req.body
  if (!name) return res.status(400).json({ error: '이름을 입력해주세요.' })
  try {
    const { rows } = await pool.query('SELECT email FROM users WHERE name = $1', [name.trim()])
    if (!rows.length) return res.status(404).json({ error: '해당 이름으로 가입된 계정이 없습니다.' })
    const email = rows[0].email
    const [local, domain] = email.split('@')
    const masked = local.slice(0, 2) + '*'.repeat(Math.max(local.length - 2, 1)) + '@' + domain
    res.json({ maskedEmail: masked })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.post('/auth/reset-password', async (req, res) => {
  const { email, newPassword } = req.body
  if (!email || !newPassword) return res.status(400).json({ error: '이메일과 새 비밀번호를 입력해주세요.' })
  try {
    const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()])
    if (!rows.length) return res.status(404).json({ error: '가입되지 않은 이메일입니다.' })
    const hash = await bcrypt.hash(newPassword, 10)
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, rows[0].id])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.post('/auth/change-password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword) return res.status(400).json({ error: '현재 비밀번호와 새 비밀번호를 입력해주세요.' })
  if (newPassword.length < 6) return res.status(400).json({ error: '새 비밀번호는 6자 이상이어야 합니다.' })
  try {
    const { rows } = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id])
    if (!rows.length) return res.status(404).json({ error: 'User not found' })
    const ok = await bcrypt.compare(currentPassword, rows[0].password_hash)
    if (!ok) return res.status(401).json({ error: '현재 비밀번호가 올바르지 않습니다.' })
    const hash = await bcrypt.hash(newPassword, 10)
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.id])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── User profile ─────────────────────────────────────────────────

router.get('/user/me', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT u.id, u.email, u.name, u.created_at, b.krw, b.usd FROM users u LEFT JOIN balances b ON u.id = b.user_id WHERE u.id = $1',
      [req.user.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'User not found' })
    res.json(rows[0])
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.patch('/user/me', auth, async (req, res) => {
  const { name } = req.body
  try {
    const { rows } = await pool.query(
      'UPDATE users SET name = $1 WHERE id = $2 RETURNING id, email, name',
      [name, req.user.id]
    )
    res.json(rows[0])
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── User Settings ─────────────────────────────────────────────────

router.get('/user/settings', auth, async (req, res) => {
  try {
    await pool.query(
      'INSERT INTO user_settings (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING',
      [req.user.id]
    )
    const { rows } = await pool.query('SELECT * FROM user_settings WHERE user_id = $1', [req.user.id])
    res.json(rows[0] || { language: 'ko', push_payment: true, push_promo: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.patch('/user/settings', auth, async (req, res) => {
  const { language, push_payment, push_promo } = req.body
  try {
    await pool.query(
      `INSERT INTO user_settings (user_id, language, push_payment, push_promo)
       VALUES ($1, COALESCE($2,'ko'), COALESCE($3,true), COALESCE($4,true))
       ON CONFLICT (user_id) DO UPDATE SET
         language = COALESCE($2, user_settings.language),
         push_payment = COALESCE($3, user_settings.push_payment),
         push_promo = COALESCE($4, user_settings.push_promo),
         updated_at = NOW()`,
      [req.user.id, language ?? null, push_payment ?? null, push_promo ?? null]
    )
    const { rows } = await pool.query('SELECT * FROM user_settings WHERE user_id = $1', [req.user.id])
    res.json(rows[0])
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Cards ─────────────────────────────────────────────────────────

router.get('/cards', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM cards WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    )
    res.json(rows)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.post('/cards/apply', auth, async (req, res) => {
  const { card_type = 'standard', color = 'black' } = req.body
  try {
    const { rows } = await pool.query(
      'INSERT INTO card_applications (user_id, card_type, color, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, card_type, color, 'pending']
    )
    const { rows: prevApps } = await pool.query(
      'SELECT COUNT(*) as cnt FROM card_applications WHERE user_id = $1',
      [req.user.id]
    )
    if (parseInt(prevApps[0].cnt) === 1) {
      try { await addAcorns(req.user.id, 1250, 'mission_reward', '카드 등록하기') } catch(_) {}
    }
    res.json(rows[0])
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.get('/cards/applications', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM card_applications WHERE user_id = $1 ORDER BY submitted_at DESC',
      [req.user.id]
    )
    res.json(rows)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST /api/cards/request — PIN change, delivery, limit increase
router.post('/cards/request', auth, async (req, res) => {
  const { type, details } = req.body
  const validTypes = ['pin_change', 'delivery', 'limit_increase']
  if (!validTypes.includes(type)) return res.status(400).json({ error: '유효하지 않은 요청 유형입니다.' })
  try {
    const { rows } = await pool.query(
      'INSERT INTO card_requests (user_id, type, details, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, type, JSON.stringify(details || {}), 'pending']
    )
    const labels = { pin_change: 'PIN 변경', delivery: '카드 배송', limit_increase: '한도 증액' }
    await createNotification(req.user.id, `${labels[type]} 신청 완료`, '담당자 확인 후 3-5영업일 내 처리해드려요.', 'card')
    res.json({ ok: true, request: rows[0] })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// GET /api/cards/requests
router.get('/cards/requests', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM card_requests WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    )
    res.json(rows)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Balance ───────────────────────────────────────────────────────

router.get('/balance', auth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT krw, usd FROM balances WHERE user_id = $1', [req.user.id])
    res.json(rows[0] || { krw: 0, usd: 0 })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.post('/balance/topup', auth, async (req, res) => {
  const { amount, currency = 'KRW' } = req.body
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' })
  try {
    let balance
    if (currency === 'KRW') {
      const { rows } = await pool.query(
        'UPDATE balances SET krw = krw + $1, updated_at = NOW() WHERE user_id = $2 RETURNING krw, usd',
        [amount, req.user.id]
      )
      balance = rows[0]
    } else {
      const { rows } = await pool.query(
        'UPDATE balances SET usd = usd + $1, updated_at = NOW() WHERE user_id = $2 RETURNING krw, usd',
        [amount, req.user.id]
      )
      balance = rows[0]
    }
    await pool.query(
      'INSERT INTO transactions (user_id, type, amount, currency, description) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, 'topup', amount, currency, `${currency} 충전`]
    )
    res.json(balance)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Transactions ──────────────────────────────────────────────────

router.get('/transactions', auth, async (req, res) => {
  const limit = parseInt(req.query.limit) || 50
  try {
    const { rows } = await pool.query(
      'SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
      [req.user.id, limit]
    )
    res.json(rows)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Transfers (송금) ───────────────────────────────────────────────

router.post('/transfers', auth, async (req, res) => {
  const { email, amount, note } = req.body
  if (!email || !amount || amount <= 0) return res.status(400).json({ error: '받는 사람 이메일과 금액을 입력해주세요.' })
  if (req.user.email === email.toLowerCase().trim()) return res.status(400).json({ error: '자신에게는 송금할 수 없어요.' })
  try {
    const { rows: receiver } = await pool.query('SELECT id, name, email FROM users WHERE email = $1', [email.toLowerCase().trim()])
    if (!receiver.length) return res.status(404).json({ error: '해당 이메일로 가입된 사용자가 없어요.' })

    const { rows: senderBal } = await pool.query('SELECT krw FROM balances WHERE user_id = $1', [req.user.id])
    if ((senderBal[0]?.krw ?? 0) < amount) return res.status(400).json({ error: '잔액이 부족해요.' })

    const receiverId = receiver[0].id
    const receiverName = receiver[0].name || receiver[0].email

    await pool.query('UPDATE balances SET krw = krw - $1, updated_at = NOW() WHERE user_id = $2', [amount, req.user.id])
    await pool.query(
      'INSERT INTO balances (user_id, krw, usd) VALUES ($1, $2, 0) ON CONFLICT (user_id) DO UPDATE SET krw = balances.krw + $2, updated_at = NOW()',
      [receiverId, amount]
    )
    await pool.query(
      'INSERT INTO money_transfers (sender_id, receiver_id, amount, currency, note) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, receiverId, amount, 'KRW', note || null]
    )
    await pool.query(
      'INSERT INTO transactions (user_id, type, amount, currency, description) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, 'transfer_out', amount, 'KRW', `${receiverName}에게 송금`]
    )
    await pool.query(
      'INSERT INTO transactions (user_id, type, amount, currency, description) VALUES ($1, $2, $3, $4, $5)',
      [receiverId, 'transfer_in', amount, 'KRW', `콘다 사용자에게 받음`]
    )
    await createNotification(receiverId, '💰 송금 받았어요', `${amount.toLocaleString()}원이 도착했어요.`, 'transfer')

    const { rows: newBal } = await pool.query('SELECT krw, usd FROM balances WHERE user_id = $1', [req.user.id])
    res.json({ ok: true, balance: newBal[0] })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// GET /api/transfers
router.get('/transfers', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT t.*,
        s.name as sender_name, s.email as sender_email,
        r.name as receiver_name, r.email as receiver_email
       FROM money_transfers t
       JOIN users s ON t.sender_id = s.id
       JOIN users r ON t.receiver_id = r.id
       WHERE t.sender_id = $1 OR t.receiver_id = $1
       ORDER BY t.created_at DESC LIMIT 50`,
      [req.user.id]
    )
    res.json(rows)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Acorns (도토리) ───────────────────────────────────────────────

async function ensureAcorns(userId) {
  await pool.query(
    'INSERT INTO acorns (user_id, balance) VALUES ($1, 0) ON CONFLICT (user_id) DO NOTHING',
    [userId]
  )
}

async function addAcorns(userId, amount, type, description) {
  await ensureAcorns(userId)
  await pool.query(
    'UPDATE acorns SET balance = balance + $1, updated_at = NOW() WHERE user_id = $2',
    [amount, userId]
  )
  await pool.query(
    'INSERT INTO acorn_transactions (user_id, type, amount, description) VALUES ($1, $2, $3, $4)',
    [userId, type, amount, description]
  )
}

async function spendAcorns(userId, amount, type, description) {
  await ensureAcorns(userId)
  const { rows } = await pool.query('SELECT balance FROM acorns WHERE user_id = $1', [userId])
  const balance = rows[0]?.balance ?? 0
  if (balance < amount) throw new Error('도토리가 부족해요.')
  await pool.query(
    'UPDATE acorns SET balance = balance - $1, updated_at = NOW() WHERE user_id = $2',
    [amount, userId]
  )
  await pool.query(
    'INSERT INTO acorn_transactions (user_id, type, amount, description) VALUES ($1, $2, $3, $4)',
    [userId, type, -amount, description]
  )
}

router.get('/acorns', auth, async (req, res) => {
  try {
    await ensureAcorns(req.user.id)
    const { rows } = await pool.query('SELECT balance FROM acorns WHERE user_id = $1', [req.user.id])
    res.json({ balance: rows[0]?.balance ?? 0 })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.get('/acorns/history', auth, async (req, res) => {
  const limit = parseInt(req.query.limit) || 50
  try {
    const { rows } = await pool.query(
      'SELECT * FROM acorn_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
      [req.user.id, limit]
    )
    res.json(rows)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Missions ──────────────────────────────────────────────────────

const MISSION_DEFS = [
  { id: 'checkin', title: '출석체크', reward: 30, daily: true, once: false },
  { id: 'steps', title: '하루에 만 보 걷기', reward: 100, daily: true, once: false },
  { id: 'pay_100k', title: '10만 KRW 결제하기', reward: 2500, daily: false, once: false },
  { id: 'pay_200k', title: '20만 KRW 결제하기', reward: 5000, daily: false, once: false },
  { id: 'review', title: '리뷰 쓰기', reward: 150, daily: false, once: false },
  { id: 'card_register', title: '카드 등록하기', reward: 1250, daily: false, once: true },
]

router.get('/missions', auth, async (req, res) => {
  try {
    const { rows: progress } = await pool.query(
      'SELECT mission_id, last_claimed_at, total_claimed FROM mission_progress WHERE user_id = $1',
      [req.user.id]
    )
    const progressMap = {}
    progress.forEach(p => { progressMap[p.mission_id] = p })

    const today = new Date(); today.setHours(0, 0, 0, 0)

    const missions = MISSION_DEFS.map(m => {
      const p = progressMap[m.id]
      const lastClaimed = p?.last_claimed_at ? new Date(p.last_claimed_at) : null
      const claimedToday = lastClaimed && lastClaimed >= today
      const claimedOnce = p?.total_claimed > 0
      const canClaim = m.daily ? !claimedToday : (m.once ? !claimedOnce : true)
      return { ...m, canClaim, lastClaimedAt: lastClaimed, totalClaimed: p?.total_claimed ?? 0 }
    })
    res.json(missions)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.post('/missions/:id/claim', auth, async (req, res) => {
  const missionId = req.params.id
  const mission = MISSION_DEFS.find(m => m.id === missionId)
  if (!mission) return res.status(404).json({ error: '미션을 찾을 수 없습니다.' })

  try {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const { rows: progress } = await pool.query(
      'SELECT last_claimed_at, total_claimed FROM mission_progress WHERE user_id = $1 AND mission_id = $2',
      [req.user.id, missionId]
    )
    const p = progress[0]
    const lastClaimed = p?.last_claimed_at ? new Date(p.last_claimed_at) : null
    const claimedToday = lastClaimed && lastClaimed >= today
    const claimedOnce = p?.total_claimed > 0

    if (mission.daily && claimedToday) return res.status(400).json({ error: '오늘 이미 받은 미션이에요.' })
    if (mission.once && claimedOnce) return res.status(400).json({ error: '이미 받은 미션이에요.' })

    await pool.query(
      `INSERT INTO mission_progress (user_id, mission_id, last_claimed_at, total_claimed)
       VALUES ($1, $2, NOW(), 1)
       ON CONFLICT (user_id, mission_id)
       DO UPDATE SET last_claimed_at = NOW(), total_claimed = mission_progress.total_claimed + 1`,
      [req.user.id, missionId]
    )
    await addAcorns(req.user.id, mission.reward, 'mission_reward', mission.title)
    const { rows } = await pool.query('SELECT balance FROM acorns WHERE user_id = $1', [req.user.id])
    res.json({ ok: true, reward: mission.reward, balance: rows[0]?.balance ?? 0 })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Roulette ──────────────────────────────────────────────────────

const ROULETTE_PRIZES = {
  snack: [
    { brand: 'GS25', name: '빙그레 바나나맛 우유', emoji: '🥛' },
    { brand: 'CU', name: '삼양불닭볶음면(대컵)', emoji: '🍜' },
  ],
  ramen: [
    { brand: 'GS25', name: '불닭볶음면', emoji: '🍜' },
    { brand: 'CU', name: '신라면', emoji: '🍜' },
  ],
  drink: [
    { brand: 'GS25', name: '바나나우유', emoji: '🥛' },
    { brand: 'CU', name: '초코우유', emoji: '🍫' },
  ],
  icecream: [
    { brand: 'GS25', name: '월드콘', emoji: '🍦' },
    { brand: 'CU', name: '빵빠레', emoji: '🍦' },
  ],
  chips: [
    { brand: 'GS25', name: '새우깡', emoji: '🍘' },
    { brand: 'CU', name: '포카칩', emoji: '🥔' },
  ],
  burger: [
    { brand: '맥도날드', name: '빅맥', emoji: '🍔' },
    { brand: '버거킹', name: '와퍼', emoji: '🍔' },
  ],
  pizza: [
    { brand: '피자헛', name: '슈프림 피자', emoji: '🍕' },
    { brand: '도미노', name: '콰트로', emoji: '🍕' },
  ],
  chicken: [
    { brand: '교촌', name: '허니콤보', emoji: '🍗' },
    { brand: 'BBQ', name: '황금올리브', emoji: '🍗' },
  ],
}

const CATEGORY_COSTS = {
  snack: 600, ramen: 700, drink: 850, icecream: 1000,
  chips: 1250, burger: 2200, pizza: 11500, chicken: 12000,
}

router.post('/roulette/spin', auth, async (req, res) => {
  const { category } = req.body
  const cost = CATEGORY_COSTS[category]
  if (!cost) return res.status(400).json({ error: '유효하지 않은 카테고리입니다.' })
  const prizes = ROULETTE_PRIZES[category]

  try {
    await spendAcorns(req.user.id, cost, 'roulette_spin', `${category} 룰렛 돌리기`)
    const prize = prizes[Math.floor(Math.random() * prizes.length)]
    const barcode = String(Math.floor(1000000000000 + Math.random() * 9000000000000))
    const expiry = new Date(); expiry.setDate(expiry.getDate() + 30)

    const { rows } = await pool.query(
      'INSERT INTO vouchers (user_id, brand, name, barcode, category, expiry_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.user.id, prize.brand, prize.name, barcode, category, expiry]
    )
    const { rows: acornRows } = await pool.query('SELECT balance FROM acorns WHERE user_id = $1', [req.user.id])
    res.json({ prize: { ...prize, barcode }, voucher: rows[0], acornBalance: acornRows[0]?.balance ?? 0 })
  } catch (e) { res.status(400).json({ error: e.message }) }
})

// ── Vouchers ──────────────────────────────────────────────────────

router.get('/vouchers', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM vouchers WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    )
    res.json(rows)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.patch('/vouchers/:id/use', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE vouchers SET used_at = NOW() WHERE id = $1 AND user_id = $2 AND used_at IS NULL RETURNING *',
      [req.params.id, req.user.id]
    )
    if (!rows.length) return res.status(404).json({ error: '바우처를 찾을 수 없거나 이미 사용됐습니다.' })
    res.json(rows[0])
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Reviews ───────────────────────────────────────────────────────

router.post('/reviews', auth, async (req, res) => {
  const { type = 'text', content, rating, place_id, article_id, place_name, keywords } = req.body
  if (!content) return res.status(400).json({ error: '리뷰 내용을 입력해주세요.' })
  try {
    const { rows } = await pool.query(
      `INSERT INTO reviews (user_id, type, content, rating, place_id, article_id, place_name, keywords)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.user.id, type, content, rating ?? null, place_id ?? null, article_id ?? null, place_name ?? null, keywords ?? null]
    )
    const reward = type === 'photo' ? 250 : 125
    await addAcorns(req.user.id, reward, 'review_reward', `${type === 'photo' ? '포토' : '텍스트'} 리뷰 작성`)
    const { rows: acornRows } = await pool.query('SELECT balance FROM acorns WHERE user_id = $1', [req.user.id])
    res.json({ review: rows[0], reward, acornBalance: acornRows[0]?.balance ?? 0 })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// GET /api/reviews?place_id=&article_id=
router.get('/reviews', auth, async (req, res) => {
  const { place_id, article_id, limit = 20 } = req.query
  try {
    let query = `SELECT r.*, u.name as user_name, u.email as user_email FROM reviews r JOIN users u ON r.user_id = u.id WHERE 1=1`
    const params = []
    if (place_id) { params.push(place_id); query += ` AND r.place_id = $${params.length}` }
    if (article_id) { params.push(article_id); query += ` AND r.article_id = $${params.length}` }
    params.push(limit); query += ` ORDER BY r.created_at DESC LIMIT $${params.length}`
    const { rows } = await pool.query(query, params)
    res.json(rows)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST /api/reviews/:id/helpful
router.post('/reviews/:id/helpful', auth, async (req, res) => {
  const reviewId = parseInt(req.params.id)
  try {
    const { rows: existing } = await pool.query(
      'SELECT 1 FROM review_helpful WHERE user_id = $1 AND review_id = $2',
      [req.user.id, reviewId]
    )
    if (existing.length) {
      await pool.query('DELETE FROM review_helpful WHERE user_id = $1 AND review_id = $2', [req.user.id, reviewId])
      await pool.query('UPDATE reviews SET helpful_count = helpful_count - 1 WHERE id = $1', [reviewId])
      res.json({ helpful: false })
    } else {
      await pool.query('INSERT INTO review_helpful (user_id, review_id) VALUES ($1, $2)', [req.user.id, reviewId])
      await pool.query('UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = $1', [reviewId])
      res.json({ helpful: true })
    }
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Notifications ─────────────────────────────────────────────────

async function createNotification(userId, title, body, type = 'general') {
  try {
    await pool.query(
      'INSERT INTO notifications (user_id, title, body, type) VALUES ($1, $2, $3, $4)',
      [userId, title, body, type]
    )
  } catch (_) {}
}

router.get('/notifications', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    )
    res.json(rows)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.patch('/notifications/read-all', auth, async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL',
      [req.user.id]
    )
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── KYC ──────────────────────────────────────────────────────────

router.post('/kyc/submit', auth, async (req, res) => {
  const { passport_number, full_name, birth_date, gender } = req.body
  if (!passport_number || !full_name) return res.status(400).json({ error: '여권번호와 이름을 입력해주세요.' })
  try {
    const { rows } = await pool.query(
      `INSERT INTO kyc_submissions (user_id, passport_number, full_name, birth_date, gender, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       ON CONFLICT (user_id) DO UPDATE SET
         passport_number = EXCLUDED.passport_number,
         full_name = EXCLUDED.full_name,
         birth_date = EXCLUDED.birth_date,
         gender = EXCLUDED.gender,
         status = 'pending',
         submitted_at = NOW()
       RETURNING *`,
      [req.user.id, passport_number, full_name, birth_date || null, gender || null]
    )
    await pool.query(
      `UPDATE card_applications SET status = 'ready' WHERE user_id = $1 AND status = 'pending'`,
      [req.user.id]
    )
    await createNotification(req.user.id, '✅ KYC 인증 완료', '카드가 곧 발급돼요!', 'kyc')
    res.json(rows[0])
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.get('/kyc/status', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT status, submitted_at, full_name FROM kyc_submissions WHERE user_id = $1',
      [req.user.id]
    )
    res.json(rows[0] || { status: null })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Transit ──────────────────────────────────────────────────────

async function ensureTransitCard(userId) {
  await pool.query(
    'INSERT INTO transit_cards (user_id, balance) VALUES ($1, 0) ON CONFLICT (user_id) DO NOTHING',
    [userId]
  )
}

router.get('/transit/balance', auth, async (req, res) => {
  try {
    await ensureTransitCard(req.user.id)
    const { rows } = await pool.query('SELECT balance, last_used_at, updated_at FROM transit_cards WHERE user_id = $1', [req.user.id])
    res.json(rows[0] || { balance: 0, last_used_at: null })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.post('/transit/recharge', auth, async (req, res) => {
  const { amount } = req.body
  if (!amount || amount < 1000) return res.status(400).json({ error: '최소 1,000원 이상 충전해주세요.' })
  if (amount > 100000) return res.status(400).json({ error: '한 번에 최대 100,000원까지 충전 가능합니다.' })
  try {
    const { rows: bal } = await pool.query('SELECT krw FROM balances WHERE user_id = $1', [req.user.id])
    const krw = bal[0]?.krw ?? 0
    if (krw < amount) return res.status(400).json({ error: '콘다카드 잔액이 부족합니다.' })

    const { rows } = await pool.query(
      'UPDATE balances SET krw = krw - $1, updated_at = NOW() WHERE user_id = $2 RETURNING krw, usd',
      [amount, req.user.id]
    )
    await ensureTransitCard(req.user.id)
    const { rows: transitRows } = await pool.query(
      'UPDATE transit_cards SET balance = balance + $1, updated_at = NOW() WHERE user_id = $2 RETURNING balance',
      [amount, req.user.id]
    )
    await pool.query(
      'INSERT INTO transactions (user_id, type, amount, currency, description) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, 'transit_recharge', amount, 'KRW', `교통카드 충전 ${amount.toLocaleString()}원`]
    )
    res.json({ ok: true, balance: rows[0], transitBalance: transitRows[0]?.balance ?? 0 })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Support ───────────────────────────────────────────────────────

router.post('/support', auth, async (req, res) => {
  const { subject, body, category = 'general' } = req.body
  if (!subject) return res.status(400).json({ error: '문의 제목을 입력해주세요.' })
  try {
    const { rows } = await pool.query(
      'INSERT INTO support_tickets (user_id, subject, body, category) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, subject, body || '', category]
    )
    await createNotification(req.user.id, '📬 문의가 접수됐어요', '영업일 기준 1-3일 내 답변 드릴게요.', 'support')
    res.json({ ok: true, ticket: rows[0] })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.get('/support', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM support_tickets WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    )
    res.json(rows)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Places ───────────────────────────────────────────────────────

router.get('/places', async (req, res) => {
  const { city, category, limit = 30 } = req.query
  try {
    let query = 'SELECT * FROM places WHERE 1=1'
    const params = []
    if (city) { params.push(city); query += ` AND city = $${params.length}` }
    if (category) { params.push(category); query += ` AND category = $${params.length}` }
    params.push(limit); query += ` ORDER BY review_count DESC LIMIT $${params.length}`
    const { rows } = await pool.query(query, params)
    res.json(rows)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.get('/places/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM places WHERE id = $1', [req.params.id])
    if (!rows.length) return res.status(404).json({ error: '장소를 찾을 수 없어요.' })
    res.json(rows[0])
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Articles ──────────────────────────────────────────────────────

router.get('/articles', async (req, res) => {
  const { category, limit = 20 } = req.query
  try {
    let query = 'SELECT id, category, title, subtitle, description, bg_style, is_place, rating, review_count, created_at FROM articles WHERE 1=1'
    const params = []
    if (category && category !== 'All') { params.push(category); query += ` AND category = $${params.length}` }
    params.push(limit); query += ` ORDER BY created_at DESC LIMIT $${params.length}`
    const { rows } = await pool.query(query, params)
    res.json(rows)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.get('/articles/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM articles WHERE id = $1', [req.params.id])
    if (!rows.length) return res.status(404).json({ error: '아티클을 찾을 수 없어요.' })
    res.json(rows[0])
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── ATM ──────────────────────────────────────────────────────────

router.get('/atm', async (req, res) => {
  const { city } = req.query
  try {
    let query = 'SELECT * FROM atm_locations WHERE 1=1'
    const params = []
    if (city) { params.push(city); query += ` AND city = $${params.length}` }
    query += ' ORDER BY bank ASC'
    const { rows } = await pool.query(query, params)
    res.json(rows)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

module.exports = { router, initDb }
