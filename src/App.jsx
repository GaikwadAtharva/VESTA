import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
ArrowLeft,
ArrowRight,
Check,
Link as LinkIcon,
ScanSearch,
Shirt,
GitCompareArrows,
Sparkles,
LoaderCircle,
Ruler,
Layers3,
ShirtIcon,
Scale,
LogIn,
UserPlus,
LogOut,
X,
User,
Plus,
Trash2,
ExternalLink,
Save,
Pencil,
RefreshCw,
CheckCircle2,
AlertTriangle,
XCircle,
DollarSign,
Globe,
Camera,
} from 'lucide-react'
import SplineMannequin from './components/SplineMannequin'
import { supabase } from './supabaseClient'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

const featureCards = [
{
id: 'fit',
number: '02',
title: 'Fit Estimation',
description:
'Estimate garment suitability from your selected fit preference and product characteristics.',
icon: Ruler,
},
{
id: 'style',
number: '03',
title: 'Style Intelligence',
description:
'Use IBM Granite to turn product information into practical fashion recommendations.',
icon: Sparkles,
},
{
id: 'outfit',
number: '04',
title: 'Outfit Builder',
description:
'Build complete outfit combinations around the garment you are considering.',
icon: Layers3,
},
{
id: 'wardrobe',
number: '05',
title: 'Wardrobe Match',
description:
'Check how well the product works with the pieces already in your wardrobe.',
icon: ShirtIcon,
},
{
id: 'compare',
number: '06',
title: 'Compare + What-If',
description:
'Compare alternatives and explore how changing a product affects the decision.',
icon: Scale,
},
]

function parseStylePoints(input) {
  if (Array.isArray(input)) {
    return input.filter(Boolean)
  }
  if (!input || typeof input !== 'string') return []

  const rawLines = input
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  const points = []

  for (const line of rawLines) {
    let cleaned = line.replace(/^[•\-*\d.)\s]+/, '').trim()

    if (
      !cleaned ||
      /^do not\b/i.test(cleaned) ||
      /^don't\b/i.test(cleaned) ||
      /^write only\b/i.test(cleaned) ||
      /^you are vesta\b/i.test(cleaned) ||
      /^give (one|two|three|\d+)\b/i.test(cleaned) ||
      /^(product|category|colour|color|fit|occasion|description):/i.test(cleaned) ||
      /^(point \d|recommendation \d|step \d):/i.test(cleaned) ||
      /^note:/i.test(cleaned) ||
      /^instruction:/i.test(cleaned) ||
      /^format requirements:/i.test(cleaned) ||
      /^here (is|are)\b/i.test(cleaned) ||
      /^styling recommendation:?/i.test(cleaned)
    ) {
      continue
    }

    cleaned = cleaned
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/__(.*?)__/g, '$1')
      .trim()

    if (cleaned.length > 10) {
      points.push(cleaned)
    }
  }

  if (points.length === 0 && input.trim()) {
    const rawFiltered = input
      .replace(/\r/g, ' ')
      .replace(/do not [^.]*\./gi, '')
      .replace(/don't [^.]*\./gi, '')
      .trim()

    const sentences = rawFiltered
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.replace(/^[•\-*\d.)\s]+/, '').trim())
      .filter((s) => s.length > 15 && !/^do not\b/i.test(s))

    return sentences.slice(0, 3)
  }

  return points.slice(0, 3)
}

function App() {
const [session, setSession] = useState(null)
const [authLoading, setAuthLoading] = useState(true)
const [showAuth, setShowAuth] = useState(false)
const [authMode, setAuthMode] = useState('login')
const [authEmail, setAuthEmail] = useState('')
const [authPassword, setAuthPassword] = useState('')
const [authFullName, setAuthFullName] = useState('')
const [authError, setAuthError] = useState('')
const [authMessage, setAuthMessage] = useState('')
const [authSubmitting, setAuthSubmitting] = useState(false)
const [showMeasurements, setShowMeasurements] = useState(false)
const [measurementLoading, setMeasurementLoading] = useState(false)
const [measurementSaving, setMeasurementSaving] = useState(false)
const [measurementError, setMeasurementError] = useState('')
const [measurementsSaved, setMeasurementsSaved] = useState(false)
const [editingMeasurements, setEditingMeasurements] = useState(false)
const [measurements, setMeasurements] = useState({
height_cm: '',
chest_cm: '',
waist_cm: '',
hips_cm: '',
shoulder_cm: '',
inseam_cm: '',
})
const [showExplorer, setShowExplorer] = useState(false)
const [productUrl, setProductUrl] = useState('')
const [product, setProduct] = useState(null)
const [loading, setLoading] = useState(false)
const [error, setError] = useState('')
const [activeFeature, setActiveFeature] = useState(null)
const [fitPreference, setFitPreference] = useState('Regular Fit')
const [fitUsualSize, setFitUsualSize] = useState('M')
const [fitEstimation, setFitEstimation] = useState(null)
const [fitLoading, setFitLoading] = useState(false)
const [fitError, setFitError] = useState('')
const [itemPrice, setItemPrice] = useState(79)
const [wearFrequency, setWearFrequency] = useState(4)
const [showHeroSpline, setShowHeroSpline] = useState(false)
const [lookbookOccasion, setLookbookOccasion] = useState('casual')
const [lookbookVariantIndex, setLookbookVariantIndex] = useState(0)
const [lookbookSavedToast, setLookbookSavedToast] = useState('')
const [styleResult, setStyleResult] = useState('')
const [stylePoints, setStylePoints] = useState([])
const [styleLoading, setStyleLoading] = useState(false)
const [styleError, setStyleError] = useState('')
const defaultWardrobeSeed = [
  { id: 'def_1', name: 'Slim Black Denim' },
  { id: 'def_2', name: 'Crisp White Minimalist Sneakers' },
  { id: 'def_3', name: 'Navy Tailored Blazer' },
]

const [wardrobeItems, setWardrobeItems] = useState(() => {
  try {
    const saved = localStorage.getItem('vesta_wardrobe_items')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch (err) {
    void err
  }
  return defaultWardrobeSeed
})
const [newWardrobeItem, setNewWardrobeItem] = useState('')
const [compareProduct, setCompareProduct] = useState({
name: '',
color: '',
category: '',
fit: '',
})
const [whatIfColor, setWhatIfColor] = useState('')
const [activeView, setActiveView] = useState('dashboard')
const [profile, setProfile] = useState({
full_name: '',
})
const [preferences, setPreferences] = useState({
preferred_fit: 'Regular Fit',
preferred_style: '',
preferred_colors: '',
preferred_categories: '',
})
const [editingStyle, setEditingStyle] = useState(false)
const [savingStyle, setSavingStyle] = useState(false)
const [styleSaveMessage, setStyleSaveMessage] = useState('')
const [profileName, setProfileName] = useState('')
const [editingProfile, setEditingProfile] = useState(false)
const [savingProfile, setSavingProfile] = useState(false)
const [dashboardLoading, setDashboardLoading] = useState(false)
const [dashboardError, setDashboardError] = useState('')
const [savedProducts, setSavedProducts] = useState([])
const [savedComparisons, setSavedComparisons] = useState([])
const [comparisonSaving, setComparisonSaving] = useState(false)
const [comparisonMessage, setComparisonMessage] = useState('')

useEffect(() => {
let mounted = true

async function loadSession() {
const {
data,
error: sessionError,
} = await supabase.auth.getSession()

if (!mounted) return

if (sessionError) {
console.error(sessionError)
}

const currentSession = data?.session || null

setSession(currentSession)
setAuthLoading(false)

    if (!currentSession) {
      setShowAuth(false)
      setShowMeasurements(false)
      setShowExplorer(false)
      setMeasurementsSaved(false)
      setActiveView('home')
    } else {
setShowAuth(false)
setActiveView('dashboard')
await loadDashboardData(currentSession)
}
}

loadSession()

const {
data: { subscription },
} = supabase.auth.onAuthStateChange(
async (_event, newSession) => {
setSession(newSession)

if (!newSession) {
setShowAuth(true)
setShowMeasurements(false)
setShowExplorer(false)
setMeasurementsSaved(false)
setActiveView('home')
} else {
setShowAuth(false)
setActiveView('dashboard')
await loadDashboardData(newSession)
}
},
)

return () => {
mounted = false
subscription.unsubscribe()
}
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [])

  function normalizeProductData(raw) {
    if (!raw) return raw
    const nameLower = (raw.name || '').toLowerCase()
    const isTee =
      nameLower.includes('dry-ex') ||
      nameLower.includes('t-shirt') ||
      nameLower.includes('tshirt') ||
      nameLower.includes('tee')
    let category = raw.category || ''
    let color = raw.color || ''

    if (
      isTee &&
      (category === 'Shirt / Top' || category === 'Shirt' || !category)
    ) {
      category = 'T-Shirt'
    }
    if (
      nameLower.includes('dry-ex') &&
      (!color || color.toLowerCase() === 'white')
    ) {
      color = 'Blue'
    }

    return {
      ...raw,
      category: category || raw.category || 'T-Shirt',
      color: color || raw.color || 'Blue',
      fit: raw.fit || 'Regular Fit',
    }
  }


function getUserDisplayName() {
  const storedName =
    (typeof window !== 'undefined' &&
      (localStorage.getItem(`vesta_user_name_${session?.user?.id || 'guest'}`) ||
        localStorage.getItem('vesta_guest_name'))) ||
    ''

  const metadataName =
    session?.user?.user_metadata?.full_name ||
    session?.user?.user_metadata?.name ||
    ''

  return (
    profile?.full_name ||
    profileName ||
    storedName ||
    metadataName ||
    session?.user?.email?.split('@')?.[0] ||
    'there'
  )
}

function normalizePreferenceList(value) {
if (Array.isArray(value)) return value.join(', ')
if (typeof value === 'string') return value
return ''
}

async function loadDashboardData(currentSession = session) {
if (!currentSession?.user?.id) return

const userId = currentSession.user.id
setDashboardLoading(true)
setMeasurementLoading(true)
setDashboardError('')

try {
const [
profileResult,
measurementResult,
preferenceResult,
wardrobeResult,
productsResult,
comparisonsResult,
] = await Promise.all([
supabase
.from('profiles')
.select('*')
.eq('id', userId)
.maybeSingle(),
supabase
.from('measurements')
.select('*')
.eq('user_id', userId)
.maybeSingle(),
supabase
.from('user_preferences')
.select('*')
.eq('user_id', userId)
.maybeSingle(),
supabase
.from('wardrobe')
.select('*')
.eq('user_id', userId),
supabase
.from('products')
.select('*')
.eq('user_id', userId),
supabase
.from('comparisons')
.select('*')
.eq('user_id', userId),
])

    if (profileResult.data?.full_name) {
      setProfile(profileResult.data)
      setProfileName(profileResult.data.full_name)
    } else {
      const fallbackName =
        currentSession?.user?.user_metadata?.full_name ||
        currentSession?.user?.user_metadata?.name ||
        (typeof window !== 'undefined'
          ? localStorage.getItem(`vesta_user_name_${userId}`)
          : '') ||
        ''
      if (fallbackName) {
        setProfile({ full_name: fallbackName })
        setProfileName(fallbackName)
      }
    }

if (measurementResult.error) {
console.error(
'Measurement dashboard load error:',
measurementResult.error,
)
} else if (measurementResult.data) {
const data = measurementResult.data

setMeasurements({
height_cm: data.height_cm ?? '',
chest_cm: data.chest_cm ?? '',
waist_cm: data.waist_cm ?? '',
hips_cm: data.hips_cm ?? '',
shoulder_cm: data.shoulder_cm ?? '',
inseam_cm: data.inseam_cm ?? '',
})

setMeasurementsSaved(true)
} else {
setMeasurementsSaved(false)
}

if (preferenceResult.error) {
console.error(
'Preferences load error:',
preferenceResult.error,
)
} else if (preferenceResult.data) {
const data = preferenceResult.data

const nextPreferences = {
preferred_fit: data.preferred_fit || 'Regular Fit',
preferred_style: normalizePreferenceList(
data.preferred_style,
),
preferred_colors: normalizePreferenceList(
data.preferred_colors,
),
preferred_categories: normalizePreferenceList(
data.preferred_categories,
),
}

setPreferences(nextPreferences)
setFitPreference(nextPreferences.preferred_fit)
}

if (wardrobeResult.error) {
console.error(
'Wardrobe load error:',
wardrobeResult.error,
)
} else {
const items = (wardrobeResult.data || []).map((item) => ({
id: item.id,
name:
item.item_name ||
item.name ||
item.item ||
item.title ||
'Wardrobe item',
raw: item,
}))

setWardrobeItems(items)
}

if (productsResult.error) {
console.error(
'Products load error:',
productsResult.error,
)
} else {
setSavedProducts(productsResult.data || [])
}

if (comparisonsResult.error) {
console.error(
'Comparisons load error:',
comparisonsResult.error,
)
} else {
setSavedComparisons(comparisonsResult.data || [])
}
} catch (err) {
console.error('Dashboard data load error:', err)

setDashboardError(
'Some dashboard data could not be loaded. Please refresh and try again.',
)
} finally {
setDashboardLoading(false)
setMeasurementLoading(false)
}
}

function openDashboard() {
if (!session) {
openLogin()
return
}

setShowExplorer(false)
setShowMeasurements(false)
setActiveView('dashboard')
window.scrollTo({ top: 0, behavior: 'smooth' })
}

function openHome() {
setShowExplorer(false)
setShowMeasurements(false)
setActiveView('home')
window.scrollTo({ top: 0, behavior: 'smooth' })
}

function openInfoSection(sectionId) {
setShowExplorer(false)
setShowMeasurements(false)
setActiveView('home')

setTimeout(() => {
document
.getElementById(sectionId)
?.scrollIntoView({
behavior: 'smooth',
block: 'start',
})
}, 50)
}

function openMeasurementsEditor() {
setShowExplorer(false)
setEditingMeasurements(!measurementsSaved)
setMeasurementError('')
setShowMeasurements(true)
}

async function saveStylePreferences() {
  if (!session?.user?.id) {
    setFitPreference(preferences.preferred_fit || 'Regular Fit')
    setEditingStyle(false)
    setStyleSaveMessage('Style preferences updated.')
    try {
      localStorage.setItem('vesta_guest_preferences', JSON.stringify(preferences))
    } catch (err) {
      void err
    }
    return
  }

  setSavingStyle(true)
  setStyleSaveMessage('')

  try {
    const payload = {
      user_id: session.user.id,
      preferred_fit: preferences.preferred_fit || 'Regular Fit',
      preferred_style: preferences.preferred_style.trim(),
      preferred_colors: preferences.preferred_colors.trim(),
      preferred_categories:
        preferences.preferred_categories.trim(),
    }

    const { data, error: saveError } = await supabase
      .from('user_preferences')
      .upsert(payload, {
        onConflict: 'user_id',
      })
      .select()
      .single()

    if (saveError) throw saveError

    if (data) {
      setPreferences({
        preferred_fit: data.preferred_fit || 'Regular Fit',
        preferred_style: normalizePreferenceList(
          data.preferred_style,
        ),
        preferred_colors: normalizePreferenceList(
          data.preferred_colors,
        ),
        preferred_categories: normalizePreferenceList(
          data.preferred_categories,
        ),
      })

      setFitPreference(data.preferred_fit || 'Regular Fit')
    }

    setEditingStyle(false)
    setStyleSaveMessage('Style preferences saved.')
  } catch (err) {
    console.error('Style preference save error:', err)

    setStyleSaveMessage(
      err?.message ||
        'Unable to save style preferences. Please try again.',
    )
  } finally {
    setSavingStyle(false)
  }
}

async function saveProfileName() {
  const name = profileName.trim()
  if (!name) return

  // 1. Instantly update local state so the name reflects immediately
  setProfile((prev) => ({ ...prev, full_name: name }))
  setProfileName(name)
  setEditingProfile(false)

  // 2. Persist to localStorage across page reloads
  try {
    const key = session?.user?.id
      ? `vesta_user_name_${session.user.id}`
      : 'vesta_guest_name'
    localStorage.setItem(key, name)
  } catch (err) {
    void err
  }

  // 3. If user is logged in, update Supabase Auth metadata and profiles table
  if (session?.user?.id) {
    setSavingProfile(true)
    try {
      // Direct update to Supabase Auth metadata (always succeeds)
      await supabase.auth.updateUser({
        data: { full_name: name },
      })

      // Attempt upsert into profiles table if configured
      await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          full_name: name,
        })
    } catch (err) {
      console.warn('Profile sync notice (cached locally):', err)
    } finally {
      setSavingProfile(false)
    }
  }
}

async function addWardrobeItem() {
  const item = newWardrobeItem.trim()
  if (!item) return

  const tempId = 'item_' + Date.now()
  const newItem = {
    id: tempId,
    name: item,
  }

  // Snappy optimistic UI update & localStorage caching
  setWardrobeItems((items) => {
    const updated = [newItem, ...items]
    try {
      localStorage.setItem('vesta_wardrobe_items', JSON.stringify(updated))
    } catch (err) {
      void err
    }
    return updated
  })

  setNewWardrobeItem('')

  // If user is authenticated, also sync to Supabase in the background
  if (session?.user?.id) {
    try {
      let result = await supabase
        .from('wardrobe')
        .insert({
          user_id: session.user.id,
          item_name: item,
        })
        .select()
        .single()

      if (result.error) {
        result = await supabase
          .from('wardrobe')
          .insert({
            user_id: session.user.id,
            name: item,
          })
          .select()
          .single()
      }

      if (!result.error && result.data?.id) {
        setWardrobeItems((items) =>
          items.map((it) =>
            it.id === tempId
              ? {
                  id: result.data.id,
                  name: result.data.item_name || result.data.name || item,
                  raw: result.data,
                }
              : it,
          ),
        )
      }
    } catch (err) {
      console.warn('Supabase wardrobe sync note (safely cached locally):', err)
    }
  }
}

async function removeWardrobeItem(itemOrIndex) {
  const item =
    typeof itemOrIndex === 'number'
      ? wardrobeItems[itemOrIndex]
      : itemOrIndex

  if (!item) return

  // Instant optimistic removal from UI and localStorage
  setWardrobeItems((items) => {
    const updated = items.filter((current, idx) =>
      typeof itemOrIndex === 'number'
        ? idx !== itemOrIndex
        : (item.id ? current.id !== item.id : current.name !== item.name),
    )
    try {
      localStorage.setItem('vesta_wardrobe_items', JSON.stringify(updated))
    } catch (err) {
      void err
    }
    return updated
  })

  // If authenticated and was a cloud-synced item, delete from Supabase
  if (
    session?.user?.id &&
    item.id &&
    !String(item.id).startsWith('item_') &&
    !String(item.id).startsWith('def_')
  ) {
    try {
      let deleteQuery = supabase
        .from('wardrobe')
        .delete()
        .eq('user_id', session.user.id)
        .eq('id', item.id)

      await deleteQuery
    } catch (err) {
      console.warn('Supabase wardrobe delete warning:', err)
    }
  }
}

async function saveComparison() {
if (!session?.user?.id || !product) {
setComparisonMessage(
'Import a product before saving a comparison.',
)
return
}

setComparisonSaving(true)
setComparisonMessage('')

const originalScore = getWardrobeScore()
const alternativeScore = getCompareScore(compareProduct)
const whatIfScore = getWhatIfScore()

try {
const payload = {
user_id: session.user.id,
product_name: product.name || 'Current garment',
alternative_name:
compareProduct.name || 'Alternative',
original_color: product.color || '',
alternative_color: compareProduct.color || '',
original_fit: product.fit || '',
alternative_fit: compareProduct.fit || '',
what_if_color: whatIfColor || '',
fit_score: getFitScore(),
wardrobe_score: originalScore,
alternative_score: alternativeScore,
what_if_score: whatIfScore,
}

const { data, error: saveError } = await supabase
.from('comparisons')
.insert(payload)
.select()
.single()

if (saveError) throw saveError

if (data) {
setSavedComparisons((items) => [data, ...items])
}

setComparisonMessage(
'Comparison saved to your VESTA account.',
)
} catch (err) {
console.error('Comparison save error:', err)

setComparisonMessage(
err?.message ||
'Unable to save this comparison. Check your comparisons table columns.',
)
} finally {
setComparisonSaving(false)
}
}

function openLogin() {
setAuthMode('login')
setAuthError('')
setAuthMessage('')
setAuthEmail('')
setAuthPassword('')
setAuthFullName('')
setShowAuth(true)
}

function openSignup() {
setAuthMode('signup')
setAuthError('')
setAuthMessage('')
setAuthEmail('')
setAuthPassword('')
setAuthFullName('')
setShowAuth(true)
}

function closeAuth() {
  if (authSubmitting) return

  setShowAuth(false)
  setAuthError('')
  setAuthMessage('')
}

useEffect(() => {
  if (!showAuth) return

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      setShowAuth(false)
      setAuthError('')
      setAuthMessage('')
    }
  }

  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [showAuth])

async function handleAuthSubmit(event) {
event.preventDefault()

setAuthError('')
setAuthMessage('')
setAuthSubmitting(true)

try {
if (!authEmail.trim() || !authPassword.trim()) {
throw new Error(
'Please enter your email and password.',
)
}

if (authPassword.length < 6) {
throw new Error(
'Password must be at least 6 characters long.',
)
}

if (authMode === 'signup') {
if (!authFullName.trim()) {
throw new Error('Please enter your full name.')
}

const {
data,
error: signupError,
} = await supabase.auth.signUp({
email: authEmail.trim(),
password: authPassword,
options: {
data: {
full_name: authFullName.trim(),
},
},
})

if (signupError) {
throw signupError
}

if (data?.user) {
const { error: profileError } =
await supabase
.from('profiles')
.upsert({
id: data.user.id,
full_name: authFullName.trim(),
})

if (profileError) {
console.error(
'Profile creation error:',
profileError,
)
}

const { error: preferencesError } =
await supabase
.from('user_preferences')
.upsert({
user_id: data.user.id,
preferred_fit: 'Regular Fit',
})

if (preferencesError) {
console.error(
'Preference creation error:',
preferencesError,
)
}
}

if (data?.session) {
setSession(data.session)
setShowAuth(false)
setActiveView('dashboard')
await loadDashboardData(data.session)
} else {
setAuthMessage(
'Account created. Check your email if confirmation is required.',
)
}
} else {
const {
data,
error: loginError,
} = await supabase.auth.signInWithPassword({
email: authEmail.trim(),
password: authPassword,
})

if (loginError) {
throw loginError
}

if (data?.session) {
setSession(data.session)
setShowAuth(false)
setActiveView('dashboard')
await loadDashboardData(data.session)
}
}
} catch (err) {
setAuthError(
err?.message ||
'Authentication failed. Please try again.',
)
} finally {
setAuthSubmitting(false)
}
}

async function handleSaveMeasurements(event) {
event.preventDefault()

if (!session?.user?.id) {
setMeasurementError(
'Please log in before saving measurements.',
)
return
}

setMeasurementError('')

const requiredFields = [
'height_cm',
'chest_cm',
'waist_cm',
'hips_cm',
'shoulder_cm',
'inseam_cm',
]

for (const field of requiredFields) {
const value = Number(measurements[field])

if (
measurements[field] === '' ||
!Number.isFinite(value)
) {
setMeasurementError(
'Please enter a valid number in every field.',
)
return
}

if (value <= 0) {
setMeasurementError(
'Measurements must be greater than zero.',
)
return
}
}

setMeasurementSaving(true)

if (!session?.user?.id) {
  setMeasurementsSaved(true)
  setEditingMeasurements(false)
  setMeasurementError('')
  setShowMeasurements(true)
  try {
    localStorage.setItem('vesta_guest_measurements', JSON.stringify(measurements))
  } catch (err) {
    void err
  }
  setMeasurementSaving(false)
  return
}

try {
const payload = {
user_id: session.user.id,
height_cm: Number(measurements.height_cm),
chest_cm: Number(measurements.chest_cm),
waist_cm: Number(measurements.waist_cm),
hips_cm: Number(measurements.hips_cm),
shoulder_cm: Number(measurements.shoulder_cm),
inseam_cm: Number(measurements.inseam_cm),
}

const {
data: savedData,
error: saveError,
} = await supabase
.from('measurements')
.upsert(payload, {
onConflict: 'user_id',
})
.select()
.single()

if (saveError) {
throw saveError
}

if (savedData) {
setMeasurements({
height_cm: savedData.height_cm ?? '',
chest_cm: savedData.chest_cm ?? '',
waist_cm: savedData.waist_cm ?? '',
hips_cm: savedData.hips_cm ?? '',
shoulder_cm: savedData.shoulder_cm ?? '',
inseam_cm: savedData.inseam_cm ?? '',
})
}

setMeasurementsSaved(true)
setEditingMeasurements(false)
setMeasurementError('')
setShowMeasurements(true)
} catch (err) {
console.error(
'Measurement save error:',
err,
)

setMeasurementError(
err?.message ||
'Unable to save measurements. Please try again.',
)
} finally {
setMeasurementSaving(false)
}
}

function updateMeasurement(field, value) {
setMeasurements((current) => ({
...current,
[field]: value,
}))
}

function continueToVesta() {
setShowMeasurements(false)
setEditingMeasurements(false)
setMeasurementError('')
setActiveView('dashboard')
}

function editMeasurements() {
setEditingMeasurements(true)
setMeasurementError('')
}

async function handleLogout() {
const {
error: logoutError,
} = await supabase.auth.signOut()

if (logoutError) {
console.error(logoutError)
return
}

setSession(null)
setActiveView('home')
setShowExplorer(false)
setShowMeasurements(false)
setMeasurementsSaved(false)
setEditingMeasurements(false)
setProfile({
full_name: '',
})
setProfileName('')
setPreferences({
preferred_fit: 'Regular Fit',
preferred_style: '',
preferred_colors: '',
preferred_categories: '',
})
setWardrobeItems([])
setSavedProducts([])
setSavedComparisons([])
resetProduct()
}

async function importProduct() {
if (!session) {
openLogin()
return
}

if (!productUrl.trim()) {
setError('Please enter a product URL.')
return
}

setLoading(true)
setError('')
setProduct(null)
setStyleResult('')
setStyleError('')

try {
const response = await fetch(
`${API_BASE_URL}/api/product/import`,
{
method: 'POST',
headers: {
'Content-Type': 'application/json',
},
body: JSON.stringify({
url: productUrl.trim(),
}),
},
)

const responseText = await response.text()

let data

try {
data = responseText
? JSON.parse(responseText)
: null
} catch {
throw new Error(
`The server returned an invalid response (${response.status}).`,
)
}

if (!response.ok || !data?.success) {
throw new Error(
data?.message ||
'Unable to import this product.',
)
}

    const normalizedProduct = normalizeProductData(data.product)

    setProduct(normalizedProduct)

    setCompareProduct({
      name: normalizedProduct?.name || '',
      color: normalizedProduct?.color || '',
      category: normalizedProduct?.category || '',
      fit: normalizedProduct?.fit || '',
    })

    const {
      data: insertedProduct,
      error: productSaveError,
    } = await supabase
      .from('products')
      .insert({
        user_id: session.user.id,
        product_url: productUrl.trim(),
        product_name: normalizedProduct?.name || '',
        category: normalizedProduct?.category || '',
        color: normalizedProduct?.color || '',
        fit: normalizedProduct?.fit || '',
        description: normalizedProduct?.description || '',
        image_url: normalizedProduct?.image || '',
      })
      .select()
      .single()

if (productSaveError) {
console.error(
'Product database save error:',
productSaveError,
)
}

if (insertedProduct) {
setProduct((currentProduct) => ({
...currentProduct,
databaseId: insertedProduct.id,
}))

setSavedProducts((items) => [
insertedProduct,
...items,
])
}
} catch (err) {
setError(
err?.message ||
'Something went wrong while importing the product.',
)
} finally {
setLoading(false)
}
}

async function generateStyleIntelligence() {
if (!product) {
setStyleError('Import a product first.')
return
}

setStyleLoading(true)
setStyleError('')
setStyleResult('')
setStylePoints([])

try {
const response = await fetch(
`${API_BASE_URL}/api/watsonx/style`,
{
method: 'POST',
headers: {
'Content-Type': 'application/json',
},
body: JSON.stringify({
name: product.name,
category: product.category,
color: product.color,
description: product.description,
preferredFit: fitPreference,
occasion: 'Casual',
}),
},
)

const responseText = await response.text()

let data

try {
data = responseText
? JSON.parse(responseText)
: null
} catch {
throw new Error(
`IBM returned an invalid response (${response.status}).`,
)
}

if (!response.ok || !data?.success) {
throw new Error(
data?.message ||
'Unable to generate style intelligence.',
)
}

const points = Array.isArray(data?.points) && data.points.length > 0
  ? data.points
  : parseStylePoints(data?.styleText || data?.result?.results?.[0]?.generated_text || '')

if (!points || points.length === 0) {
throw new Error(
'IBM responded successfully, but no recommendation was generated.',
)
}

setStylePoints(points)
setStyleResult(data?.styleText || points.map((p) => `• ${p}`).join('\n\n'))
} catch (err) {
setStyleError(
err?.message ||
'Something went wrong while generating style intelligence.',
)
} finally {
setStyleLoading(false)
}
}

async function generateFitEstimation(size = fitUsualSize, pref = fitPreference) {
if (!product) return

setFitLoading(true)
setFitError('')

try {
const response = await fetch(`${API_BASE_URL}/api/fit/estimate`, {
method: 'POST',
headers: {
'Content-Type': 'application/json',
},
body: JSON.stringify({
product: {
name: product.name,
category: product.category,
color: product.color,
description: product.description,
fit: product.fit,
},
usualSize: size || 'M',
fitPreference: pref || 'Regular Fit',
}),
})

const data = await response.json()

if (!response.ok || !data.success) {
throw new Error(data.message || 'Fit estimation request failed.')
}

setFitEstimation(data.fit)
} catch (err) {
console.warn('Backend fit estimation fallback triggered:', err.message)
const garmentFit = product.fit || 'Fit not detected'
const isClose = garmentFit.toLowerCase().includes(pref.toLowerCase().split(' ')[0])
setFitEstimation({
recommendation: isClose
? `Start with your usual ${size || 'M'} size.`
: `Start with your usual ${size || 'M'} size, noting this piece has a ${garmentFit} silhouette.`,
confidence: garmentFit === 'Fit not detected' ? 'Low' : isClose ? 'High' : 'Medium',
reasoning: `VESTA cross-referenced your preferred ${pref} against this garment's detected ${garmentFit} cut.`,
garmentSignal: garmentFit,
advice: 'Check retailer shoulder width and chest specifications before finalizing your purchase.'
})
} finally {
setFitLoading(false)
}
}

function startExploring() {
if (!session) {
openLogin()
return
}

if (showMeasurements) {
setMeasurementError(
'Close the fit profile before exploring VESTA.',
)
return
}

setActiveView('explore')
setShowExplorer(true)

setTimeout(() => {
document
.getElementById('product-explorer')
?.scrollIntoView({
behavior: 'smooth',
})
}, 50)
}

function resetProduct() {
setProduct(null)
setProductUrl('')
setError('')
setStyleResult('')
setStylePoints([])
setStyleError('')
setActiveFeature(null)
setCompareProduct({
name: '',
color: '',
category: '',
fit: '',
})
setWhatIfColor('')
setComparisonMessage('')
}

function selectFeature(featureId) {
setActiveFeature(featureId)

setTimeout(() => {
document
.getElementById(`feature-${featureId}`)
?.scrollIntoView({
behavior: 'smooth',
block: 'start',
})
}, 50)
}

function getFitScore() {
if (!product) return 0

const productFit = (
product.fit || ''
).toLowerCase()

const selectedFit =
fitPreference.toLowerCase()

if (
!productFit ||
productFit === 'not detected'
) {
return selectedFit === 'regular fit'
? 76
: 70
}

if (productFit === selectedFit) {
return 92
}

if (
productFit.includes('relaxed') &&
selectedFit.includes('regular')
) {
return 78
}

if (
productFit.includes('oversized') &&
selectedFit.includes('regular')
) {
return 68
}

if (
productFit.includes('slim') &&
selectedFit.includes('regular')
) {
return 72
}

return 70
}

function getWardrobeScore() {
if (!product) return 0

const color = (
product.color || ''
).toLowerCase()

let score = 65

if (
color.includes('white') ||
color.includes('black') ||
color.includes('navy') ||
color.includes('blue')
) {
score += 12
}

if (wardrobeItems.length >= 3) {
score += 10
}

if (wardrobeItems.length >= 5) {
score += 5
}

return Math.min(score, 95)
}

function getWardrobeGapAnalysis() {
  if (!product) return null
  const prodNameLower = (product.name || '').toLowerCase()
  const isTee =
    prodNameLower.includes('dry-ex') ||
    prodNameLower.includes('t-shirt') ||
    prodNameLower.includes('tshirt') ||
    prodNameLower.includes('tee')
  const rawCat = isTee
    ? 't-shirt'
    : (product.category || 't-shirt').toLowerCase()
  const rawCol =
    prodNameLower.includes('dry-ex') &&
    (!product.color || product.color === 'White')
      ? 'blue'
      : (product.color || 'blue').toLowerCase()

  const matchingItems = wardrobeItems.filter((item) => {
    const itemName = (item.name || '').toLowerCase()
    return (
      (rawCat && itemName.includes(rawCat.split(' ')[0].toLowerCase())) ||
      (rawCol && itemName.includes(rawCol.toLowerCase()))
    )
  })

  if (matchingItems.length >= 2) {
    return {
      type: 'warning',
      badge: '⚠️ WARDROBE OVERLAP DETECTED',
      message: `You already own ${matchingItems.length} pieces with similar silhouette or palette (${matchingItems.map((m) => m.name).slice(0, 2).join(', ')}). Consider if this brings distinct styling versatility.`,
    }
  } else if (matchingItems.length === 1) {
    return {
      type: 'positive',
      badge: '⚖️ COMPATIBLE COMPANION',
      message: `Pairs seamlessly with your ${matchingItems[0].name} while giving you fresh rotation options.`,
    }
  } else {
    return {
      type: 'positive',
      badge: '✨ CAPSULE GAP FILLER',
      message: `Fills an unfilled role in your wardrobe collection. You have no direct duplicate for this ${rawCol ? rawCol + ' ' : ''}${rawCat || 'piece'}.`,
    }
  }
}

function generateLookbookSlots(occasion = 'casual', variant = 0) {
  if (!product) return []
  const prodNameLower = (product.name || '').toLowerCase()
  const isTee =
    prodNameLower.includes('dry-ex') ||
    prodNameLower.includes('t-shirt') ||
    prodNameLower.includes('tshirt') ||
    prodNameLower.includes('tee')
  const effectiveCategory = isTee
    ? 'T-Shirt'
    : (product.category || 'T-Shirt')
  const effectiveColor =
    prodNameLower.includes('dry-ex') &&
    (!product.color || product.color === 'White')
      ? 'Blue'
      : (product.color || 'Blue')
  const effectiveFit = product.fit || 'Regular Fit'

  const category = effectiveCategory.toLowerCase()
  const color = effectiveColor.toLowerCase()

  const findWardrobeItem = (keywords) => {
    return wardrobeItems.find((w) => {
      const name = (w.name || '').toLowerCase()
      return keywords.some((kw) => name.includes(kw))
    })
  }

  const slot1 = {
    slotLabel: '01 / CORE GARMENT',
    title: product.name || 'Imported Garment',
    badgeText: 'IMPORTED ITEM',
    badgeType: 'imported',
    note: `${effectiveFit} · ${effectiveColor} ${effectiveCategory}`,
    image: product.image,
  }

let slot2
let slot3
let slot4

if (occasion === 'casual') {
const bottomMatch = findWardrobeItem(['jean', 'denim', 'pant', 'trouser', 'chino'])
const altBottom = variant % 2 === 0 ? 'Washed Indigo Denim' : 'Relaxed Olive Chinos'
slot2 = {
slotLabel: '02 / COMPLEMENTARY BOTTOM',
title: bottomMatch ? bottomMatch.name : altBottom,
badgeText: bottomMatch ? '✓ IN YOUR WARDROBE' : '+ CAPSULE STAPLE',
badgeType: bottomMatch ? 'owned' : 'staple',
note: 'Soft drape creating an easygoing, everyday profile.',
}

const shoeMatch = findWardrobeItem(['sneaker', 'trainer', 'shoe', 'boot'])
const altShoe = variant % 2 === 0 ? 'Clean White Leather Trainers' : 'Classic Canvas Low-Tops'
slot3 = {
slotLabel: '03 / FOOTWEAR ANCHOR',
title: shoeMatch ? shoeMatch.name : altShoe,
badgeText: shoeMatch ? '✓ IN YOUR WARDROBE' : '+ CAPSULE STAPLE',
badgeType: shoeMatch ? 'owned' : 'staple',
note: 'Understated baseline keeping the focus on the silhouette.',
}

slot4 = {
slotLabel: '04 / ACCENT & LAYER',
title: category.includes('jacket') ? 'Heavyweight Plain Tee' : 'Structured Canvas Tote & Minimal Cap',
badgeText: '+ CAPSULE ACCENT',
badgeType: 'staple',
note: 'Effortless textured accessories for relaxed daywear.',
}
} else if (occasion === 'smart_casual') {
const bottomMatch = findWardrobeItem(['trouser', 'pleat', 'pant', 'chino'])
const altBottom = variant % 2 === 0 ? 'Charcoal Pleated Trousers' : 'Tailored Cream Chinos'
slot2 = {
slotLabel: '02 / TAILORED BASE',
title: bottomMatch ? bottomMatch.name : altBottom,
badgeText: bottomMatch ? '✓ IN YOUR WARDROBE' : '+ CAPSULE STAPLE',
badgeType: bottomMatch ? 'owned' : 'staple',
note: 'Structured leg line elevating casual upper elements.',
}

const shoeMatch = findWardrobeItem(['loafer', 'derby', 'leather', 'shoe'])
const altShoe = variant % 2 === 0 ? 'Dark Brown Leather Loafers' : 'Minimalist Suede Derbies'
slot3 = {
slotLabel: '03 / REFINED FOOTWEAR',
title: shoeMatch ? shoeMatch.name : altShoe,
badgeText: shoeMatch ? '✓ IN YOUR WARDROBE' : '+ CAPSULE STAPLE',
badgeType: shoeMatch ? 'owned' : 'staple',
note: 'Polished footwear balancing modern versatility.',
}

slot4 = {
slotLabel: '04 / SOPHISTICATED FINISH',
title: color.includes('black') ? 'Brushed Silver Watch' : 'Neutral Wool Overshirt & Leather Belt',
badgeText: '+ CAPSULE ACCENT',
badgeType: 'staple',
note: 'Tailored layers suitable for creative workspaces.',
}
} else {
const bottomMatch = findWardrobeItem(['black', 'trouser', 'tailored', 'pant'])
const altBottom = variant % 2 === 0 ? 'Tailored Midnight Black Trousers' : 'Raw Selvedge Deep Indigo Denim'
slot2 = {
slotLabel: '02 / EVENING FOUNDATION',
title: bottomMatch ? bottomMatch.name : altBottom,
badgeText: bottomMatch ? '✓ IN YOUR WARDROBE' : '+ CAPSULE STAPLE',
badgeType: bottomMatch ? 'owned' : 'staple',
note: 'Sharp dark silhouette optimized for dim ambient lighting.',
}

const shoeMatch = findWardrobeItem(['boot', 'chelsea', 'leather', 'black'])
const altShoe = variant % 2 === 0 ? 'Black Leather Chelsea Boots' : 'Polished Monk-Strap Shoes'
slot3 = {
slotLabel: '03 / STATEMENT FOOTWEAR',
title: shoeMatch ? shoeMatch.name : altShoe,
badgeText: shoeMatch ? '✓ IN YOUR WARDROBE' : '+ CAPSULE STAPLE',
badgeType: shoeMatch ? 'owned' : 'staple',
note: 'Sleek profile enhancing the overall posture and line.',
}

slot4 = {
slotLabel: '04 / MOOD ACCENT',
title: 'Monochrome Wool Coat & Minimal Jewelry',
badgeText: '+ CAPSULE ACCENT',
badgeType: 'staple',
note: 'Striking minimal drama without loud competing patterns.',
}
}

return [slot1, slot2, slot3, slot4]
}

function getCompareScore(item) {
let score = 70

if (
item.color &&
product?.color &&
item.color.toLowerCase() ===
product.color.toLowerCase()
) {
score += 10
}

if (
item.fit &&
product?.fit &&
item.fit.toLowerCase() ===
product.fit.toLowerCase()
) {
score += 8
}

if (
item.category &&
product?.category &&
item.category.toLowerCase() ===
product.category.toLowerCase()
) {
score += 4
}

return Math.min(score, 95)
}

function getWhatIfScore() {
if (!product) return 0

if (!whatIfColor.trim()) {
return getWardrobeScore()
}

const originalColor = (
product.color || ''
).toLowerCase()

const changedColor =
whatIfColor.toLowerCase()

if (originalColor === changedColor) {
return getWardrobeScore()
}

if (
changedColor.includes('black') ||
changedColor.includes('white') ||
changedColor.includes('navy')
) {
return Math.max(
getWardrobeScore() - 4,
55,
)
}

return Math.max(
getWardrobeScore() - 9,
50,
)
}

function getCostPerWear() {
const price = parseFloat(itemPrice) || 0
const monthly = parseInt(wearFrequency, 10) || 1
const annualWears = Math.max(monthly * 12, 1)
return (price / annualWears).toFixed(2)
}

function getVerdict() {
const fitScore = getFitScore()
const wardrobeScore = getWardrobeScore()
const monthly = parseInt(wearFrequency, 10) || 1
const cpw = parseFloat(getCostPerWear()) || 0

// Frequency/CPW efficiency factor (0-100)
const utilityScore = Math.min(Math.round((monthly / 6) * 80 + (cpw < 3 ? 20 : 5)), 100)
const compositeScore = Math.round(fitScore * 0.4 + wardrobeScore * 0.35 + utilityScore * 0.25)

if (compositeScore >= 76) {
return {
status: 'buy',
label: 'Definite Buy',
headline: 'High wardrobe synergy, strong fit alignment, and high investment utility.',
score: compositeScore,
badgeClass: 'verdict-buy',
IconComponent: CheckCircle2,
reasons: [
'Fit profile closely matches garment cut',
'Strong color pairing with your existing pieces',
'Cost-per-wear represents exceptional value',
'High versatility across multiple occasions',
],
}
} else if (compositeScore >= 62) {
return {
status: 'consider',
label: 'Consider Alternative',
headline: 'Solid aesthetic appeal, but evaluate potential wardrobe overlap or styling flexibility.',
score: compositeScore,
badgeClass: 'verdict-consider',
IconComponent: AlertTriangle,
reasons: [
'Moderate alignment with preferred fit',
'May duplicate similar silhouettes in your wardrobe',
'Requires deliberate pairing pieces to maximize wears',
'Acceptable but moderate cost-per-wear efficiency',
],
}
} else {
return {
status: 'pass',
label: 'Pass / Return Risk',
headline: 'Elevated return risk due to fit silhouette deviation or low anticipated wear frequency.',
score: compositeScore,
badgeClass: 'verdict-pass',
IconComponent: XCircle,
reasons: [
'Fit silhouette differs noticeably from your preferred profile',
'Limited color overlap with items in your digital wardrobe',
'Higher cost-per-wear based on projected monthly frequency',
'Retailer sizing advice suggests caution',
],
}
}
}

if (authLoading) {
return (
<main className="vesta-app">
<div
style={{
minHeight: '100vh',
display: 'flex',
alignItems: 'center',
justifyContent: 'center',
}}
>
<LoaderCircle
size={32}
className="spin"
/>
</div>
</main>
)
}

return (
<main className="vesta-app">
<nav className="navbar">
<button
type="button"
className="brand"
onClick={session ? openDashboard : openHome}
aria-label="VESTA Home"
>
<img
  src="/vesta-logo.png"
  alt="VESTA - Style Beyond Limits"
  className="brand-logo-img"
/>
</button>

<div className="nav-links">
{session && (
<button
type="button"
className="nav-button"
onClick={openDashboard}
>
Dashboard
</button>
)}

<button
type="button"
className="nav-button"
onClick={startExploring}
>
Explore VESTA
</button>

<button
type="button"
className="nav-button"
onClick={() => openInfoSection('how-it-works')}
>
How it works
</button>

<button
type="button"
className="nav-button"
onClick={() => openInfoSection('technology')}
>
Technology
</button>

<button
type="button"
className="nav-button"
onClick={() => openInfoSection('roadmap')}
>
Roadmap
</button>
</div>

<div
style={{
display: 'flex',
alignItems: 'center',
gap: '10px',
}}
>
{session ? (
<>
<span
style={{
fontSize: '12px',
opacity: 0.65,
}}
>
{session.user.email}
</span>

<button
type="button"
className="nav-button"
onClick={handleLogout}
>
<LogOut size={16} />
Logout
</button>
</>
) : (
<>
<button
type="button"
className="nav-button"
onClick={openLogin}
>
<LogIn size={16} />
Log in
</button>

<button
type="button"
className="nav-button"
onClick={openSignup}
>
<UserPlus size={16} />
Sign up
</button>
</>
)}
</div>
</nav>

{showAuth && (
<div
style={{
position: 'fixed',
inset: 0,
zIndex: 1000,
background: 'rgba(0, 0, 0, 0.45)',
display: 'flex',
alignItems: 'center',
justifyContent: 'center',
padding: '20px',
}}
onClick={(event) => {
  if (event.target === event.currentTarget) {
    closeAuth()
  }
}}
>
<motion.div
initial={{
opacity: 0,
y: 20,
scale: 0.98,
}}
animate={{
opacity: 1,
y: 0,
scale: 1,
}}
style={{
width: '100%',
maxWidth: '430px',
background: '#f6f5f1',
padding: '34px',
position: 'relative',
borderRadius: '4px',
}}
onClick={(event) => event.stopPropagation()}
>
<button
type="button"
onClick={closeAuth}
style={{
position: 'absolute',
top: '16px',
right: '16px',
border: 'none',
background: 'transparent',
cursor: 'pointer',
padding: '6px',
display: 'flex',
alignItems: 'center',
justifyContent: 'center',
borderRadius: '4px',
}}
aria-label="Close authentication"
>
<X size={20} />
</button>

<div style={{ marginBottom: '14px' }}>
  <img
    src="/vesta-logo.png"
    alt="VESTA"
    style={{ height: '30px', width: 'auto', objectFit: 'contain', display: 'block' }}
  />
</div>

<div className="section-label">
VESTA / ACCOUNT
</div>

<h2
style={{
marginTop: '10px',
marginBottom: '8px',
}}
>
{authMode === 'login'
? 'Welcome back.'
: 'Create your account.'}
</h2>

<p
style={{
marginBottom: '24px',
opacity: 0.7,
}}
>
{authMode === 'login'
? 'Sign in to continue your personalized fashion journey.'
: 'Create your VESTA profile and personalize your decisions.'}
</p>

<form onSubmit={handleAuthSubmit}>
{authMode === 'signup' && (
<input
type="text"
value={authFullName}
onChange={(event) =>
setAuthFullName(
event.target.value,
)
}
placeholder="Full name"
autoComplete="name"
style={{
width: '100%',
padding: '13px 14px',
marginBottom: '12px',
border: '1px solid #d8d6cf',
background: '#fff',
fontSize: '14px',
}}
/>
)}

<input
type="email"
value={authEmail}
onChange={(event) =>
setAuthEmail(
event.target.value,
)
}
placeholder="Email address"
autoComplete="email"
style={{
width: '100%',
padding: '13px 14px',
marginBottom: '12px',
border: '1px solid #d8d6cf',
background: '#fff',
fontSize: '14px',
}}
/>

<input
type="password"
value={authPassword}
onChange={(event) =>
setAuthPassword(
event.target.value,
)
}
placeholder="Password"
autoComplete={
authMode === 'login'
? 'current-password'
: 'new-password'
}
style={{
width: '100%',
padding: '13px 14px',
marginBottom: '14px',
border: '1px solid #d8d6cf',
background: '#fff',
fontSize: '14px',
}}
/>

{authError && (
<div
className="error-message"
style={{
marginBottom: '12px',
}}
>
{authError}
</div>
)}

{authMessage && (
<div
style={{
marginBottom: '12px',
fontSize: '13px',
lineHeight: 1.5,
}}
>
{authMessage}
</div>
)}

<button
type="submit"
className="import-button"
disabled={authSubmitting}
style={{
width: '100%',
}}
>
{authSubmitting ? (
<>
<LoaderCircle
size={17}
className="spin"
/>
{authMode === 'login'
? 'Signing in...'
: 'Creating account...'}
</>
) : (
<>
{authMode === 'login'
? 'Log in'
: 'Create account'}
<ArrowRight size={17} />
</>
)}
</button>
</form>

<div
style={{
marginTop: '20px',
textAlign: 'center',
fontSize: '13px',
}}
>
{authMode === 'login' ? (
<>
Don't have an account?{' '}
<button
type="button"
onClick={openSignup}
style={{
border: 'none',
background: 'transparent',
textDecoration: 'underline',
cursor: 'pointer',
fontWeight: 600,
}}
>
Sign up
</button>
</>
) : (
<>
Already have an account?{' '}
<button
type="button"
onClick={openLogin}
style={{
border: 'none',
background: 'transparent',
textDecoration: 'underline',
cursor: 'pointer',
fontWeight: 600,
}}
>
Log in
</button>
</>
)}
</div>
</motion.div>
</div>
)}

{session && activeView === 'dashboard' && !showMeasurements && !showExplorer && (
<section
className="vesta-dashboard"
style={{
minHeight: 'calc(100vh - 76px)',
padding: '70px 6vw 100px',
background: '#f6f5f1',
}}
>
<div
style={{
maxWidth: '1280px',
margin: '0 auto',
}}
>
<div
style={{
display: 'flex',
justifyContent: 'space-between',
alignItems: 'flex-end',
gap: '30px',
flexWrap: 'wrap',
marginBottom: '48px',
}}
>
<div>
<div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
  <img src="/vesta-logo.png" alt="VESTA" style={{ height: '22px', width: 'auto', objectFit: 'contain' }} />
  <span className="section-label" style={{ margin: 0 }}>DASHBOARD</span>
</div>

<h1
style={{
fontSize: 'clamp(46px, 7vw, 92px)',
lineHeight: 0.9,
margin: '14px 0 18px',
letterSpacing: '-0.045em',
}}
>
Welcome,
<br />
<span>{getUserDisplayName()}.</span>
</h1>

<p
style={{
maxWidth: '600px',
margin: 0,
opacity: 0.62,
lineHeight: 1.7,
}}
>
Your personal VESTA space for fit, style,
wardrobe and fashion decisions.
</p>
</div>

<button
type="button"
className="import-button"
onClick={startExploring}
>
Explore VESTA
<ArrowRight size={17} />
</button>
</div>

{dashboardLoading && (
<div
style={{
display: 'flex',
alignItems: 'center',
gap: '10px',
marginBottom: '22px',
fontSize: '13px',
opacity: 0.65,
}}
>
<LoaderCircle size={18} className="spin" />
Loading your VESTA profile...
</div>
)}

{dashboardError && (
<div
className="error-message"
style={{ marginBottom: '24px' }}
>
{dashboardError}
</div>
)}

<section style={{ marginBottom: '72px' }}>
<div className="section-label">01 / OVERVIEW</div>

<div
style={{
display: 'grid',
gridTemplateColumns:
'repeat(auto-fit, minmax(190px, 1fr))',
gap: '1px',
background: '#d8d6cf',
border: '1px solid #d8d6cf',
marginTop: '18px',
}}
>
{[
[
'MEASUREMENTS',
measurementsSaved ? 'Saved' : 'Not added',
measurementsSaved
? 'Fit profile ready'
: 'Add your measurements',
],
[
'STYLE',
preferences.preferred_style ||
preferences.preferred_colors
? 'Personalized'
: 'Not set',
'Style preferences',
],
[
'WARDROBE',
wardrobeItems.length,
'Saved items',
],
[
'PRODUCTS',
savedProducts.length,
'Saved products',
],
[
'COMPARISONS',
savedComparisons.length,
'Saved decisions',
],
].map(([label, value, note]) => (
<div
key={label}
style={{
background: '#f6f5f1',
padding: '25px 22px',
minHeight: '145px',
}}
>
<small
style={{
display: 'block',
fontSize: '10px',
letterSpacing: '0.14em',
opacity: 0.55,
marginBottom: '22px',
}}
>
{label}
</small>

<strong
style={{
display: 'block',
fontSize: '25px',
fontWeight: 500,
marginBottom: '7px',
}}
>
{value}
</strong>

<span
style={{
fontSize: '12px',
opacity: 0.55,
}}
>
{note}
</span>
</div>
))}
</div>
</section>

<section style={{ marginBottom: '72px' }}>
<div className="section-label">02 / MY MEASUREMENTS</div>

<div
style={{
display: 'grid',
gridTemplateColumns:
'minmax(0, 1fr) auto',
gap: '30px',
marginTop: '18px',
padding: '30px',
background: '#fff',
border: '1px solid #dedcd5',
}}
>
<div>
<div
style={{
display: 'grid',
gridTemplateColumns:
'repeat(auto-fit, minmax(125px, 1fr))',
gap: '1px',
background: '#dedcd5',
}}
>
{[
['height_cm', 'Height'],
['chest_cm', 'Chest'],
['waist_cm', 'Waist'],
['hips_cm', 'Hips'],
['shoulder_cm', 'Shoulder'],
['inseam_cm', 'Inseam'],
].map(([field, label]) => (
<div
key={field}
style={{
background: '#fdfdfb',
padding: '18px',
}}
>
<small
style={{
display: 'block',
fontSize: '10px',
letterSpacing: '0.12em',
opacity: 0.55,
marginBottom: '8px',
}}
>
{label.toUpperCase()}
</small>

<strong
style={{
fontSize: '21px',
fontWeight: 500,
}}
>
{measurements[field] || '—'}

{measurements[field] && (
<span
style={{
fontSize: '11px',
marginLeft: '4px',
opacity: 0.5,
}}
>
cm
</span>
)}
</strong>
</div>
))}
</div>
</div>

<button
type="button"
className="secondary-button"
onClick={openMeasurementsEditor}
style={{ alignSelf: 'center' }}
>
{measurementsSaved ? (
<Pencil size={15} />
) : (
<Plus size={15} />
)}

{measurementsSaved
? 'Edit measurements'
: 'Add measurements'}
</button>
</div>
</section>

<section style={{ marginBottom: '72px' }}>
<div className="section-label">03 / MY STYLE</div>

<div
style={{
marginTop: '18px',
padding: '30px',
background: '#fff',
border: '1px solid #dedcd5',
}}
>
{editingStyle ? (
<div
style={{
display: 'grid',
gridTemplateColumns:
'repeat(auto-fit, minmax(220px, 1fr))',
gap: '18px',
}}
>
{[
['preferred_fit', 'Preferred fit'],
['preferred_style', 'Preferred style'],
['preferred_colors', 'Preferred colors'],
['preferred_categories', 'Preferred categories'],
].map(([field, label]) => (
<label key={field}>
<span
style={{
display: 'block',
fontSize: '10px',
letterSpacing: '0.12em',
opacity: 0.55,
marginBottom: '8px',
}}
>
{label.toUpperCase()}
</span>

{field === 'preferred_fit' ? (
<select
value={preferences[field]}
onChange={(event) =>
setPreferences((current) => ({
...current,
[field]: event.target.value,
}))
}
style={{
width: '100%',
padding: '13px 14px',
border: '1px solid #d8d6cf',
background: '#fdfdfb',
}}
>
{[
'Slim Fit',
'Regular Fit',
'Relaxed Fit',
'Oversized Fit',
].map((fit) => (
<option key={fit}>{fit}</option>
))}
</select>
) : (
<input
value={preferences[field]}
onChange={(event) =>
setPreferences((current) => ({
...current,
[field]: event.target.value,
}))
}
placeholder={
field === 'preferred_colors'
? 'Black, white, navy...'
: field === 'preferred_categories'
? 'Shirts, trousers, jackets...'
: 'Minimal, streetwear, classic...'
}
style={{
width: '100%',
padding: '13px 14px',
border: '1px solid #d8d6cf',
background: '#fdfdfb',
}}
/>
)}
</label>
))}

<div
style={{
gridColumn: '1 / -1',
display: 'flex',
justifyContent: 'flex-end',
gap: '10px',
flexWrap: 'wrap',
marginTop: '6px',
}}
>
<button
type="button"
className="secondary-button"
onClick={() => setEditingStyle(false)}
>
Cancel
</button>

<button
type="button"
className="import-button"
onClick={saveStylePreferences}
disabled={savingStyle}
>
{savingStyle ? (
<>
<LoaderCircle size={16} className="spin" />
Saving...
</>
) : (
<>
<Save size={16} />
Save style
</>
)}
</button>
</div>
</div>
) : (
<>
<div
style={{
display: 'grid',
gridTemplateColumns:
'repeat(auto-fit, minmax(190px, 1fr))',
gap: '22px',
}}
>
{[
['Preferred fit', preferences.preferred_fit],
[
'Preferred style',
preferences.preferred_style || 'Not set',
],
[
'Preferred colors',
preferences.preferred_colors || 'Not set',
],
[
'Preferred categories',
preferences.preferred_categories || 'Not set',
],
].map(([label, value]) => (
<div key={label}>
<small
style={{
display: 'block',
fontSize: '10px',
letterSpacing: '0.12em',
opacity: 0.55,
marginBottom: '8px',
}}
>
{label.toUpperCase()}
</small>

<strong
style={{
fontSize: '17px',
fontWeight: 500,
}}
>
{value}
</strong>
</div>
))}
</div>

{styleSaveMessage && (
<p
style={{
margin: '20px 0 0',
fontSize: '12px',
opacity: 0.65,
}}
>
{styleSaveMessage}
</p>
)}

<div
style={{
display: 'flex',
justifyContent: 'flex-end',
marginTop: '25px',
}}
>
<button
type="button"
className="secondary-button"
onClick={() => setEditingStyle(true)}
>
<Pencil size={15} />
Edit style
</button>
</div>
</>
)}
</div>
</section>

<section style={{ marginBottom: '72px' }}>
<div className="section-label">04 / MY WARDROBE</div>

<div
style={{
marginTop: '18px',
padding: '30px',
background: '#fff',
border: '1px solid #dedcd5',
}}
>
<div
style={{
display: 'flex',
gap: '10px',
maxWidth: '650px',
marginBottom: '25px',
}}
>
<input
value={newWardrobeItem}
onChange={(event) =>
setNewWardrobeItem(event.target.value)
}
onKeyDown={(event) => {
if (event.key === 'Enter') addWardrobeItem()
}}
placeholder="Add a wardrobe piece..."
style={{
flex: 1,
minWidth: 0,
padding: '14px',
border: '1px solid #d8d6cf',
background: '#fdfdfb',
}}
/>

<button
type="button"
className="import-button"
onClick={addWardrobeItem}
>
<Plus size={16} />
Add item
</button>
</div>

{wardrobeItems.length === 0 ? (
<p style={{ opacity: 0.55, fontSize: '13px' }}>
Your wardrobe is empty. Add the pieces you already own.
</p>
) : (
<div
style={{
display: 'grid',
gridTemplateColumns:
'repeat(auto-fill, minmax(190px, 1fr))',
gap: '1px',
background: '#dedcd5',
}}
>
{wardrobeItems.map((item, index) => (
<div
key={item.id || `${item.name}-${index}`}
style={{
background: '#fdfdfb',
padding: '18px',
display: 'flex',
justifyContent: 'space-between',
gap: '12px',
alignItems: 'center',
}}
>
<span style={{ fontSize: '14px' }}>
{item.name}
</span>

<button
type="button"
onClick={() => removeWardrobeItem(item)}
aria-label={`Delete ${item.name}`}
style={{
border: 'none',
background: 'transparent',
cursor: 'pointer',
opacity: 0.55,
padding: '4px',
}}
>
<Trash2 size={15} />
</button>
</div>
))}
</div>
)}
</div>
</section>

<section style={{ marginBottom: '72px' }}>
<div className="section-label">05 / SAVED PRODUCTS</div>

<div
style={{
marginTop: '18px',
display: 'grid',
gridTemplateColumns:
'repeat(auto-fill, minmax(250px, 1fr))',
gap: '1px',
background: '#dedcd5',
border: '1px solid #dedcd5',
}}
>
{savedProducts.length === 0 ? (
<div
style={{
gridColumn: '1 / -1',
background: '#fff',
padding: '35px',
opacity: 0.58,
fontSize: '13px',
}}
>
No saved products yet. Explore VESTA and import a garment
to create your first saved product.
</div>
) : (
savedProducts.map((saved) => (
<article
key={saved.id}
style={{
background: '#fff',
minHeight: '300px',
display: 'flex',
flexDirection: 'column',
}}
>
{saved.image_url ? (
<img
src={saved.image_url}
alt={saved.product_name || 'Saved product'}
style={{
width: '100%',
height: '190px',
objectFit: 'cover',
background: '#efeee9',
}}
/>
) : (
<div
style={{
height: '190px',
display: 'grid',
placeItems: 'center',
background: '#efeee9',
}}
>
<Shirt size={36} />
</div>
)}

<div style={{ padding: '20px' }}>
<small
style={{
display: 'block',
fontSize: '10px',
letterSpacing: '0.12em',
opacity: 0.55,
marginBottom: '8px',
}}
>
{saved.category || 'GARMENT'}
</small>

<h3
style={{
margin: '0 0 12px',
fontSize: '19px',
fontWeight: 500,
}}
>
{saved.product_name || 'Imported garment'}
</h3>

<div
style={{
display: 'flex',
flexWrap: 'wrap',
gap: '7px',
fontSize: '11px',
opacity: 0.65,
}}
>
<span>{saved.color || 'Colour —'}</span>
<span>·</span>
<span>{saved.fit || 'Fit —'}</span>
</div>

<div style={{ display: 'flex', gap: '8px', marginTop: '18px', flexWrap: 'wrap' }}>
  <button
    type="button"
    className="primary-button"
    style={{ fontSize: '11px', padding: '6px 12px', cursor: 'pointer' }}
    onClick={() => {
      const normalized = normalizeProductData({
        id: saved.id,
        name: saved.product_name,
        category: saved.category,
        color: saved.color,
        fit: saved.fit,
        description: saved.description,
        image: saved.image_url,
      })
      setProduct(normalized)
      setCompareProduct({
        name: normalized.name || '',
        color: normalized.color || '',
        category: normalized.category || '',
        fit: normalized.fit || '',
      })
      setActiveView('dashboard')
    }}
  >
    Analyse in VESTA
  </button>
  {saved.product_url && (
    <a
      href={saved.product_url}
      target="_blank"
      rel="noreferrer"
      className="secondary-button"
      style={{
        display: 'inline-flex',
        textDecoration: 'none',
        fontSize: '11px',
        padding: '6px 12px',
      }}
    >
      View product
      <ExternalLink size={14} />
    </a>
  )}
</div>
</div>
</article>
))
)}
</div>
</section>

<section style={{ marginBottom: '72px' }}>
<div className="section-label">06 / COMPARISONS</div>

<div
style={{
marginTop: '18px',
display: 'grid',
gap: '1px',
background: '#dedcd5',
border: '1px solid #dedcd5',
}}
>
{savedComparisons.length === 0 ? (
<div
style={{
background: '#fff',
padding: '35px',
opacity: 0.58,
fontSize: '13px',
}}
>
No saved comparisons yet. Use Compare + What-If in an
imported product analysis.
</div>
) : (
savedComparisons.map((comparison, index) => (
<div
key={
comparison.id ||
`${comparison.product_name}-${index}`
}
style={{
background: '#fff',
padding: '22px 25px',
display: 'grid',
gridTemplateColumns:
'minmax(0, 1fr) auto',
gap: '20px',
alignItems: 'center',
}}
>
<div>
<small
style={{
display: 'block',
fontSize: '10px',
letterSpacing: '0.12em',
opacity: 0.55,
marginBottom: '8px',
}}
>
COMPARISON
</small>

<strong
style={{
fontSize: '17px',
fontWeight: 500,
}}
>
{comparison.product_name || 'Current garment'}
</strong>

<span
style={{
margin: '0 8px',
opacity: 0.4,
}}
>
vs
</span>

<strong
style={{
fontSize: '17px',
fontWeight: 500,
}}
>
{comparison.alternative_name || 'Alternative'}
</strong>

<div
style={{
marginTop: '9px',
fontSize: '12px',
opacity: 0.58,
}}
>
{comparison.what_if_color
? `What-if colour: ${comparison.what_if_color}`
: 'Saved decision comparison'}
</div>
</div>

<div style={{ textAlign: 'right' }}>
<strong
style={{
display: 'block',
fontSize: '28px',
fontWeight: 500,
}}
>
{comparison.alternative_score ??
comparison.wardrobe_score ??
'—'}

{comparison.alternative_score != null ||
comparison.wardrobe_score != null
? '%'
: ''}
</strong>

<small style={{ opacity: 0.55 }}>
estimated compatibility
</small>
</div>
</div>
))
)}
</div>
</section>

<section style={{ marginBottom: '72px' }}>
<div className="section-label">07 / PROFILE</div>

<div
style={{
marginTop: '18px',
padding: '30px',
background: '#fff',
border: '1px solid #dedcd5',
maxWidth: '780px',
}}
>
<div
style={{
display: 'flex',
justifyContent: 'space-between',
alignItems: 'center',
gap: '20px',
flexWrap: 'wrap',
marginBottom: '25px',
}}
>
<div>
<div
style={{
width: '48px',
height: '48px',
border: '1px solid #d8d6cf',
display: 'grid',
placeItems: 'center',
marginBottom: '15px',
}}
>
<User size={19} />
</div>

<h3
style={{
margin: 0,
fontSize: '23px',
fontWeight: 500,
}}
>
Your VESTA profile
</h3>
</div>

{!editingProfile && (
  <button
    type="button"
    className="secondary-button"
    onClick={() => {
      const current = getUserDisplayName()
      setProfileName(current === 'there' ? '' : current)
      setEditingProfile(true)
    }}
  >
    <Pencil size={15} />
    Edit name
  </button>
)}
</div>

{editingProfile ? (
  <div
    style={{
      display: 'flex',
      gap: '10px',
      maxWidth: '650px',
      flexWrap: 'wrap',
    }}
  >
    <input
      value={profileName}
      onChange={(event) =>
        setProfileName(event.target.value)
      }
      onKeyDown={(event) => {
        if (event.key === 'Enter') saveProfileName()
      }}
      placeholder="Full name"
      style={{
        flex: 1,
        minWidth: '220px',
        padding: '14px',
        border: '1px solid #d8d6cf',
        background: '#fdfdfb',
      }}
    />

    <button
      type="button"
      className="import-button"
      onClick={saveProfileName}
      disabled={savingProfile}
    >
      {savingProfile ? (
        <LoaderCircle
          size={16}
          className="spin"
        />
      ) : (
        <Save size={16} />
      )}
      Save
    </button>

    <button
      type="button"
      className="secondary-button"
      onClick={() => setEditingProfile(false)}
    >
      Cancel
    </button>
  </div>
) : (
<div
style={{
display: 'grid',
gridTemplateColumns:
'repeat(auto-fit, minmax(220px, 1fr))',
gap: '20px',
}}
>
<div>
<small
style={{
display: 'block',
fontSize: '10px',
letterSpacing: '0.12em',
opacity: 0.55,
marginBottom: '8px',
}}
>
FULL NAME
</small>

<strong
style={{
fontSize: '17px',
fontWeight: 500,
}}
>
{getUserDisplayName()}
</strong>
</div>

<div>
<small
style={{
display: 'block',
fontSize: '10px',
letterSpacing: '0.12em',
opacity: 0.55,
marginBottom: '8px',
}}
>
EMAIL
</small>

<strong
style={{
fontSize: '15px',
fontWeight: 500,
}}
>
{session.user.email}
</strong>
</div>
</div>
)}
</div>
</section>

<div
style={{
borderTop: '1px solid #d8d6cf',
paddingTop: '25px',
display: 'flex',
justifyContent: 'space-between',
gap: '20px',
flexWrap: 'wrap',
alignItems: 'center',
}}
>
<span
style={{
fontSize: '11px',
letterSpacing: '0.1em',
opacity: 0.5,
}}
>
{session.user.email}
</span>

<button
type="button"
className="secondary-button"
onClick={() => loadDashboardData(session)}
>
<RefreshCw size={15} />
Refresh dashboard
</button>
</div>
</div>
</section>
)}

{session && showMeasurements && (
<div
style={{
position: 'fixed',
inset: 0,
zIndex: 900,
background: '#f6f5f1',
overflowY: 'auto',
padding: '30px 20px',
}}
onClick={(event) => {
  if (event.target === event.currentTarget) {
    setShowMeasurements(false)
    setEditingMeasurements(false)
    setMeasurementError('')
  }
}}
>
<motion.div
initial={{
opacity: 0,
y: 25,
}}
animate={{
opacity: 1,
y: 0,
}}
style={{
width: '100%',
maxWidth: '760px',
margin: '40px auto',
position: 'relative',
}}
onClick={(event) => event.stopPropagation()}
>
<button
  type="button"
  onClick={() => {
    setShowMeasurements(false)
    setEditingMeasurements(false)
    setMeasurementError('')
  }}
  style={{
    position: 'absolute',
    top: '0px',
    right: '0px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }}
  aria-label="Close fit profile"
>
  <X size={22} />
</button>

<div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
  <img src="/vesta-logo.png" alt="VESTA" style={{ height: '22px', width: 'auto', objectFit: 'contain' }} />
  <span className="section-label" style={{ margin: 0 }}>FIT PROFILE</span>
</div>

<h1
style={{
fontSize: 'clamp(38px, 6vw, 70px)',
lineHeight: 0.95,
marginTop: '14px',
marginBottom: '18px',
}}
>
{measurementsSaved && !editingMeasurements
? 'Your fit'
: "Let's get your"}
<br />
<span>
{measurementsSaved && !editingMeasurements
? 'profile.'
: 'fit right.'}
</span>
</h1>

<p
style={{
maxWidth: '600px',
opacity: 0.7,
lineHeight: 1.7,
marginBottom: '32px',
}}
>
{measurementsSaved && !editingMeasurements
? 'These measurements are saved to your VESTA profile and will be used for future fit decisions.'
: 'Enter your measurements once. VESTA will use them to make future fit decisions more personalized.'}
</p>

{measurementLoading ? (
<div
style={{
display: 'flex',
alignItems: 'center',
gap: '10px',
padding: '30px 0',
}}
>
<LoaderCircle
size={22}
className="spin"
/>
Loading your fit profile...
</div>
) : measurementsSaved &&
!editingMeasurements ? (
<div
style={{
background: '#fff',
border: '1px solid #dedcd5',
padding: '28px',
}}
>
<div
style={{
display: 'grid',
gridTemplateColumns:
'repeat(auto-fit, minmax(210px, 1fr))',
gap: '18px',
}}
>
{[
['height_cm', 'Height'],
['chest_cm', 'Chest'],
['waist_cm', 'Waist'],
['hips_cm', 'Hips'],
['shoulder_cm', 'Shoulder'],
['inseam_cm', 'Inseam'],
].map(([field, label]) => (
<div
key={field}
style={{
padding: '18px',
border: '1px solid #e2e0d9',
background: '#fdfdfb',
}}
>
<small
style={{
display: 'block',
fontSize: '10px',
letterSpacing: '0.12em',
opacity: 0.6,
marginBottom: '8px',
}}
>
{label.toUpperCase()}
</small>

<strong
style={{
fontSize: '24px',
fontWeight: 500,
}}
>
{measurements[field]}

<span
style={{
fontSize: '12px',
marginLeft: '5px',
opacity: 0.55,
}}
>
cm
</span>
</strong>
</div>
))}
</div>

{measurementError && (
<div
className="error-message"
style={{
marginTop: '18px',
}}
>
{measurementError}
</div>
)}

<div
style={{
display: 'flex',
justifyContent: 'space-between',
alignItems: 'center',
gap: '15px',
marginTop: '28px',
flexWrap: 'wrap',
}}
>
<span
style={{
fontSize: '12px',
opacity: 0.55,
}}
>
✓ Fit profile saved to your VESTA account.
</span>

<div
style={{
display: 'flex',
gap: '10px',
flexWrap: 'wrap',
}}
>
<button
type="button"
className="secondary-button"
onClick={editMeasurements}
>
Edit measurements
</button>

<button
type="button"
className="import-button"
onClick={continueToVesta}
>
Continue to VESTA
<ArrowRight size={17} />
</button>
</div>
</div>
</div>
) : (
<form
onSubmit={handleSaveMeasurements}
style={{
background: '#fff',
border: '1px solid #dedcd5',
padding: '28px',
}}
>
<div
style={{
display: 'grid',
gridTemplateColumns:
'repeat(auto-fit, minmax(210px, 1fr))',
gap: '18px',
}}
>
{[
['height_cm', 'Height', 'cm'],
['chest_cm', 'Chest', 'cm'],
['waist_cm', 'Waist', 'cm'],
['hips_cm', 'Hips', 'cm'],
['shoulder_cm', 'Shoulder', 'cm'],
['inseam_cm', 'Inseam', 'cm'],
].map(
([field, label, unit]) => (
<label
key={field}
style={{
display: 'block',
}}
>
<span
style={{
display: 'block',
fontSize: '11px',
letterSpacing: '0.12em',
marginBottom: '8px',
opacity: 0.6,
}}
>
{label.toUpperCase()} ({unit})
</span>

<input
type="number"
min="0"
step="0.1"
value={measurements[field]}
onChange={(event) =>
updateMeasurement(
field,
event.target.value,
)
}
placeholder={`Enter ${label.toLowerCase()}`}
required
style={{
width: '100%',
padding: '14px 15px',
border: '1px solid #d8d6cf',
background: '#fdfdfb',
fontSize: '15px',
outline: 'none',
}}
/>
</label>
),
)}
</div>

{measurementError && (
<div
className="error-message"
style={{
marginTop: '18px',
}}
>
{measurementError}
</div>
)}

<div
style={{
display: 'flex',
justifyContent: 'space-between',
alignItems: 'center',
gap: '15px',
marginTop: '28px',
flexWrap: 'wrap',
}}
>
<span
style={{
fontSize: '12px',
opacity: 0.55,
}}
>
Measurements are stored securely in your VESTA profile.
</span>

<div
style={{
display: 'flex',
gap: '10px',
flexWrap: 'wrap',
}}
>
{measurementsSaved && (
<button
type="button"
className="secondary-button"
onClick={() => {
setEditingMeasurements(false)
setMeasurementError('')
}}
>
Cancel
</button>
)}

<button
type="submit"
className="import-button"
disabled={measurementSaving}
>
{measurementSaving ? (
<>
<LoaderCircle
size={17}
className="spin"
/>
Saving profile...
</>
) : (
<>
{measurementsSaved
? 'Update fit profile'
: 'Save fit profile'}
<ArrowRight size={17} />
</>
)}
</button>
</div>
</div>
</form>
)}
</motion.div>
</div>
)}

{activeView === 'home' &&
!showExplorer &&
!showMeasurements && (
<section className="hero">
<motion.div
className="hero-content"
initial={{
opacity: 0,
y: 30,
}}
animate={{
opacity: 1,
y: 0,
}}
transition={{
duration: 0.7,
}}
>
<div className="eyebrow">
<Sparkles size={15} />
AI FASHION INTELLIGENCE
</div>

<h1>
Fashion,
<br />
<span>before you buy.</span>
</h1>

<p className="hero-description">
Find clothing anywhere. Understand the
product, personalize the decision, build
outfits, match your wardrobe, and compare
before checkout.
</p>

<div className="hero-actions">
<button
type="button"
className="primary-button"
onClick={startExploring}
>
Start exploring
<ArrowRight size={18} />
</button>

<a
href="#how-it-works"
className="secondary-button"
>
See how it works
</a>
</div>

<p className="hero-note">
FIND · UNDERSTAND · PERSONALIZE · BUILD ·
MATCH · DECIDE
</p>
</motion.div>

<motion.div
className="hero-intelligence"
initial={{
opacity: 0,
x: 30,
}}
animate={{
opacity: 1,
x: 0,
}}
transition={{
duration: 0.8,
delay: 0.15,
}}
>
<div className="intelligence-top">
<img src="/vesta-logo-white.png" alt="VESTA" style={{ height: '22px', width: 'auto', objectFit: 'contain', display: 'block' }} />

<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
<button
type="button"
onClick={() => setShowHeroSpline(!showHeroSpline)}
style={{
background: showHeroSpline ? '#d4af37' : 'rgba(255, 255, 255, 0.12)',
color: showHeroSpline ? '#111' : '#fff',
border: '1px solid rgba(255, 255, 255, 0.2)',
borderRadius: '2px',
padding: '3px 9px',
fontSize: '10px',
fontWeight: 600,
cursor: 'pointer',
letterSpacing: '0.08em',
display: 'flex',
alignItems: 'center',
gap: '5px',
transition: 'all 0.2s ease',
}}
>
<Sparkles size={11} />
{showHeroSpline ? 'Diagram' : '3D Silhouette'}
</button>

<span className="online-dot">
<i></i>
INTELLIGENCE ONLINE
</span>
</div>
</div>

{showHeroSpline ? (
<div style={{ marginTop: '14px', width: '100%', borderRadius: '4px', overflow: 'hidden' }}>
<SplineMannequin
measurements={measurements}
detectedFit="Regular Fit"
height="340px"
compact
/>
</div>
) : (
<>
<div className="intelligence-main">
<span className="intelligence-number">
01
</span>

<div>
<p className="intelligence-label">
HOW VESTA THINKS
</p>

<h3>
Understand
<br />
the garment.
</h3>

<p>
Product information becomes structured
fashion intelligence.
</p>
</div>
</div>

<div className="intelligence-flow">
<span>PRODUCT</span>
<b>→</b>
<span>FIT</span>
<b>→</b>
<span>STYLE</span>
<b>→</b>
<span>DECISION</span>
</div>
</>
)}
</motion.div>
</section>
)}

{showExplorer && (
<motion.section
className="explorer-section"
id="product-explorer"
initial={{
opacity: 0,
y: 25,
}}
animate={{
opacity: 1,
y: 0,
}}
transition={{
duration: 0.5,
}}
>
<div className="explorer-top">
<button
type="button"
className="back-button"
onClick={() => {
setShowExplorer(false)
resetProduct()
setActiveView('dashboard')
}}
>
<ArrowLeft size={16} />
Back
</button>

<div className="explorer-index" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
  <img src="/vesta-logo.png" alt="VESTA" style={{ height: '18px', width: 'auto', objectFit: 'contain' }} />
  <span>/ 01</span>
</div>
</div>

<div className="explorer-heading">
<div className="section-label">
VESTA / PRODUCT ANALYSIS
</div>

<h2>
Start with
<br />
a garment.
</h2>

<p>
Paste a product link from a supported fashion
retailer. VESTA will analyse the garment before
you make a decision.
</p>
</div>

<div className="stepper">
<div className="step active">
<span>01</span>
Product
</div>

<div className="step-line"></div>

<div className="step">
<span>02</span>
Personalize
</div>

<div className="step-line"></div>

<div className="step">
<span>03</span>
Build
</div>

<div className="step-line"></div>

<div className="step">
<span>04</span>
Decide
</div>
</div>

{!product && (
<div className="import-panel">
<div className="import-icon">
<LinkIcon size={24} />
</div>

<div className="import-content">
<div className="import-label">
IMPORT PRODUCT
</div>

<h3>
Where did you find it?
</h3>

<p>
Paste the product page URL below and VESTA
will extract the garment information.
</p>

<div className="url-input-wrapper">
<LinkIcon size={17} />

<input
type="url"
value={productUrl}
onChange={(event) =>
setProductUrl(
event.target.value,
)
}
onKeyDown={(event) => {
if (event.key === 'Enter') {
importProduct()
}
}}
placeholder="Paste product URL here..."
aria-label="Product URL"
/>
</div>

<button
type="button"
className="import-button"
onClick={importProduct}
disabled={loading}
>
{loading ? (
<>
<LoaderCircle
size={18}
className="spin"
/>
Analysing product...
</>
) : (
<>
Analyse product
<ArrowRight size={18} />
</>
)}
</button>

{error && (
<div className="error-message">
{error}
</div>
)}
</div>
</div>
)}

{product && (
<>
<motion.div
className="product-result"
initial={{
opacity: 0,
y: 20,
}}
animate={{
opacity: 1,
y: 0,
}}
>
<div className="product-result-image">
{product.image ? (
<img
src={product.image}
alt={product.name || 'Imported garment'}
/>
) : (
<div className="no-image">
<Shirt size={48} />
<span>No image available</span>
</div>
)}
<div className="understood-badge">
<Check size={12} />
<span>UNDERSTOOD</span>
</div>
</div>

<div className="product-result-info">
<div className="section-label">
VESTA / PRODUCT UNDERSTANDING
</div>

<h2>
{product.name ||
'Imported garment'}
</h2>

<p className="result-description">
{product.description ||
'VESTA successfully extracted the available product information.'}
</p>

<div className="product-details">
<div
  style={{ cursor: 'pointer' }}
  title="Click to toggle category"
  onClick={() => {
    const cats = ['T-Shirt', 'Shirt', 'Hoodie / Sweatshirt', 'Jacket / Outerwear', 'Trousers / Pants', 'Jeans']
    const currentIdx = cats.indexOf(product.category)
    const nextCat = cats[(currentIdx + 1) % cats.length]
    setProduct((prev) => ({ ...prev, category: nextCat }))
    setCompareProduct((prev) => ({ ...prev, category: nextCat }))
  }}
>
<small style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
  CATEGORY
  <Pencil size={11} style={{ opacity: 0.5 }} />
</small>
<strong>
{product.category ||
'T-Shirt'}
</strong>
</div>

<div
  style={{ cursor: 'pointer' }}
  title="Click to toggle colour"
  onClick={() => {
    const cols = ['Blue', 'Navy', 'Black', 'White', 'Grey', 'Green', 'Beige']
    const currentIdx = cols.indexOf(product.color)
    const nextCol = cols[(currentIdx + 1) % cols.length]
    setProduct((prev) => ({ ...prev, color: nextCol }))
    setCompareProduct((prev) => ({ ...prev, color: nextCol }))
  }}
>
<small style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
  COLOUR
  <Pencil size={11} style={{ opacity: 0.5 }} />
</small>
<strong>
{product.color ||
'Blue'}
</strong>
</div>

<div
  style={{ cursor: 'pointer' }}
  title="Click to toggle fit"
  onClick={() => {
    const fits = ['Regular Fit', 'Slim Fit', 'Relaxed Fit', 'Oversized']
    const currentIdx = fits.indexOf(product.fit)
    const nextFit = fits[(currentIdx + 1) % fits.length]
    setProduct((prev) => ({ ...prev, fit: nextFit }))
    setCompareProduct((prev) => ({ ...prev, fit: nextFit }))
  }}
>
<small style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
  FIT
  <Pencil size={11} style={{ opacity: 0.5 }} />
</small>
<strong>
{product.fit ||
'Regular Fit'}
</strong>
</div>
</div>

<div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
    <span style={{ opacity: 0.6, fontWeight: 600, letterSpacing: '0.04em' }}>COLOUR:</span>
    {['Blue', 'Navy', 'Black', 'White', 'Grey', 'Green', 'Beige'].map((col) => (
      <button
        key={col}
        type="button"
        onClick={() => {
          setProduct((prev) => ({ ...prev, color: col }))
          setCompareProduct((prev) => ({ ...prev, color: col }))
        }}
        style={{
          padding: '3px 8px',
          background: product.color === col ? '#111' : '#f0eee8',
          color: product.color === col ? '#fff' : '#222',
          border: '1px solid #dcdad2',
          borderRadius: '2px',
          cursor: 'pointer',
          fontSize: '10px',
          fontWeight: product.color === col ? 600 : 400,
        }}
      >
        {col}
      </button>
    ))}
  </div>

  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
    <span style={{ opacity: 0.6, fontWeight: 600, letterSpacing: '0.04em' }}>CATEGORY:</span>
    {['T-Shirt', 'Shirt', 'Hoodie', 'Jacket', 'Trousers'].map((cat) => (
      <button
        key={cat}
        type="button"
        onClick={() => {
          setProduct((prev) => ({ ...prev, category: cat }))
          setCompareProduct((prev) => ({ ...prev, category: cat }))
        }}
        style={{
          padding: '3px 8px',
          background: product.category === cat ? '#111' : '#f0eee8',
          color: product.category === cat ? '#fff' : '#222',
          border: '1px solid #dcdad2',
          borderRadius: '2px',
          cursor: 'pointer',
          fontSize: '10px',
          fontWeight: product.category === cat ? 600 : 400,
        }}
      >
        {cat}
      </button>
    ))}
  </div>
</div>

<div className="result-actions">
<button
type="button"
className="change-product"
onClick={resetProduct}
>
Analyse another
</button>
</div>
</div>
</motion.div>

<div className="feature-hub">
<div className="feature-hub-heading">
<div>
<div className="section-label">
VESTA / INTELLIGENCE LAYERS
</div>

<h2>
Now make
<br />
the decision.
</h2>
</div>

<p>
Move from product understanding to
personalized fashion intelligence.
</p>
</div>

<div className="feature-grid">
{featureCards.map(
({
id,
number,
title,
description,
icon: Icon,
}) => (
<button
type="button"
className={`feature-card ${
activeFeature === id
? 'active'
: ''
}`}
key={id}
onClick={() =>
selectFeature(id)
}
>
<div className="feature-card-top">
<span>{number}</span>
<Icon size={22} />
</div>

<h3>{title}</h3>

<p>{description}</p>

<ArrowRight size={17} />
</button>
),
)}
</div>
</div>

<motion.section
className="feature-workspace"
id="feature-fit"
>
<div className="workspace-heading">
<div>
<div className="section-label">
VESTA / 02
</div>

<h2>
Fit estimation.
</h2>
</div>

<Ruler size={30} />
</div>

<div className="fit-workspace">
<div className="fit-controls">
<p>What fit do you usually prefer?</p>

<div className="fit-options">
{[
'Slim Fit',
'Regular Fit',
'Relaxed Fit',
'Oversized Fit',
].map((fit) => (
<button
type="button"
key={fit}
className={
fitPreference === fit
? 'selected'
: ''
}
onClick={() => {
setFitPreference(fit)
setPreferences((current) => ({
...current,
preferred_fit: fit,
}))
}}
>
{fit}
</button>
))}
</div>

<p style={{ marginTop: '20px' }}>What is your usual garment size?</p>
<div className="size-selector-row">
{['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((sz) => (
<button
type="button"
key={sz}
className={`size-pill ${fitUsualSize === sz ? 'selected' : ''}`}
onClick={() => setFitUsualSize(sz)}
>
{sz}
</button>
))}
</div>

<div style={{ marginTop: '24px' }}>
<button
type="button"
className="import-button"
onClick={() => generateFitEstimation(fitUsualSize, fitPreference)}
disabled={fitLoading || !product}
style={{ width: '100%' }}
>
{fitLoading ? (
<>
<LoaderCircle size={16} className="spin" />
IBM Granite Reasoning...
</>
) : (
<>
<Sparkles size={16} />
Generate IBM Granite Fit Analysis
</>
)}
</button>
</div>

{fitError && (
<div className="error-message" style={{ marginTop: '14px' }}>
{fitError}
</div>
)}

{fitEstimation && (
<div className="fit-ai-card">
<div className="fit-ai-header">
<strong style={{ fontSize: '15px', color: '#111' }}>
{fitEstimation.recommendation}
</strong>
<span className={`confidence-badge confidence-${(fitEstimation.confidence || 'medium').toLowerCase()}`}>
{fitEstimation.confidence} Confidence
</span>
</div>

<div className="fit-signal-callout">
<strong>Garment Silhouette:</strong> {fitEstimation.garmentSignal || product?.fit || 'Standard Cut'}
</div>

<p style={{ fontSize: '12px', lineHeight: 1.6, color: '#555', margin: 0 }}>
{fitEstimation.reasoning}
</p>

{fitEstimation.advice && (
<div className="fit-ai-advice">
💡 <strong>Sizing Advice:</strong> {fitEstimation.advice}
</div>
)}
</div>
)}

<p className="workspace-note" style={{ marginTop: '18px' }}>
VESTA compares your personal fit profile and usual size against the product specifications using IBM Granite logic.
</p>
</div>

<div className="score-panel">
<small>FIT COMPATIBILITY</small>

<strong>{getFitScore()}%</strong>

<div className="score-bar">
<span style={{ width: `${getFitScore()}%` }}></span>
</div>

<p style={{ marginBottom: '16px' }}>
Based on selected {fitPreference} and detected {product?.fit || 'garment'} characteristics.
</p>

{/* 3D Mannequin Silhouette in Fit Workspace */}
<div style={{ width: '100%', marginTop: '10px' }}>
<SplineMannequin
measurements={measurements}
detectedFit={product?.fit || fitPreference}
height="320px"
compact
/>
</div>
</div>
</div>
</motion.section>

<motion.section
className="feature-workspace"
id="feature-style"
>
<div className="workspace-heading">
<div>
<div className="section-label">
VESTA / 03
</div>

<h2>
Style intelligence.
</h2>
</div>

<Sparkles size={30} />
</div>

<div className="style-workspace">
<div className="style-intro">
<p>
IBM Granite turns the imported product
into concise, practical style intelligence.
</p>

<button
type="button"
className="import-button"
onClick={generateStyleIntelligence}
disabled={styleLoading}
>
{styleLoading ? (
<>
<LoaderCircle
size={17}
className="spin"
/>
Thinking...
</>
) : (
<>
Generate intelligence
<Sparkles size={17} />
</>
)}
</button>
</div>

<div className="style-result">
{styleLoading ? (
<div className="style-loading">
<LoaderCircle
size={24}
className="spin"
/>
<span>
VESTA is analysing the garment...
</span>
</div>
) : styleError ? (
<div className="error-message">
{styleError}
</div>
) : (stylePoints?.length > 0 || styleResult) ? (
<div className="style-result-content">
<small>
VESTA / STYLE SIGNAL
</small>

<ul className="style-points-list">
{(stylePoints?.length > 0 ? stylePoints : parseStylePoints(styleResult)).map((point, index) => (
<li key={index} className="style-point-item">
<span className="point-bullet">•</span>
<p className="point-text">{point}</p>
</li>
))}
</ul>
</div>
) : (
<div className="style-empty">
<Sparkles size={25} />

<span>
Your style intelligence will
appear here.
</span>
</div>
)}
</div>
</div>
</motion.section>

<motion.section
className="feature-workspace"
id="feature-outfit"
>
<div className="workspace-heading">
<div>
<div className="section-label">
VESTA / 04
</div>

<h2>
Outfit builder.
</h2>
</div>

<Shirt size={30} />
</div>

<div className="lookbook-wrapper">
{/* Lookbook Header with Occasion Pills */}
<div className="lookbook-header">
<div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
<small style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', color: '#999', textTransform: 'uppercase' }}>
STYLING CAPSULE CANVAS
</small>
<strong style={{ fontSize: '16px', color: '#111' }}>
Curated Outfit Combinations
</strong>
</div>

<div className="occasion-pills">
{[
{ id: 'casual', label: 'Casual / Weekend' },
{ id: 'smart_casual', label: 'Smart Casual / Work' },
{ id: 'evening', label: 'Evening / Social' },
].map((occ) => (
<button
type="button"
key={occ.id}
className={`occasion-btn ${lookbookOccasion === occ.id ? 'active' : ''}`}
onClick={() => setLookbookOccasion(occ.id)}
>
{occ.label}
</button>
))}
</div>
</div>

{/* Wardrobe Gap / Overlap Detector Banner */}
{(() => {
const gapAnalysis = getWardrobeGapAnalysis()
if (!gapAnalysis) return null
return (
<div className={`gap-banner ${gapAnalysis.type}`}>
<strong style={{ letterSpacing: '0.05em' }}>{gapAnalysis.badge}:</strong>
<span>{gapAnalysis.message}</span>
</div>
)
})()}

{/* 4-Piece Capsule Lookbook Grid */}
<div className="lookbook-grid">
{generateLookbookSlots(lookbookOccasion, lookbookVariantIndex).map((slot, idx) => (
<div key={idx} className="lookbook-slot">
<div>
<div className="slot-label">
<span>{slot.slotLabel}</span>
</div>

{slot.image && (
<div style={{ width: '100%', height: '110px', marginBottom: '12px', background: '#eceae4', overflow: 'hidden' }}>
<img
src={slot.image}
alt={slot.title}
style={{ width: '100%', height: '100%', objectFit: 'cover' }}
/>
</div>
)}

<div className="slot-title">{slot.title}</div>

<span className={`ownership-badge ${slot.badgeType}`}>
{slot.badgeText}
</span>
</div>

<div className="slot-note">
{slot.note}
</div>
</div>
))}
</div>

{/* Lookbook Actions Footer */}
<div className="lookbook-footer">
<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
<button
type="button"
className="secondary-button"
onClick={() => setLookbookVariantIndex((prev) => prev + 1)}
style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}
>
<RefreshCw size={13} />
Shuffle Pairings
</button>

{lookbookSavedToast && (
<span style={{ fontSize: '12px', color: '#137333', fontWeight: 500 }}>
{lookbookSavedToast}
</span>
)}
</div>

<button
type="button"
className="import-button"
onClick={() => {
setLookbookSavedToast('✓ Outfit look saved to your VESTA Capsule Collection!')
setTimeout(() => setLookbookSavedToast(''), 3000)
}}
style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}
>
<Save size={13} />
Save This Look
</button>
</div>
</div>
</motion.section>

<motion.section
className="feature-workspace"
id="feature-wardrobe"
>
<div className="workspace-heading">
<div>
<div className="section-label">
VESTA / 05
</div>

<h2>
Wardrobe match.
</h2>
</div>

<ShirtIcon size={30} />
</div>

<div className="wardrobe-workspace">
<div className="wardrobe-input">
<p>
Add pieces you already own.
</p>

<div className="wardrobe-add">
<input
value={newWardrobeItem}
onChange={(event) =>
setNewWardrobeItem(
event.target.value,
)
}
onKeyDown={(event) => {
if (event.key === 'Enter') {
addWardrobeItem()
}
}}
placeholder="e.g. beige chinos"
/>

<button
type="button"
onClick={addWardrobeItem}
>
Add
</button>
</div>

<div className="wardrobe-list">
{wardrobeItems.map(
(item, index) => (
<div
className="wardrobe-item"
key={
item.id ||
`${item.name}-${index}`
}
>
<span>{item.name}</span>

<button
type="button"
onClick={() =>
removeWardrobeItem(item)
}
>
×
</button>
</div>
),
)}
</div>
</div>

<div className="score-panel wardrobe-score">
<small>
WARDROBE COMPATIBILITY
</small>

<strong>
{getWardrobeScore()}%
</strong>

<div className="score-bar">
<span
style={{
width: `${getWardrobeScore()}%`,
}}
></span>
</div>

<p>
VESTA evaluates the imported garment
against the wardrobe items you provide.
</p>
</div>
</div>
</motion.section>

<motion.section
className="feature-workspace"
id="feature-compare"
>
<div className="workspace-heading">
<div>
<div className="section-label">
VESTA / 06
</div>

<h2>
Compare + what-if.
</h2>
</div>

<Scale size={30} />
</div>

<div className="compare-workspace">
<div className="compare-card">
<div className="compare-label">
VESTA PRODUCT
</div>

<h3>
{product.name ||
'Current garment'}
</h3>

<div className="compare-facts">
<span>
{product.color ||
'Colour unavailable'}
</span>

<span>
{product.fit ||
'Fit unavailable'}
</span>

<span>
{product.category ||
'Category unavailable'}
</span>
</div>

<strong>
{getWardrobeScore()}%
</strong>

<small>
Decision compatibility
</small>
</div>

<div className="compare-card secondary">
<div className="compare-label">
ALTERNATIVE
</div>

<input
value={compareProduct.name}
onChange={(event) =>
setCompareProduct({
...compareProduct,
name: event.target.value,
})
}
placeholder="Alternative product name"
/>

<input
value={compareProduct.color}
onChange={(event) =>
setCompareProduct({
...compareProduct,
color: event.target.value,
})
}
placeholder="Colour"
/>

<input
value={compareProduct.fit}
onChange={(event) =>
setCompareProduct({
...compareProduct,
fit: event.target.value,
})
}
placeholder="Fit"
/>

<strong>
{getCompareScore(
compareProduct,
)}
%
</strong>

<small>
Estimated compatibility
</small>
</div>
</div>

<div className="what-if-panel">
<div>
<div className="compare-label">
WHAT-IF ANALYSIS
</div>

<h3>
What if the colour changes?
</h3>

<p>
Explore how a different colour could
affect your wardrobe compatibility.
</p>
</div>

<div className="what-if-controls">
<input
value={whatIfColor}
onChange={(event) =>
setWhatIfColor(
event.target.value,
)
}
placeholder="e.g. Black"
/>

<div className="what-if-result">
<span>
New estimated match
</span>

<strong>
{getWhatIfScore()}%
</strong>
</div>
</div>
</div>

<div
style={{
marginTop: '18px',
display: 'flex',
justifyContent: 'flex-end',
alignItems: 'center',
gap: '12px',
flexWrap: 'wrap',
}}
>
{comparisonMessage && (
<span
style={{
fontSize: '12px',
opacity: 0.65,
}}
>
{comparisonMessage}
</span>
)}

<button
type="button"
className="import-button"
onClick={saveComparison}
disabled={comparisonSaving}
>
{comparisonSaving ? (
<>
<LoaderCircle
size={16}
className="spin"
/>
Saving...
</>
) : (
<>
<Save size={16} />
Save comparison
</>
)}
</button>
</div>
</motion.section>

<motion.section
className="decision-summary"
initial={{
opacity: 0,
y: 20,
}}
animate={{
opacity: 1,
y: 0,
}}
style={{ display: 'block' }}
>
<div style={{ display: 'grid', gridTemplateColumns: '1fr 0.45fr', gap: '50px', alignItems: 'center' }}>
<div>
<div className="section-label">VESTA / DECISION MATRIX</div>

<h2>
Everything
<br />
considered.
</h2>

<p>
VESTA synthesizes garment understanding, IBM Granite fit reasoning,
digital wardrobe synergy, and economic cost-per-wear utility into one final purchase verdict.
</p>
</div>

{(() => {
const verdict = getVerdict()
const VerdictIcon = verdict.IconComponent
return (
<div className="decision-score">
<VerdictIcon size={28} color="#d4af37" />

<small>VESTA COMPOSITE SIGNAL</small>

<strong>{verdict.score}%</strong>

<span style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginTop: '6px' }}>
{verdict.label}
</span>
</div>
)
})()}
</div>

{/* Cost-Per-Wear & Final Verdict Matrix */}
{(() => {
const verdict = getVerdict()
const cpw = getCostPerWear()
const totalWears = (parseInt(wearFrequency, 10) || 1) * 12
const VerdictIcon = verdict.IconComponent

return (
<div className="verdict-matrix-container">
{/* Left Column: CPW Simulator */}
<div className="cpw-card">
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
<DollarSign size={16} color="#d4af37" />
<span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', color: '#d4af37' }}>
COST-PER-WEAR SIMULATOR
</span>
</div>
<span style={{ fontSize: '11px', color: '#888' }}>1 Year Projection</span>
</div>

<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
<div>
<label style={{ display: 'block', fontSize: '10px', color: '#aaa', marginBottom: '6px', letterSpacing: '0.08em' }}>
GARMENT PRICE ($)
</label>
<input
type="number"
min="1"
step="1"
value={itemPrice}
onChange={(e) => setItemPrice(Math.max(1, parseFloat(e.target.value) || 0))}
style={{
width: '100%',
padding: '10px 12px',
background: 'rgba(0, 0, 0, 0.4)',
border: '1px solid rgba(255, 255, 255, 0.2)',
color: '#fff',
fontSize: '14px',
outline: 'none',
}}
/>
</div>
<div>
<label style={{ display: 'block', fontSize: '10px', color: '#aaa', marginBottom: '6px', letterSpacing: '0.08em' }}>
MONTHLY FREQUENCY
</label>
<div style={{ padding: '10px 12px', background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#fff', fontSize: '14px' }}>
{wearFrequency}× / month
</div>
</div>
</div>

<div className="cpw-slider-wrap">
<div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#aaa' }}>
<span>Wear Frequency Slider</span>
<span style={{ color: '#d4af37', fontWeight: 600 }}>{totalWears} wears / year</span>
</div>
<input
type="range"
min="1"
max="12"
step="1"
value={wearFrequency}
onChange={(e) => setWearFrequency(parseInt(e.target.value, 10))}
className="cpw-slider"
/>
</div>

<div className="cpw-stat-grid">
<div className="cpw-stat-box">
<small style={{ fontSize: '9px', color: '#888', letterSpacing: '0.1em' }}>PROJECTED CPW</small>
<div style={{ fontSize: '24px', fontWeight: 600, color: '#fff', marginTop: '4px' }}>
${cpw}
<span style={{ fontSize: '11px', color: '#aaa', marginLeft: '4px' }}>/ wear</span>
</div>
</div>

<div className="cpw-stat-box">
<small style={{ fontSize: '9px', color: '#888', letterSpacing: '0.1em' }}>INVESTMENT TIER</small>
<div style={{ fontSize: '13px', fontWeight: 600, color: parseFloat(cpw) < 2.5 ? '#2ec4b6' : parseFloat(cpw) < 5 ? '#ffb703' : '#e63946', marginTop: '6px' }}>
{parseFloat(cpw) < 2.5
? '⭐ High Utility Value'
: parseFloat(cpw) < 5
? '⚖️ Balanced Essential'
: '✨ Occasion / Statement'}
</div>
</div>
</div>
</div>

{/* Right Column: Final Verdict Card */}
<div className="verdict-card">
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
<span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', color: '#d4af37' }}>
FINAL PURCHASE VERDICT
</span>
<span className={`verdict-badge ${verdict.badgeClass}`}>
<VerdictIcon size={13} />
{verdict.label}
</span>
</div>

<p style={{ fontSize: '13px', lineHeight: 1.6, color: '#e0e0e0', margin: 0 }}>
{verdict.headline}
</p>

<div style={{ fontSize: '10px', letterSpacing: '0.1em', color: '#888', textTransform: 'uppercase', marginTop: '4px' }}>
VESTA VERIFICATION CHECKLIST
</div>

<div className="verdict-checklist">
{verdict.reasons.map((reason, idx) => (
<div key={idx} className="checklist-item">
<Check size={12} color="#d4af37" style={{ flexShrink: 0 }} />
<span style={{ fontSize: '11px', lineHeight: 1.4 }}>{reason}</span>
</div>
))}
</div>
</div>
</div>
)
})()}
</motion.section>
</>
)}
</motion.section>
)}

{activeView === 'home' && (
<section
className="workflow"
id="how-it-works"
>
<div className="section-heading">
<p className="section-label">
THE VESTA EXPERIENCE
</p>

<h2>
From discovery
<br />
to decision.
</h2>
</div>

<div className="workflow-grid">
<div className="workflow-card">
<span>01</span>
<ScanSearch size={28} />

<h3>Import</h3>

<p>
Paste a supported product link and let VESTA
understand the garment.
</p>
</div>

<div className="workflow-card">
<span>02</span>
<Ruler size={28} />

<h3>Personalize</h3>

<p>
Estimate fit and understand how the garment
works for your preferences.
</p>
</div>

<div className="workflow-card">
<span>03</span>
<Shirt size={28} />

<h3>Build</h3>

<p>
Create outfits and connect the garment to
the wardrobe you already own.
</p>
</div>

<div className="workflow-card">
<span>04</span>
<GitCompareArrows size={28} />

<h3>Decide</h3>

<p>
Compare alternatives and explore what-if
scenarios before making the final choice.
</p>
</div>
</div>
</section>
)}

{activeView === 'home' && (
  <section
    className="roadmap-section"
    id="roadmap"
    style={{
      padding: '90px 6vw',
      borderTop: '1px solid #dedcd5',
      background: '#f6f5f1',
    }}
  >
    <div className="section-heading" style={{ marginBottom: '48px' }}>
      <p className="section-label">VESTA / ON THE HORIZON</p>
      <h2 style={{ fontSize: 'clamp(36px, 5vw, 62px)', lineHeight: 1.05, margin: '14px 0 16px' }}>
        What's coming next.
      </h2>
      <p style={{ maxWidth: '580px', opacity: 0.65, lineHeight: 1.6 }}>
        Features currently in development to bring decision intelligence directly into your daily shopping workflow.
      </p>
    </div>

    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
      }}
    >
      <div
        style={{
          background: '#fff',
          border: '1px solid #dedcd5',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <Globe size={26} style={{ color: '#111' }} />
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                background: '#111',
                color: '#fff',
                padding: '3px 8px',
                borderRadius: '2px',
              }}
            >
              COMING SOON
            </span>
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '10px' }}>
            VESTA Browser Extension
          </h3>
          <p style={{ fontSize: '13px', opacity: 0.68, lineHeight: 1.6 }}>
            A sidecar panel that activates on any retailer checkout page (Zara, Uniqlo, ASOS, SSENSE), estimating fit and wardrobe overlap in one click.
          </p>
        </div>
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #f0eee8', fontSize: '11px', opacity: 0.55, fontWeight: 500 }}>
          TARGET: CHROME & SAFARI
        </div>
      </div>

      <div
        style={{
          background: '#fff',
          border: '1px solid #dedcd5',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <Camera size={26} style={{ color: '#111' }} />
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                background: '#d4af37',
                color: '#111',
                padding: '3px 8px',
                borderRadius: '2px',
              }}
            >
              IN DEVELOPMENT
            </span>
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '10px' }}>
            AI Wardrobe Photo Scanner
          </h3>
          <p style={{ fontSize: '13px', opacity: 0.68, lineHeight: 1.6 }}>
            Snap a photo of your closet or hangers. Our vision model automatically parses your pieces, extracts palette signatures, and categorizes your wardrobe.
          </p>
        </div>
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #f0eee8', fontSize: '11px', opacity: 0.55, fontWeight: 500 }}>
          TARGET: MOBILE & WEB CAMERA
        </div>
      </div>

      <div
        style={{
          background: '#fff',
          border: '1px solid #dedcd5',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <Sparkles size={26} style={{ color: '#d4af37' }} />
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                background: '#111',
                color: '#fff',
                padding: '3px 8px',
                borderRadius: '2px',
              }}
            >
              LABS PREVIEW
            </span>
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '10px' }}>
            Diffusion Virtual Try-On
          </h3>
          <p style={{ fontSize: '13px', opacity: 0.68, lineHeight: 1.6 }}>
            Photorealistic image synthesis that drapes garments onto your custom 3D mannequin posture or your uploaded personal likeness.
          </p>
        </div>
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #f0eee8', fontSize: '11px', opacity: 0.55, fontWeight: 500 }}>
          TARGET: GENERATIVE DIFFUSION ENGINE
        </div>
      </div>
    </div>
  </section>
)}

{activeView === 'home' && (
<section
className="closing-section"
id="technology"
>
<p>VESTA / TECHNOLOGY</p>

<h2>
Understand it.
<br />
Personalize it.
<br />
Decide.
</h2>

<div className="closing-description">
Product intelligence, deterministic fashion
logic and IBM Granite reasoning — combined
into one fashion decision experience.
</div>
</section>
)}
<footer
  style={{
    borderTop: '1px solid #dedcd5',
    padding: '40px 6vw',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#f6f5f1',
    flexWrap: 'wrap',
    gap: '20px',
  }}
>
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <img
      src="/vesta-logo.png"
      alt="VESTA - Style Beyond Limits"
      style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
    />
    <span style={{ fontSize: '11px', opacity: 0.6, letterSpacing: '0.05em' }}>
      AI FASHION INTELLIGENCE & SILHOUETTE SYNTHESIS
    </span>
  </div>
  <div style={{ fontSize: '11px', opacity: 0.5 }}>
    © {new Date().getFullYear()} VESTA. Style Beyond Limits. All rights reserved.
  </div>
</footer>
</main>
)
}

export default App