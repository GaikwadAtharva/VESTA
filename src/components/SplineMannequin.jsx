import { useState, Suspense, lazy } from 'react'
import { Sparkles, Ruler, LoaderCircle, RotateCcw, Eye } from 'lucide-react'

// Lazy load Spline to prevent SSR or WebGL crashes
const Spline = lazy(() => import('@splinetool/react-spline'))

export default function SplineMannequin({
  measurements = {},
  detectedFit = 'Regular Fit',
  height = '440px',
  compact = false,
}) {
  const [activeTab, setActiveTab] = useState('spline') // 'spline' | 'mannequin'
  const [splineLoaded, setSplineLoaded] = useState(false)
  const [splineError, setSplineError] = useState(false)
  const [selectedPin, setSelectedPin] = useState('chest')

  const heightVal = measurements?.height_cm || '178'
  const chestVal = measurements?.chest_cm || '98'
  const waistVal = measurements?.waist_cm || '82'
  const hipsVal = measurements?.hips_cm || '98'
  const shoulderVal = measurements?.shoulder_cm || '45'
  const inseamVal = measurements?.inseam_cm || '81'

  const pins = [
    {
      id: 'shoulder',
      label: 'Shoulder',
      value: shoulderVal,
      top: '18%',
      left: '32%',
      note: 'Key for jacket draping and seam alignment without pulling.',
    },
    {
      id: 'chest',
      label: 'Chest',
      value: chestVal,
      top: '28%',
      left: '68%',
      note: 'Determines primary torso ease. Regular fit leaves +6-8cm ease.',
    },
    {
      id: 'waist',
      label: 'Waist',
      value: waistVal,
      top: '44%',
      left: '30%',
      note: 'Crucial for trouser rise, tucked shirts, and tailored silhouette.',
    },
    {
      id: 'hips',
      label: 'Hips',
      value: hipsVal,
      top: '56%',
      left: '70%',
      note: 'Affects trouser fall, skirt draping, and coat vent positioning.',
    },
    {
      id: 'inseam',
      label: 'Inseam',
      value: inseamVal,
      top: '78%',
      left: '42%',
      note: 'Dictates pant break over footwear: full, half, or clean crop.',
    },
  ]

  const currentPinData = pins.find((p) => p.id === selectedPin) || pins[1]

  return (
    <div
      className="spline-mannequin-container"
      style={{
        width: '100%',
        minHeight: height,
        background: '#111',
        color: '#fff',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.12)',
      }}
    >
      {/* Header controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(17, 17, 17, 0.95)',
          zIndex: 10,
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={14} color="#d4af37" />
          <span
            style={{
              fontSize: '11px',
              letterSpacing: '0.12em',
              fontWeight: 600,
              textTransform: 'uppercase',
              color: '#d4af37',
            }}
          >
            VESTA / 3D SILHOUETTE
          </span>
          <span
            style={{
              fontSize: '10px',
              padding: '2px 8px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '2px',
              color: '#aaa',
              marginLeft: '4px',
            }}
          >
            {detectedFit}
          </span>
        </div>

        {/* View Mode Toggle */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.08)',
            padding: '2px',
            borderRadius: '4px',
            gap: '2px',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('spline')}
            style={{
              background:
                activeTab === 'spline'
                  ? 'rgba(255, 255, 255, 0.2)'
                  : 'transparent',
              color: activeTab === 'spline' ? '#fff' : '#888',
              border: 'none',
              padding: '5px 12px',
              fontSize: '11px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
          >
            <Eye size={12} />
            3D Scene
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mannequin')}
            style={{
              background:
                activeTab === 'mannequin'
                  ? 'rgba(255, 255, 255, 0.2)'
                  : 'transparent',
              color: activeTab === 'mannequin' ? '#fff' : '#888',
              border: 'none',
              padding: '5px 12px',
              fontSize: '11px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
          >
            <Ruler size={12} />
            Body Proportions
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        style={{
          position: 'relative',
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: compact ? '260px' : '340px',
        }}
      >
        {activeTab === 'spline' && !splineError ? (
          <div
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              inset: 0,
            }}
          >
            {!splineLoaded && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  background: '#111',
                  zIndex: 2,
                }}
              >
                <LoaderCircle size={28} className="spin" color="#fff" />
                <span
                  style={{
                    fontSize: '11px',
                    letterSpacing: '0.1em',
                    opacity: 0.6,
                  }}
                >
                  INITIALIZING 3D SPLINE SCENE...
                </span>
              </div>
            )}
            <Suspense fallback={null}>
              <Spline
                scene="https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode"
                onLoad={() => setSplineLoaded(true)}
                onError={() => {
                  setSplineError(true)
                  setActiveTab('mannequin')
                }}
                style={{ width: '100%', height: '100%' }}
              />
            </Suspense>

            {/* Instruction badge */}
            {splineLoaded && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '16px',
                  left: '16px',
                  padding: '6px 12px',
                  background: 'rgba(0, 0, 0, 0.65)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  fontSize: '10px',
                  letterSpacing: '0.08em',
                  color: '#aaa',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  pointerEvents: 'none',
                }}
              >
                <RotateCcw size={11} />
                DRAG TO ROTATE & INTERACT IN 3D
              </div>
            )}
          </div>
        ) : (
          /* Interactive Body Proportions & Measurements Mode */
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              padding: '24px',
              position: 'relative',
              flexWrap: 'wrap',
              gap: '20px',
            }}
          >
            {/* Minimalist Vector Mannequin Croquis */}
            <div
              style={{
                position: 'relative',
                width: '160px',
                height: '300px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Silhouette SVG */}
              <svg
                viewBox="0 0 100 220"
                style={{
                  width: '100%',
                  height: '100%',
                  filter: 'drop-shadow(0 0 12px rgba(212, 175, 55, 0.15))',
                }}
              >
                <defs>
                  <linearGradient id="croquisGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#fff" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#aaa" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#666" stopOpacity="0.2" />
                  </linearGradient>
                </defs>
                {/* Head */}
                <ellipse cx="50" cy="18" rx="9" ry="12" fill="none" stroke="#888" strokeWidth="1.2" />
                {/* Neck */}
                <path d="M46 30 L46 36 M54 30 L54 36" stroke="#888" strokeWidth="1" />
                {/* Shoulders & Torso */}
                <path
                  d="M26 40 L50 36 L74 40 L68 70 L62 96 L66 122 L68 150 L56 210 L51 210 L50 140 L49 210 L44 210 L32 150 L34 122 L38 96 L32 70 Z"
                  fill="url(#croquisGrad)"
                  stroke="rgba(255, 255, 255, 0.4)"
                  strokeWidth="1"
                />
                {/* Arms indicator */}
                <path d="M26 40 L20 80 L18 120" fill="none" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="1" />
                <path d="M74 40 L80 80 L82 120" fill="none" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="1" />
                {/* Measurement guide lines */}
                <line x1="22" y1="66" x2="78" y2="66" stroke="rgba(212, 175, 55, 0.4)" strokeDasharray="2 2" strokeWidth="0.8" />
                <line x1="30" y1="96" x2="70" y2="96" stroke="rgba(212, 175, 55, 0.4)" strokeDasharray="2 2" strokeWidth="0.8" />
                <line x1="28" y1="122" x2="72" y2="122" stroke="rgba(212, 175, 55, 0.4)" strokeDasharray="2 2" strokeWidth="0.8" />
              </svg>

              {/* Pinpoint Badges on Mannequin */}
              {pins.map((pin) => {
                const isSelected = selectedPin === pin.id
                return (
                  <button
                    type="button"
                    key={pin.id}
                    onClick={() => setSelectedPin(pin.id)}
                    style={{
                      position: 'absolute',
                      top: pin.top,
                      left: pin.left,
                      transform: 'translate(-50%, -50%)',
                      background: isSelected ? '#d4af37' : 'rgba(30, 30, 30, 0.9)',
                      color: isSelected ? '#111' : '#fff',
                      border: isSelected
                        ? '2px solid #fff'
                        : '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '12px',
                      padding: '2px 7px',
                      fontSize: '9px',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      cursor: 'pointer',
                      zIndex: 5,
                      boxShadow: isSelected
                        ? '0 0 10px rgba(212, 175, 55, 0.6)'
                        : '0 2px 4px rgba(0,0,0,0.5)',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {pin.value} cm
                  </button>
                )
              })}
            </div>

            {/* Metric Insight Card */}
            <div
              style={{
                maxWidth: '240px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div
                style={{
                  fontSize: '9px',
                  letterSpacing: '0.12em',
                  opacity: 0.5,
                  textTransform: 'uppercase',
                }}
              >
                PROPORTION FOCUS
              </div>
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#d4af37',
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '6px',
                }}
              >
                {currentPinData.label}
                <span style={{ fontSize: '13px', color: '#fff' }}>
                  {currentPinData.value} cm
                </span>
              </div>
              <p
                style={{
                  fontSize: '11px',
                  lineHeight: 1.6,
                  color: '#bbb',
                  margin: '4px 0 0',
                }}
              >
                {currentPinData.note}
              </p>
              <div
                style={{
                  marginTop: '6px',
                  paddingTop: '8px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: '10px',
                  color: '#888',
                }}
              >
                Height: <strong style={{ color: '#fff' }}>{heightVal} cm</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer bar */}
      <div
        style={{
          padding: '10px 20px',
          background: 'rgba(17, 17, 17, 0.95)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: '10px',
          color: '#777',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>PHYSICAL SILHOUETTE MAPPING</span>
        <span>{detectedFit.toUpperCase()} PROFILE</span>
      </div>
    </div>
  )
}
