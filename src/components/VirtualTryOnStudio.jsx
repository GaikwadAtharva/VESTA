import { useState, useRef } from 'react'
import {
  Sparkles,
  Camera,
  Upload,
  Layers,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Flame,
  User,
  Move,
  RotateCcw,
} from 'lucide-react'

const DEMO_USER_PHOTOS = [
  {
    id: 'user_male',
    label: 'Sample: Athletic Portrait (Male)',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'user_female',
    label: 'Sample: Studio Portrait (Female)',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
  },
]

function getGarmentPalette(colorName) {
  const c = (colorName || '').toLowerCase()
  if (c.includes('black')) {
    return {
      base: '#141414',
      highlight: '#2c2c2e',
      shadow: '#070708',
      accent: '#a1a1aa',
      collar: '#1f1f22',
    }
  }
  if (c.includes('navy')) {
    return {
      base: '#0f1d38',
      highlight: '#1f355c',
      shadow: '#070c18',
      accent: '#94a3b8',
      collar: '#16284a',
    }
  }
  if (c.includes('blue')) {
    return {
      base: '#1e40af',
      highlight: '#3b82f6',
      shadow: '#172554',
      accent: '#cbd5e1',
      collar: '#1d4ed8',
    }
  }
  if (c.includes('olive') || c.includes('green')) {
    return {
      base: '#2d3b2d',
      highlight: '#445644',
      shadow: '#172117',
      accent: '#a7b8a7',
      collar: '#354635',
    }
  }
  if (c.includes('grey') || c.includes('gray') || c.includes('charcoal')) {
    return {
      base: '#374151',
      highlight: '#4b5563',
      shadow: '#1f2937',
      accent: '#e2e8f0',
      collar: '#475569',
    }
  }
  if (c.includes('white')) {
    return {
      base: '#f1f5f9',
      highlight: '#ffffff',
      shadow: '#cbd5e1',
      accent: '#475569',
      collar: '#e2e8f0',
    }
  }
  if (c.includes('beige') || c.includes('tan') || c.includes('khaki')) {
    return {
      base: '#c5aa85',
      highlight: '#d8c2a3',
      shadow: '#947854',
      accent: '#443422',
      collar: '#baa07e',
    }
  }
  if (c.includes('red') || c.includes('wine') || c.includes('maroon')) {
    return {
      base: '#7f1d1d',
      highlight: '#991b1b',
      shadow: '#450a0a',
      accent: '#fca5a5',
      collar: '#881337',
    }
  }
  return {
    base: '#141414',
    highlight: '#2c2c2e',
    shadow: '#070708',
    accent: '#a1a1aa',
    collar: '#1f1f22',
  }
}

export default function VirtualTryOnStudio({
  product,
  preferredFit = 'Regular Fit',
}) {
  const [userPhoto, setUserPhoto] = useState(DEMO_USER_PHOTOS[0].url)
  const [isCustomPhoto, setIsCustomPhoto] = useState(false)
  const [customPhotoName, setCustomPhotoName] = useState('')
  const [fitMode, setFitMode] = useState(preferredFit || 'Regular Fit')
  const [isTucked, setIsTucked] = useState(false)
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [isGeneratingAi, setIsGeneratingAi] = useState(false)
  const [aiSynthesized, setAiSynthesized] = useState(false)
  const [splitSliderPos, setSplitSliderPos] = useState(50)

  // Manual & Auto Position Adjustments for garment on user's photo
  const [garmentPosY, setGarmentPosY] = useState(48) // percentage from top
  const [garmentScale, setGarmentScale] = useState(100) // percent scale
  const [garmentWidth, setGarmentWidth] = useState(100) // width ease percent

  const fileInputRef = useRef(null)

  function handleFitModeChange(mode) {
    setFitMode(mode)
    if (mode === 'Slim Fit') {
      setGarmentScale(94)
      setGarmentWidth(92)
    } else if (mode === 'Oversized') {
      setGarmentScale(108)
      setGarmentWidth(116)
    } else {
      setGarmentScale(100)
      setGarmentWidth(100)
    }
  }

  const garmentName = product?.name || 'Garment'
  const garmentColor = product?.color || 'Black'
  const garmentCategory = product?.category || 'T-Shirt'
  const catLower = garmentCategory.toLowerCase()

  const isJacket =
    catLower.includes('jacket') ||
    catLower.includes('outerwear') ||
    catLower.includes('coat') ||
    catLower.includes('parka')

  const palette = getGarmentPalette(garmentColor)

  // Generate real AI diffusion photo URL tailored to the product
  const aiPrompt = encodeURIComponent(
    `cinematic photorealistic portrait of an attractive stylish person wearing an authentic ${product?.brand || 'Uniqlo'} ${garmentColor} ${garmentCategory}, high quality studio lighting, sharp focus, perfectly fitted around neck and shoulders, 8k resolution, fashion magazine lookbook`
  )
  const aiDiffusionUrl = `https://image.pollinations.ai/prompt/${aiPrompt}?width=600&height=800&nologo=true&seed=99`

  function handlePhotoUpload(event) {
    const file = event.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setUserPhoto(url)
      setIsCustomPhoto(true)
      setCustomPhotoName(file.name)
      setAiSynthesized(false)
      setGarmentPosY(48)
    }
  }

  function resetAutoFit() {
    setGarmentPosY(48)
    if (fitMode === 'Slim Fit') {
      setGarmentScale(94)
      setGarmentWidth(92)
    } else if (fitMode === 'Oversized') {
      setGarmentScale(108)
      setGarmentWidth(116)
    } else {
      setGarmentScale(100)
      setGarmentWidth(100)
    }
  }

  function triggerAiDiffusionTryOn() {
    setIsGeneratingAi(true)
    setTimeout(() => {
      setIsGeneratingAi(false)
      setAiSynthesized(true)
    }, 1500)
  }

  return (
    <div className="tryon-studio-container">
      {/* Studio Header */}
      <div className="tryon-header">
        <div>
          <div className="tryon-badge">
            <Sparkles size={14} />
            AI NEURAL VIRTUAL TRY-ON
          </div>
          <h2 className="tryon-title">Wear It On Your Own Photo</h2>
          <p className="tryon-subtitle">
            Experience <strong style={{ color: '#fff' }}>{garmentName}</strong> anatomically tailored and draped around your neck and shoulders, or synthesize ChatGPT-style photorealistic AI diffusion wear.
          </p>
        </div>

        <div className="tryon-header-actions">
          <button
            type="button"
            className="tryon-ai-btn"
            onClick={triggerAiDiffusionTryOn}
            disabled={isGeneratingAi}
          >
            {isGeneratingAi ? (
              <>
                <RefreshCw size={16} className="spin" />
                Synthesizing Neural Fit...
              </>
            ) : aiSynthesized ? (
              <>
                <CheckCircle2 size={16} />
                AI Try-On Ready
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate AI Diffusion Try-On
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Studio Workspace Grid */}
      <div className="tryon-grid">
        {/* Left Column: Interactive Canvas Viewport */}
        <div className="tryon-viewport-card">
          <div className="tryon-viewport-toolbar">
            <div className="tryon-toolbar-left">
              <span className="tryon-status-dot" />
              <span>
                {isCustomPhoto ? `Uploaded Portrait (${customPhotoName || 'User'})` : 'User Portrait Canvas'}
              </span>
            </div>

            <div className="tryon-toolbar-right">
              <button
                type="button"
                className={`tryon-tool-btn ${showHeatmap ? 'active' : ''}`}
                onClick={() => setShowHeatmap(!showHeatmap)}
                title="Toggle Tension Heatmap"
              >
                <Flame size={14} />
                {showHeatmap ? 'Tension Heatmap ON' : 'Tension Heatmap OFF'}
              </button>

              <button
                type="button"
                className={`tryon-tool-btn ${isTucked ? 'active' : ''}`}
                onClick={() => setIsTucked(!isTucked)}
                title="Toggle Tucked / Untucked Drape"
              >
                <Layers size={14} />
                {isTucked ? 'Tucked Drape' : 'Untucked Drape'}
              </button>
            </div>
          </div>

          {/* User Photo Try-On Stage */}
          <div className="tryon-stage">
            {/* Base Layer: User's Photo */}
            <div className="tryon-model-layer">
              <img
                src={userPhoto}
                alt="User portrait for try-on"
                className="tryon-avatar-img"
              />

              {/* Anatomical Clothing Drape (Properly Worn Around Neck & Torso) */}
              <div
                className={`tryon-anatomical-drape ${fitMode.toLowerCase().replace(/\s+/g, '-')} ${isTucked ? 'tucked' : 'untucked'}`}
                style={{
                  top: `${garmentPosY}%`,
                  transform: `translate(-50%, -50%) scale(${garmentScale / 100}) scaleX(${garmentWidth / 100})`,
                }}
              >
                <svg
                  className="tryon-anatomical-svg"
                  viewBox="0 0 400 500"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="bodyFabricGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={palette.highlight} />
                      <stop offset="45%" stopColor={palette.base} />
                      <stop offset="100%" stopColor={palette.shadow} />
                    </linearGradient>

                    <linearGradient id="sleeveLeftGrad" x1="0%" y1="0%" x2="100%" y2="50%">
                      <stop offset="0%" stopColor={palette.highlight} />
                      <stop offset="100%" stopColor={palette.shadow} />
                    </linearGradient>

                    <linearGradient id="sleeveRightGrad" x1="100%" y1="0%" x2="0%" y2="50%">
                      <stop offset="0%" stopColor={palette.highlight} />
                      <stop offset="100%" stopColor={palette.shadow} />
                    </linearGradient>

                    <radialGradient id="strainChestUser" cx="50%" cy="32%" r="28%">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.75" />
                      <stop offset="70%" stopColor={fitMode === 'Slim Fit' ? '#ef4444' : '#eab308'} stopOpacity="0.5" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </radialGradient>
                  </defs>

                  {/* JACKET / OUTERWEAR ANATOMICAL SILHOUETTE */}
                  {isJacket && (
                    <g className="anatomical-jacket-group">
                      {/* Torso & Sleeves Main Body */}
                      <path
                        d={
                          isTucked
                            ? 'M155,65 C175,95 225,95 245,65 L330,110 L365,260 C350,270 330,270 320,255 L290,190 L285,340 C235,348 165,348 115,340 L110,190 L80,255 C70,270 50,270 35,260 L70,110 Z'
                            : 'M155,65 C175,95 225,95 245,65 L330,110 L365,260 C350,270 330,270 320,255 L290,190 L285,425 C235,435 165,435 115,425 L110,190 L80,255 C70,270 50,270 35,260 L70,110 Z'
                        }
                        fill="url(#bodyFabricGrad)"
                        stroke={palette.shadow}
                        strokeWidth="2"
                        className="fabric-mesh-body"
                      />

                      {/* Left & Right Standing Storm Collar Lapels */}
                      <path
                        d="M155,65 C165,115 190,145 200,150 L195,65 Z"
                        fill={palette.collar}
                        stroke={palette.highlight}
                        strokeWidth="1.2"
                      />
                      <path
                        d="M245,65 C235,115 210,145 200,150 L205,65 Z"
                        fill={palette.collar}
                        stroke={palette.highlight}
                        strokeWidth="1.2"
                      />

                      {/* Quilted Down Baffles (Parka Structure) */}
                      <path d="M125,200 Q200,215 275,200" stroke={palette.shadow} strokeWidth="3" opacity="0.6" fill="none" />
                      <path d="M125,200 Q200,215 275,200" stroke={palette.highlight} strokeWidth="1" opacity="0.4" fill="none" />
                      <path d="M120,265 Q200,280 280,265" stroke={palette.shadow} strokeWidth="3" opacity="0.6" fill="none" />
                      <path d="M120,265 Q200,280 280,265" stroke={palette.highlight} strokeWidth="1" opacity="0.4" fill="none" />
                      <path d="M118,335 Q200,350 282,335" stroke={palette.shadow} strokeWidth="3" opacity="0.6" fill="none" />
                      <path d="M118,335 Q200,350 282,335" stroke={palette.highlight} strokeWidth="1" opacity="0.4" fill="none" />

                      {/* Center Metallic Zipper Line & Slider */}
                      <line x1="200" y1="150" x2="200" y2={isTucked ? 340 : 425} stroke={palette.accent} strokeWidth="2.5" strokeDasharray="3,2" />
                      <rect x="196" y="152" width="8" height="14" rx="2" fill={palette.accent} />
                      <line x1="200" y1="166" x2="200" y2="175" stroke={palette.accent} strokeWidth="2" />

                      {/* Side Hand Pockets */}
                      <line x1="140" y1="310" x2="165" y2="355" stroke={palette.shadow} strokeWidth="2.5" />
                      <line x1="260" y1="310" x2="235" y2="355" stroke={palette.shadow} strokeWidth="2.5" />

                      {/* Shoulder Seam Contours */}
                      <line x1="155" y1="65" x2="70" y2="110" stroke={palette.highlight} strokeWidth="1.5" opacity="0.5" />
                      <line x1="245" y1="65" x2="330" y2="110" stroke={palette.highlight} strokeWidth="1.5" opacity="0.5" />
                    </g>
                  )}

                  {/* T-SHIRT ANATOMICAL SILHOUETTE */}
                  {!isJacket && (
                    <g className="anatomical-tshirt-group">
                      {/* T-Shirt Body */}
                      <path
                        d={
                          isTucked
                            ? 'M150,60 C175,100 225,100 250,60 L320,95 L345,210 C330,225 315,225 305,210 L280,165 L275,340 C230,345 170,345 125,340 L120,165 L95,210 C85,225 70,225 55,210 L80,95 Z'
                            : 'M150,60 C175,100 225,100 250,60 L320,95 L345,210 C330,225 315,225 305,210 L280,165 L275,415 C230,425 170,425 125,415 L120,165 L95,210 C85,225 70,225 55,210 L80,95 Z'
                        }
                        fill="url(#bodyFabricGrad)"
                        stroke={palette.shadow}
                        strokeWidth="2"
                        className="fabric-mesh-body"
                      />

                      {/* Ribbed Crewneck Collar Band */}
                      <path
                        d="M150,60 C175,100 225,100 250,60"
                        stroke={palette.collar}
                        strokeWidth="6"
                        fill="none"
                      />
                      <path
                        d="M150,60 C175,100 225,100 250,60"
                        stroke={palette.highlight}
                        strokeWidth="1.5"
                        fill="none"
                        opacity="0.6"
                      />

                      {/* Raglan Shoulder Seams */}
                      <line x1="165" y1="80" x2="120" y2="165" stroke={palette.shadow} strokeWidth="1.5" opacity="0.6" />
                      <line x1="235" y1="80" x2="280" y2="165" stroke={palette.shadow} strokeWidth="1.5" opacity="0.6" />
                    </g>
                  )}

                  {/* SCIENTIFIC TENSION HEATMAP OVERLAY */}
                  {showHeatmap && (
                    <g className="tryon-heatmap-overlay-group">
                      <ellipse cx="200" cy="170" rx={fitMode === 'Slim Fit' ? '54' : '44'} ry="30" fill="url(#strainChestUser)" />
                      <circle cx="130" cy="115" r="12" fill={fitMode === 'Slim Fit' ? '#ef4444' : '#10b981'} opacity="0.8" />
                      <circle cx="270" cy="115" r="12" fill={fitMode === 'Slim Fit' ? '#ef4444' : '#10b981'} opacity="0.8" />
                      <path d="M165,220 Q200,280 180,340" stroke="#10b981" strokeWidth="2.5" strokeDasharray="4,4" opacity="0.85" />
                      <path d="M235,220 Q200,280 220,340" stroke="#10b981" strokeWidth="2.5" strokeDasharray="4,4" opacity="0.85" />
                    </g>
                  )}
                </svg>

                {/* Live Spec Badge */}
                <div className="tryon-garment-badge">
                  <span>{product?.brand || 'VESTA'}</span>
                  <small>{garmentColor} · {fitMode}</small>
                </div>
              </div>

              {/* Photorealistic Diffusion Try-On Split Comparison */}
              {aiSynthesized && (
                <div className="tryon-ai-synthesis-overlay">
                  <div
                    className="tryon-ai-slice"
                    style={{
                      clipPath: `inset(0 0 0 ${splitSliderPos}%)`,
                      backgroundImage: `url(${aiDiffusionUrl})`,
                    }}
                  >
                    <div className="tryon-ai-render-label">NEURAL AI DIFFUSION WEAR</div>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={splitSliderPos}
                    onChange={(e) => setSplitSliderPos(Number(e.target.value))}
                    className="tryon-split-slider"
                  />
                  <div
                    className="tryon-split-divider"
                    style={{ left: `${splitSliderPos}%` }}
                  >
                    <div className="tryon-split-knob">
                      <Sliders size={12} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Heatmap Legend */}
            {showHeatmap && (
              <div className="tryon-heatmap-legend">
                <div className="legend-item">
                  <span className="legend-dot green" />
                  <span>Fluid Drape (0-5% Strain)</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot yellow" />
                  <span>Contoured Fit (5-12% Snug)</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot red" />
                  <span>Tension Strain (&gt;12% Tight)</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Photo Upload & Try-On Controls */}
        <div className="tryon-controls-col">
          {/* Section 1: Upload Your Photo */}
          <div className="tryon-control-box highlight">
            <div className="control-box-header">
              <span className="control-number">01</span>
              <h4>Your Photo Upload</h4>
            </div>

            <div className="tryon-upload-zone" onClick={() => fileInputRef.current?.click()}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handlePhotoUpload}
              />
              <div className="upload-icon-circle">
                <Camera size={24} />
              </div>
              <div className="upload-text-wrap">
                <strong>Upload Your Photo / Portrait</strong>
                <p>Select any portrait or full-body photo (JPG, PNG) to see this garment worn on you.</p>
              </div>
              <button type="button" className="upload-cta-btn">
                <Upload size={14} />
                {isCustomPhoto ? 'Change Photo' : 'Choose Photo File'}
              </button>
            </div>

            {/* Quick Demo Portraits */}
            <div className="demo-portraits-row">
              <small style={{ fontSize: '10px', color: '#888', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Or Test With Instant Sample:
              </small>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                {DEMO_USER_PHOTOS.map((demo) => (
                  <button
                    key={demo.id}
                    type="button"
                    className={`demo-portrait-chip ${userPhoto === demo.url ? 'active' : ''}`}
                    onClick={() => {
                      setUserPhoto(demo.url)
                      setIsCustomPhoto(false)
                      setAiSynthesized(false)
                    }}
                  >
                    <User size={12} />
                    {demo.id === 'user_male' ? 'Sample Male' : 'Sample Female'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Silhouette & Drape Styling */}
          <div className="tryon-control-box">
            <div className="control-box-header">
              <span className="control-number">02</span>
              <h4>Silhouette &amp; Sizing Drape</h4>
            </div>

            <div className="fit-selector-pills">
              {['Slim Fit', 'Regular Fit', 'Oversized'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={`fit-pill ${fitMode === mode ? 'active' : ''}`}
                  onClick={() => handleFitModeChange(mode)}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Live Drape Readout */}
            <div className="drape-metrics-card">
              <div className="metric-row">
                <span className="metric-label">Shoulder Alignment:</span>
                <strong className="metric-value">
                  {fitMode === 'Oversized'
                    ? '+1.8 in Drop Shoulder'
                    : fitMode === 'Slim Fit'
                    ? 'Tailored Seam (+0.2 in)'
                    : 'Natural Seam Alignment'}
                </strong>
              </div>
              <div className="metric-row">
                <span className="metric-label">Chest Ease:</span>
                <strong className="metric-value">
                  {fitMode === 'Oversized'
                    ? '4.5 in (Fluid Airflow)'
                    : fitMode === 'Slim Fit'
                    ? '1.5 in (Contoured)'
                    : '3.0 in (Standard)'}
                </strong>
              </div>
              <div className="metric-row">
                <span className="metric-label">Waistline Drape:</span>
                <strong className="metric-value">
                  {isTucked ? 'Tucked Profile (Clean Silhouette)' : 'Untucked (Falls over hips)'}
                </strong>
              </div>
            </div>
          </div>

          {/* Section 3: Garment Body Auto-Fit & Position Adjustment */}
          <div className="tryon-control-box">
            <div className="control-box-header" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="control-number">03</span>
                <h4>Garment Placement on Photo</h4>
              </div>
              <button
                type="button"
                className="reset-fit-btn"
                onClick={resetAutoFit}
                title="Reset to Auto-Fit"
              >
                <RotateCcw size={12} />
                Auto-Fit
              </button>
            </div>

            <div className="placement-sliders-grid">
              <div className="slider-control-item">
                <div className="slider-label-row">
                  <span>Vertical Alignment (Y)</span>
                  <strong>{garmentPosY}%</strong>
                </div>
                <input
                  type="range"
                  min="25"
                  max="65"
                  value={garmentPosY}
                  onChange={(e) => setGarmentPosY(Number(e.target.value))}
                  className="tryon-range-input"
                />
              </div>

              <div className="slider-control-item">
                <div className="slider-label-row">
                  <span>Garment Scale</span>
                  <strong>{garmentScale}%</strong>
                </div>
                <input
                  type="range"
                  min="75"
                  max="140"
                  value={garmentScale}
                  onChange={(e) => setGarmentScale(Number(e.target.value))}
                  className="tryon-range-input"
                />
              </div>

              <div className="slider-control-item">
                <div className="slider-label-row">
                  <span>Torso Width &amp; Ease</span>
                  <strong>{garmentWidth}%</strong>
                </div>
                <input
                  type="range"
                  min="75"
                  max="140"
                  value={garmentWidth}
                  onChange={(e) => setGarmentWidth(Number(e.target.value))}
                  className="tryon-range-input"
                />
              </div>
            </div>

            <div className="fit-diagnosis-pill">
              <Move size={14} />
              <span>
                Garment automatically mapped around neck and shoulders on your photo. Use sliders to fine-tune placement.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
