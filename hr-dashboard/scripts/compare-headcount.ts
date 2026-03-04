/**
 * Compare employee headcount: screenshot list vs app API.
 * Run with: npx tsx scripts/compare-headcount.ts
 * Ensure the app is running (npm run dev) and set BASE_URL if needed.
 *
 * Usage: BASE_URL=http://localhost:3000 npx tsx scripts/compare-headcount.ts
 */

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'

// Names from the screenshot (employee headcount list), in order as shown.
const SCREENSHOT_NAMES = [
  'Pansuk Taimasong',
  'Shane Rengayen',
  'Abdul Karim',
  'Dante Litzanberg',
  'Gwen MacFarland',
  'Gregorio Gregory',
  'Moead Khaliq',
  'Khalil Ramirez',
  'Samantha Sanchez',
  'Shazreen Liaquat',
  'Shayan Alimou',
  'Habeeba Hammoud',
  'Anna Karini',
  'Khawana Singh',
  'Marius Manasala',
  'Carolina A.',
  'Ashley Owens',
  'Jenny Punoy',
  'Maria Paula Len',
  'Mariana Morales',
  'Donovan Doria',
  'Bailey Kepper',
  'Graham M.',
  'Shantalle McGregor',
  'Steven Ulloa',
  'Jacob Kunchum',
  'Gabriela B.',
  'Issac Mangal',
  'Pamela Gordon',
  'Irena Mohammed',
  'Eva Rose',
  'Allan Jose',
  'Arlene Mariano',
  'R. Jose Murphy',
  'Richard Bayley',
  'Eliza Rose',
  'Nuno R.',
  'Selina Paten',
  'Kimberly K.',
  'Angela Pui',
  'Lynnne Mohammed',
  'Freshea Phipps',
  'Tobias W.',
  'Royce Winey',
  'Kailash Robertson',
  'Melinda C.',
  'John Chadwick',
  'Darren Fitzgerald',
  'Teresa Q.',
  'Gregory O.',
  'Mohamed K.',
  'Stephanie Rose',
  'Trevon T.',
  'Jason P.',
  'Dianna P.',
  'Bonnie R.',
  'Sheran B.',
  'Ryan H.',
  'Mohamed M.',
  'Annaliza C.',
  'Maria C.',
  'Noor H.',
  'Jennifer A.',
  'Shianne D.',
  'Naim B.',
  'Surenthra M.',
  'Andrew C.',
  'Michael A.',
  'Amari L.',
  'Yvonne M.',
  'Mohamed E.',
  'Melissa R.',
  'Diana C.',
  'Rehab D.',
  'Gabriel F.',
  'Fouad K.',
  'Ayesha A.',
  'Amanda M.',
  'Umar R.',
  'Chethanya M.',
  'Kasthuri G.',
  'Tabassum K.',
  'Zhanira L.',
  'T. Bill Y.',
  'Stephanie G.',
  'Christina R.',
  'Jihad A.',
  'Hirunaya K.',
  'Emmanuelle F.',
  'Paul B.',
  'Paul R.',
  'Kevin C.',
  'Foad R.',
  'Rebuka B.',
  'Samantha L.',
  'Robert M.',
  'Piers M.',
  'Judea M.',
  'Amari A.',
  'Abdullah K.',
  'Mona C.',
  'Shaliza M.',
  'David B.',
  'Sheila C.',
  'Bryan D.',
  'Jude J.',
  'Amare A.',
  'Leanne P.',
  'Neal B.',
  'Nadia A.',
  'Jessica L.',
  'Mary A.',
  'Jumail M.',
  'Ava D.',
  'Jason C.',
  'Justin K.',
  'Adam L.',
  'Caroline P.',
  'Viviana N.',
  'Bengio D.',
  'Shani C.',
  'Brendan E.',
  'Miguel M.',
  'Ruby C.',
  'Shayne O.',
  'David S.',
  'William W.',
  'Rogers H.',
  'Zahara N.',
  'Angus M.',
  'Elton E.',
  'Nicole K.',
  'Karen L.',
  'Bryan J.',
  'Peyton R.',
  'Sandra M.',
  'Muhammad Z.',
  'Luick D.',
  'Rohan P.',
  'Lina R.',
  'Dean H.',
  'Anna P.',
  'Peter R.',
  'Corbin K.',
  'Tracey F.',
  'Don S.',
  'Kathleen S.',
  'Daniel D.',
  'Gunnard R.',
  'Kishan B.',
  'Manuel C.',
  'Robert J.',
  'Finola P.',
  'Safia A.',
  'Devin S.',
  'Andrea J.',
  'Cyril L.',
  'Graciela I.',
  'Rakesh P.',
  'Sonia Z.',
  'Roger L.',
  'Lynn D.',
  'Alima N.',
  'Melissa P.',
  'Riana J.',
  'Alvin J.',
  'Garett H.',
  'Kimberly L.',
  'Leilanie L.',
  'Candace H.',
  'Leandro P.',
  'Myles R.',
  'Ramon C.',
  'Devon S.',
  'Ramin T.',
  'Christopher D.',
  'Michael R.',
  'Ahmad S.',
  'Thomas P.',
  'Ruben T.',
  'King F.',
  'Helen M.',
  'Phumelela M.',
  'Tyreisha B.',
  'Timika R.',
  'Briana B.',
  'Sabrin B.',
  'Rebekah C.',
  'Randolph C.',
  'Ronald C.',
  'Tamara D.',
  'Jesse O.',
  'Alexandra M.',
  'Cherie D.',
  'Phanita Q.',
  'Samantha C.',
  'Fouad I.',
  'Riana F.',
  'Julian L.',
  'Christian A.',
  'Jena D.',
  'Melissa P.',
  'Jana V.',
  'Shane W.',
  'Jared R.',
  'Marc R.',
  'Melissa C.',
  'Andrew C.',
  'Mariane D.',
  'Florance H.',
  'Jose M.',
  'Gabriel M.',
  'Ariana C.',
  'Amanda D.',
  'Kimberly A.',
  'Paula F.',
  'Kristi M.',
  'Megan G.',
  'Tobin A.',
  'Michelle A.',
  'Sherry-Ann D.',
  'Dayjah R.',
  'Clinton B.',
  'Flavia D.',
  'Adriana T.',
  'Brandhi C.',
  'Russell K.',
  'Tinna-Marie S.',
  'Kandra C.',
  'Reynaldo R.',
  'Celine R.',
  'Theresa H.',
  'Naomi C.',
  'Steven J.',
  'Bianca H.',
  'Tracy C.',
  'Tamara R.',
  'Emmie C.',
  'Melissa H.',
  'Ormadai F.',
  'Chasity D.',
  'Denice P.',
  'Simone R.',
  'Adrianna M.',
  'Michelle P.',
  'Leah B.',
  'Genevieve M.',
  'Darnell M.',
  'Theresa D.',
  'James D.',
  'Sheldon C.',
  'Darcy R.',
  'Yindee S.',
  'Xue B.',
  'Shaun C.',
  'Blake P.',
  'Melinda O.',
  'Adrian S.',
  'Neal U.',
  'Candice Z.',
  'Diane F.'
]

function norm(s: string): string {
  return s
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ')
}

function normForMatch(s: string): string {
  return norm(s).replace(/[^A-Z0-9\s]/g, '')
}

/** Check if app name could match screenshot name (exact or first name + last initial). */
function couldMatch(screenshotName: string, appName: string): boolean {
  const s = normForMatch(screenshotName)
  const a = normForMatch(appName)
  if (s === a) return true
  const sParts = s.split(/\s+/).filter(Boolean)
  const aParts = a.split(/\s+/).filter(Boolean)
  if (sParts.length === 0 || aParts.length === 0) return false
  const firstMatch = sParts[0] === aParts[0]
  if (!firstMatch) return false
  if (sParts.length === 1) return true
  const sLast = sParts[sParts.length - 1] ?? ''
  const aLast = aParts[aParts.length - 1] ?? ''
  return sLast.length <= 2 || aLast.startsWith(sLast) || sLast.startsWith(aLast)
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} ${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

async function main() {
  console.log('Comparing screenshot headcount list to app employee API.')
  console.log('Base URL:', BASE_URL)
  console.log('')

  type Employee = { name: string; employeeKey?: string; employeeStatus?: string }
  let active: Employee[] = []
  let all: Employee[] = []

  try {
    active = await fetchJson<Employee[]>(`${BASE_URL}/api/odoo/employees`)
    all = await fetchJson<Employee[]>(`${BASE_URL}/api/odoo/employees?includeInactive=true`)
  } catch (e) {
    console.error('Failed to fetch employees. Is the app running (npm run dev)?', e)
    process.exit(1)
  }

  const screenshotSet = new Set(SCREENSHOT_NAMES.map(norm))
  const activeNames = active.map((e) => e.name)
  const allNames = all.map((e) => e.name)
  const activeNorm = new Set(activeNames.map(norm))
  const allNorm = new Set(allNames.map(norm))

  console.log('--- Counts ---')
  console.log('Screenshot list:', SCREENSHOT_NAMES.length)
  console.log('App (active only):', active.length)
  console.log('App (including inactive):', all.length)
  console.log('')

  const inScreenshotNotInApp: string[] = []
  for (const name of SCREENSHOT_NAMES) {
    const n = norm(name)
    if (allNorm.has(n)) continue
    const matched = allNames.some((appName) => couldMatch(name, appName))
    if (!matched) inScreenshotNotInApp.push(name)
  }

  const inAppNotInScreenshot: string[] = []
  for (const name of allNames) {
    const n = norm(name)
    if (screenshotSet.has(n)) continue
    const matched = SCREENSHOT_NAMES.some((sName) => couldMatch(sName, name))
    if (!matched) inAppNotInScreenshot.push(name)
  }

  console.log('--- In screenshot but NOT in app (including inactive) ---')
  if (inScreenshotNotInApp.length === 0) {
    console.log('None.')
  } else {
    inScreenshotNotInApp.forEach((n) => console.log('  -', n))
  }
  console.log('')

  console.log('--- In app but NOT in screenshot ---')
  if (inAppNotInScreenshot.length === 0) {
    console.log('None.')
  } else {
    inAppNotInScreenshot.forEach((n) => console.log('  -', n))
  }
  console.log('')

  const matchedScreenshot = SCREENSHOT_NAMES.length - inScreenshotNotInApp.length
  const matchedApp = allNames.length - inAppNotInScreenshot.length
  console.log('--- Summary ---')
  console.log('Screenshot names matched to app:', matchedScreenshot, '/', SCREENSHOT_NAMES.length)
  console.log('App names matched to screenshot:', matchedApp, '/', all.length)
}

main()
