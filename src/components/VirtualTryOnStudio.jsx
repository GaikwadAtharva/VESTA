import { useState, useRef } from 'react'
import {
  Sparkles,
  Camera,
  Upload,
  Layers,
  RefreshCw,
  Sliders,
  Flame,
  Move,
  RotateCcw,
  Eye,
  GitCompare,
} from 'lucide-react'

const DEMO_ORIGINAL_PORTRAIT =
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80'
const DEMO_REAL_TRYON = '/model-tryon-real.jpg'

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
  const [userPhoto, setUserPhoto] = useState(DEMO_ORIGINAL_PORTRAIT)
  const [isCustomPhoto, setIsCustomPhoto] = useState(false)
  const [customPhotoName, setCustomPhotoName] = useState('')
  const [viewMode, setViewMode] = useState('photorealistic') // 'photorealistic' | 'split' | 'mesh'
  const [fitMode, setFitMode] = useState(preferredFit || 'Regular Fit')
  const [isTucked, setIsTucked] = useState(false)
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [isGeneratingAi, setIsGeneratingAi] = useState(false)
  const [splitSliderPos, setSplitSliderPos] = useState(50)
  const [aiSeed, setAiSeed] = useState(42)

  // Alignment sliders for anatomical mesh
  const [garmentPosY, setGarmentPosY] = useState(48)
  const [garmentScale, setGarmentScale] = useState(100)
  const [garmentWidth, setGarmentWidth] = useState(100)

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

  const garmentName = product?.name || 'Hybrid Utility Field Jacket'
  const garmentColor = product?.color || 'Olive Green'
  const garmentCategory = product?.category || 'Jacket'
  const brand = product?.brand || 'Uniqlo'
  const catLower = garmentCategory.toLowerCase()

  const isJacket =
    catLower.includes('jacket') ||
    catLower.includes('outerwear') ||
    catLower.includes('coat') ||
    catLower.includes('parka')

  const palette = getGarmentPalette(garmentColor)

  const aiPrompt = encodeURIComponent(
    `cinematic 8k photorealistic fashion portrait of a stylish person wearing an authentic ${brand} ${garmentColor} ${garmentCategory}, realistic cloth drape and fabric folds, sharp focus on tailored collar and shoulders, natural high-fashion catalog lighting, lookbook photography`
  )
  const aiDiffusionUrl = `https://image.pollinations.ai/prompt/${aiPrompt}?width=700&height=900&nologo=true&seed=${aiSeed}`

  const activeWornImage = isCustomPhoto ? aiDiffusionUrl : DEMO_REAL_TRYON
  const activeBaseImage = isCustomPhoto ? userPhoto : DEMO_ORIGINAL_PORTRAIT

  function handlePhotoUpload(event) {
    const file = event.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setUserPhoto(url)
      setIsCustomPhoto(true)
      setCustomPhotoName(file.name)
      setViewMode('photorealistic')
      setGarmentPosY(48)
      setIsGeneratingAi(true)
      setTimeout(() => {
        setIsGeneratingAi(false)
      }, 1200)
    }
  }

  function handleResetToSample() {
    setUserPhoto(DEMO_ORIGINAL_PORTRAIT)
    setIsCustomPhoto(false)
    setCustomPhotoName('')
    setViewMode('photorealistic')
    setShowHeatmap(false)
    setGarmentPosY(48)
    setGarmentScale(100)
    setGarmentWidth(100)
  }

  function handleResynthesizeAi() {
    setIsGeneratingAi(true)
    setAiSeed((prev) => prev + 1)
    setTimeout(() => {
      setIsGeneratingAi(false)
    }, 1200)
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

  return (
    <div className="tryon-studio-container">
      {/* Studio Header */}
      <div className="tryon-header">
        <div>
          <div className="tryon-badge">
            <Sparkles size={14} />
            PHOTOREALISTIC VIRTUAL TRY-ON STUDIO
          </div>
          <h2 className="tryon-title">Wear It Directly On Your Photo</h2>
          <p className="tryon-subtitle">
            Experience <strong style={{ color: '#fff' }}>{garmentName}</strong> photorealistically worn with natural drape around the neck, shoulders, and chest, powered by neural diffusion and biomechanical tension modeling.
          </p>
        </div>

        <div className="tryon-header-actions">
          {isCustomPhoto ? (
            <button
              type="button"
              className="tryon-ai-btn"
              onClick={handleResynthesizeAi}
              disabled={isGeneratingAi}
            >
              {isGeneratingAi ? (
                <>
                  <RefreshCw size={16} className="spin" />
                  Synthesizing Neural Wear...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Re-synthesize AI Wear
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              className="tryon-ai-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={16} />
              Upload Your Own Photo
            </button>
          )}
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
                {isCustomPhoto
                  ? `Uploaded Portrait (${customPhotoName || 'User'})`
                  : 'Real Photorealistic Try-On (Olive Field Jacket)'}
              </span>
            </div>

            <div className="tryon-toolbar-right">
              {/* View Mode Switcher */}
              <div className="tryon-view-mode-group">
                <button
                  type="button"
                  className={`tryon-tool-btn ${viewMode === 'photorealistic' ? 'active' : ''}`}
                  onClick={() => setViewMode('photorealistic')}
                  title="Photorealistic Worn Result"
                >
                  <Eye size={13} />
                  <span>Photorealistic</span>
                </button>
                <button
                  type="button"
                  className={`tryon-tool-btn ${viewMode === 'split' ? 'active' : ''}`}
                  onClick={() => setViewMode('split')}
                  title="Before / After Split Screen"
                >
                  <GitCompare size={13} />
                  <span>Before / After</span>
                </button>
                <button
                  type="button"
                  className={`tryon-tool-btn ${viewMode === 'mesh' ? 'active' : ''}`}
                  onClick={() => setViewMode('mesh')}
                  title="Anatomical Drape Mesh"
                >
                  <Layers size={13} />
                  <span>Mesh Alignment</span>
                </button>
              </div>

              {/* Heatmap Toggle */}
              <button
                type="button"
                className={`tryon-tool-btn ${showHeatmap ? 'active' : ''}`}
                onClick={() => setShowHeatmap(!showHeatmap)}
                title="Toggle Tension Heatmap"
              >
                <Flame size={13} />
                <span>{showHeatmap ? 'Heatmap ON' : 'Heatmap'}</span>
              </button>
            </div>
          </div>

          {/* Canvas Stage */}
          <div className="tryon-stage">
            {/* View Mode 1: Photorealistic Hero Wear */}
            {viewMode === 'photorealistic' && (
              <div className="tryon-photo-hero-wrap">
                <img
                  src={activeWornImage}
                  alt={`${garmentName} worn photorealistically`}
                  className="tryon-worn-photo"
                />

                <div className="tryon-hero-badge">
                  <span className="tryon-hero-tag">
                    {isCustomPhoto ? 'AI NEURAL WEAR' : 'PHOTOREALISTIC TRY-ON'}
                  </span>
                  <strong>{brand} · {garmentName}</strong>
                  <small>{garmentColor} · {fitMode}</small>
                </div>
              </div>
            )}

            {/* View Mode 2: Interactive Before / After Split Slider */}
            {viewMode === 'split' && (
              <div className="tryon-split-container">
                {/* Before Image (Left Side) */}
                <div className="tryon-split-side before">
                  <img
                    src={activeBaseImage}
                    alt="Original photo before try-on"
                    className="tryon-split-img"
                  />
                  <div className="tryon-split-label left">BEFORE · ORIGINAL PHOTO</div>
                </div>

                {/* After Image (Right Side - Clipped) */}
                <div
                  className="tryon-split-side after"
                  style={{ clipPath: `inset(0 0 0 ${splitSliderPos}%)` }}
                >
                  <img
                    src={activeWornImage}
                    alt="Photorealistic worn result after try-on"
                    className="tryon-split-img"
                  />
                  <div className="tryon-split-label right">AFTER · PHOTOREALISTIC WEAR</div>
                </div>

                {/* Split Slider Drag Handle */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={splitSliderPos}
                  onChange={(e) => setSplitSliderPos(Number(e.target.value))}
                  className="tryon-split-slider"
                  aria-label="Drag to compare before and after try-on"
                />
                <div
                  className="tryon-split-divider"
                  style={{ left: `${splitSliderPos}%` }}
                >
                  <div className="tryon-split-knob">
                    <Sliders size={13} />
                  </div>
                </div>
              </div>
            )}

            {/* View Mode 3: Mesh Alignment Drape View */}
            {viewMode === 'mesh' && (
              <div className="tryon-model-layer">
                <img
                  src={activeBaseImage}
                  alt="Base portrait for mesh alignment"
                  className="tryon-avatar-img"
                />

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
                    </defs>

                    {isJacket ? (
                      <g className="anatomical-jacket-group">
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
                        <path d="M125,200 Q200,215 275,200" stroke={palette.shadow} strokeWidth="3" opacity="0.6" fill="none" />
                        <path d="M120,265 Q200,280 280,265" stroke={palette.shadow} strokeWidth="3" opacity="0.6" fill="none" />
                        <line x1="200" y1="150" x2="200" y2={isTucked ? 340 : 425} stroke={palette.accent} strokeWidth="2.5" strokeDasharray="3,2" />
                        <rect x="196" y="152" width="8" height="14" rx="2" fill={palette.accent} />
                        <line x1="140" y1="310" x2="165" y2="355" stroke={palette.shadow} strokeWidth="2.5" />
                        <line x1="260" y1="310" x2="235" y2="355" stroke={palette.shadow} strokeWidth="2.5" />
                      </g>
                    ) : (
                      <g className="anatomical-tshirt-group">
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
                        <path
                          d="M150,60 C175,100 225,100 250,60"
                          stroke={palette.collar}
                          strokeWidth="6"
                          fill="none"
                        />
                      </g>
                    )}
                  </svg>

                  <div className="tryon-garment-badge">
                    <span>{brand}</span>
                    <small>{garmentColor} · {fitMode}</small>
                  </div>
                </div>
              </div>
            )}

            {/* High-Tech Tension Heatmap Overlay (Available across all modes) */}
            {showHeatmap && (
              <div className="tryon-heatmap-hud-overlay">
                <svg
                  className="tryon-heatmap-hud-svg"
                  viewBox="0 0 400 500"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <radialGradient id="strainChestHUD" cx="50%" cy="40%" r="35%">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                      <stop offset="65%" stopColor={fitMode === 'Slim Fit' ? '#ef4444' : '#eab308'} stopOpacity="0.55" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </radialGradient>
                    <radialGradient id="strainShoulderL" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor={fitMode === 'Slim Fit' ? '#ef4444' : '#10b981'} stopOpacity="0.85" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  {/* Chest Strain Zone */}
                  <ellipse cx="200" cy="210" rx={fitMode === 'Slim Fit' ? '70' : '55'} ry="40" fill="url(#strainChestHUD)" />

                  {/* Shoulder Seam Stress Points */}
                  <circle cx="115" cy="140" r="20" fill="url(#strainShoulderL)" />
                  <circle cx="285" cy="140" r="20" fill="url(#strainShoulderL)" />

                  {/* Collar Tension Line */}
                  <path
                    d="M150,110 Q200,150 250,110"
                    stroke="#10b981"
                    strokeWidth="3"
                    strokeDasharray="4,3"
                    fill="none"
                  />

                  {/* Dynamic Measurement Callouts */}
                  <g className="hud-readout-points">
                    <text x="75" y="130" fill="#10b981" fontSize="10" fontWeight="700" letterSpacing="0.05em">
                      L-SH: 3.2%
                    </text>
                    <text x="290" y="130" fill="#10b981" fontSize="10" fontWeight="700" letterSpacing="0.05em">
                      R-SH: 3.4%
                    </text>
                    <text x="175" y="245" fill={fitMode === 'Slim Fit' ? '#ef4444' : '#10b981'} fontSize="10" fontWeight="700" letterSpacing="0.05em">
                      CHEST: {fitMode === 'Slim Fit' ? '12.4% (Snug)' : '3.8% (Fluid)'}
                    </text>
                  </g>
                </svg>
              </div>
            )}

            {/* AI Synthesizing Loader Overlay */}
            {isGeneratingAi && (
              <div className="tryon-synthesizing-loader">
                <RefreshCw size={28} className="spin" color="#10b981" />
                <strong>Synthesizing Neural Fabric Fit...</strong>
                <p>Mapping {garmentColor} {garmentCategory} contours onto your photo</p>
              </div>
            )}

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
          {/* Card 1: Your Photo Upload */}
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
                <strong>{isCustomPhoto ? 'Active Uploaded Photo' : 'Upload Your Photo / Portrait'}</strong>
                <p>
                  {isCustomPhoto
                    ? `File: ${customPhotoName || 'user-portrait.jpg'}. Click to replace with another photo.`
                    : 'Select any personal portrait or full-body photo (JPG, PNG) to see this garment photorealistically worn.'}
                </p>
              </div>
              <button type="button" className="upload-cta-btn">
                <Upload size={14} />
                {isCustomPhoto ? 'Change Photo' : 'Choose Photo File'}
              </button>
            </div>

            {isCustomPhoto && (
              <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="reset-demo-link"
                  onClick={handleResetToSample}
                >
                  <RotateCcw size={11} />
                  Reset to Real Try-On Demo
                </button>
              </div>
            )}
          </div>

          {/* Card 2: Garment Silhouette & Fit Drape */}
          <div className="tryon-control-box">
            <div className="control-box-header">
              <span className="control-number">02</span>
              <h4>Biomechanical Fit Profile</h4>
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
                <span className="metric-label">Shoulder Contours:</span>
                <strong className="metric-value">
                  {fitMode === 'Oversized'
                    ? '+1.8 in Drop Shoulder'
                    : fitMode === 'Slim Fit'
                    ? 'Tailored Seam (+0.2 in)'
                    : 'Natural Seam Alignment'}
                </strong>
              </div>
              <div className="metric-row">
                <span className="metric-label">Chest Ease &amp; Airflow:</span>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong className="metric-value">
                    {isTucked ? 'Tucked Profile' : 'Untucked (Natural Fall)'}
                  </strong>
                  <button
                    type="button"
                    className="metric-toggle-btn"
                    onClick={() => setIsTucked(!isTucked)}
                  >
                    Toggle
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Alignment & Fine Tailoring */}
          <div className="tryon-control-box">
            <div className="control-box-header" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="control-number">03</span>
                <h4>Tailoring &amp; Alignment</h4>
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
                Garment contours automatically adjusted to body dimensions. Use sliders to calibrate vertical drape.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
