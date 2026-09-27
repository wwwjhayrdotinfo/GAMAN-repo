// Scores the real scan pipeline (src/lib/claude.js analyzeMenu names-first pipeline)
// against the hand-written labels in testset/.
//
//   npm run score:testset                  # dev split (OK to look at and tune on)
//   npm run score:testset -- --split test  # FROZEN split: report numbers only, never tune on it
//   npm run score:testset -- --image kaprow-sanpakoi
//
// Needs network (calls the Supabase function). Resizes photos with macOS `sips` when available.
import { readFileSync, readdirSync, mkdtempSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'vite'

const args = process.argv.slice(2)
const opt = (name, def) => (args.includes(`--${name}`) ? args[args.indexOf(`--${name}`) + 1] : def)
const split = opt('split', 'dev')
const only = opt('image', null)
const dir = new URL(`../testset/${split}/`, import.meta.url).pathname

if (split === 'test') console.log('⚠️  testset/test is FROZEN. Report these numbers; do not change prompts, match rules or the dish list because of them.\n')

// Load the app modules exactly as the browser build uses them.
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const { analyzeMenu } = await vite.ssrLoadModule('/src/lib/claude.js')
const { normalizeThai } = await vite.ssrLoadModule('/src/lib/dishMatch.js')

const tmp = mkdtempSync(join(tmpdir(), 'gaman-score-'))
function loadImage(path) {
  let file = path
  try {
    file = join(tmp, 'scan.jpg')
    execFileSync('sips', ['-Z', '1200', path, '--out', file], { stdio: 'ignore' }) // same size the app sends
  } catch {
    file = path
  }
  return { mediaType: 'image/jpeg', base64: readFileSync(file).toString('base64') }
}

const words = (s = '') => new Set(s.toLowerCase().replace(/\(.*?\)|[^a-z ]/g, ' ').split(/\s+/).filter((w) => w.length > 2))
function similarity(pred, label) {
  const pt = normalizeThai(pred.thai_name || '')
  const lt = normalizeThai(label.thai || '')
  if (pt && lt && pt === lt) return 3
  if (pt && lt && (pt.includes(lt) || lt.includes(pt))) return 2
  const a = words(pred.english_name), b = words(label.english || label.text)
  const overlap = [...a].filter((w) => b.has(w)).length
  return overlap && overlap / Math.min(a.size, b.size) >= 0.5 ? 1 : 0
}

const files = readdirSync(dir).filter((f) => f.endsWith('.labels.json') && (!only || f.startsWith(only)))
const total = { labels: 0, found: 0, thaiLabels: 0, thaiExact: 0, correct: 0, wrong: 0, missed: 0, falseLink: 0, nonDish: 0, extra: 0, secs: [] }

for (const f of files) {
  const label = JSON.parse(readFileSync(join(dir, f), 'utf8'))
  const t0 = Date.now()
  let preds
  try {
    preds = await analyzeMenu({ image: loadImage(join(dir, label.image)),
      onProgress: (message) => console.log(`  ${((Date.now() - t0) / 1000).toFixed(1)}s: ${message}`) })
  } catch (e) {
    console.log(`${label.image}: ERROR ${e.message}`)
    continue
  }
  const secs = (Date.now() - t0) / 1000
  const s = { found: 0, thaiLabels: 0, thaiExact: 0, correct: 0, wrong: 0, missed: 0, falseLink: 0, nonDish: 0, extra: 0 }
  const used = new Set()
  for (const l of label.dishes) {
    let best = -1, bestScore = 0
    preds.forEach((p, i) => {
      const sc = used.has(i) ? 0 : similarity(p, l)
      if (sc > bestScore) (best = i), (bestScore = sc)
    })
    if (best < 0) continue
    used.add(best)
    const p = preds[best]
    s.found++
    if (l.thai) (s.thaiLabels++, bestScore === 3 && s.thaiExact++)
    const ok = [l.expected_library_id, ...(l.also_ok || [])].filter(Boolean)
    if (!p.library_id) l.expected_library_id ? s.missed++ : s.correct++
    else if (ok.includes(p.library_id)) s.correct++
    else l.expected_library_id ? s.wrong++ : s.falseLink++
  }
  preds.forEach((p, i) => {
    if (used.has(i)) return
    if (label.non_dishes?.some((n) => similarity(p, { thai: n.text, english: n.text }) >= 2)) s.nonDish++
    else s.extra++
  })
  const n = label.dishes.length
  console.log(
    `${label.image}: found ${s.found}/${n} (app returns ≤12) | Thai exact ${s.thaiExact}/${s.thaiLabels} | ` +
      `library correct ${s.correct}, wrong ${s.wrong}, missed ${s.missed}, false link ${s.falseLink} | ` +
      `add-ons shown as dishes ${s.nonDish} | unlabelled ${s.extra} | ${secs.toFixed(1)}s`,
  )
  total.labels += n
  for (const k of Object.keys(s)) total[k] += s[k]
  total.secs.push(secs)
}

const pct = (a, b) => (b ? `${Math.round((100 * a) / b)}%` : 'n/a')
const avg = total.secs.length ? total.secs.reduce((a, b) => a + b, 0) / total.secs.length : 0
console.log(
  `\n${split}: ${total.secs.length} photos, ${total.labels} labelled dishes\n` +
    `  dishes found        ${total.found}/${total.labels} (${pct(total.found, total.labels)})\n` +
    `  Thai name exact     ${total.thaiExact}/${total.thaiLabels} (${pct(total.thaiExact, total.thaiLabels)})\n` +
    `  library match       correct ${total.correct}, wrong ${total.wrong}, missed ${total.missed}, false link ${total.falseLink} (${pct(total.correct, total.found)} correct)\n` +
    `  add-ons as dishes   ${total.nonDish}\n` +
    `  avg scan time       ${avg.toFixed(1)}s`,
)
await vite.close()
