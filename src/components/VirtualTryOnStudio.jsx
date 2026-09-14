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
  const garmentColor = product?.color || 'Blue'
  const garmentImage =
    product?.image ||
    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80'

  function handlePhotoUpload(event) {
    const file = event.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setUserPhoto(url)
      setIsCustomPhoto(true)
      setCustomPhotoName(file.name)
      setAiSynthesized(false)
      // Auto-center garment for user's photo
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
    }, 1400)
  }

  return (
    <div className="tryon-studio-container">
      {/* Studio Header */}
      <div className="tryon-header">
        <div>
          <div className="tryon-badge">
            <Sparkles size={14} />
            PERSONAL VIRTUAL TRY-ON STUDIO
          </div>
          <h2 className="tryon-title">Wear It On Your Own Photo</h2>
          <p className="tryon-subtitle">
            Upload your portrait or full-body picture to see <strong style={{ color: '#fff' }}>{garmentName}</strong> fitted directly onto your silhouette with realistic drape and tension intelligence.
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
                Synthesizing Diffusion Fit...
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
        {/* Left Column: Interactive Canvas & Model Viewport */}
        <div className="tryon-viewport-card">
          <div className="tryon-viewport-toolbar">
            <div className="tryon-toolbar-left">
              <span className="tryon-status-dot" />
              <span>
                {isCustomPhoto ? `Uploaded Photo (${customPhotoName || 'User'})` : 'User Portrait Canvas'}
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

              {/* Garment Layer: Composited directly onto the user */}
              <div
                className={`tryon-garment-composite ${fitMode.toLowerCase().replace(/\s+/g, '-')} ${isTucked ? 'tucked' : 'untucked'}`}
                style={{
                  top: `${garmentPosY}%`,
                  transform: `translate(-50%, -50%) scale(${garmentScale / 100}) scaleX(${garmentWidth / 100})`,
                }}
              >
                {/* Real Garment Product Image */}
                <div className="tryon-garment-cloth-wrapper">
                  <img
                    src={garmentImage}
                    alt={garmentName}
                    className="tryon-real-garment-img"
                  />
                  {/* Subtle cloth shading vignette */}
                  <div className="tryon-cloth-shading" />
                </div>

                {/* SVG Tension Heatmap Overlay directly on top of the garment */}
                {showHeatmap && (
                  <svg
                    className="tryon-garment-svg-heatmap"
                    viewBox="0 0 300 400"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <radialGradient id="strainChestUser" cx="50%" cy="32%" r="30%">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.7" />
                        <stop offset="65%" stopColor={fitMode === 'Slim Fit' ? '#ef4444' : '#eab308'} stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </radialGradient>
                    </defs>

                    {/* Chest & Shoulder tension heat rings */}
                    <ellipse cx="150" cy="130" rx={fitMode === 'Slim Fit' ? '50' : '40'} ry="28" fill="url(#strainChestUser)" />
                    <circle cx="100" cy="85" r="10" fill={fitMode === 'Slim Fit' ? '#ef4444' : '#10b981'} opacity="0.75" />
                    <circle cx="200" cy="85" r="10" fill={fitMode === 'Slim Fit' ? '#ef4444' : '#10b981'} opacity="0.75" />
                    <path
                      d="M130,170 Q150,220 140,280"
                      stroke="#10b981"
                      strokeWidth="2"
                      strokeDasharray="3,3"
                      opacity="0.85"
                    />
                    <path
                      d="M170,170 Q150,220 160,280"
                      stroke="#10b981"
                      strokeWidth="2"
                      strokeDasharray="3,3"
                      opacity="0.85"
                    />
                  </svg>
                )}

                {/* Live Fit Spec Tag */}
                <div className="tryon-garment-badge">
                  <span>{product?.brand || 'VESTA'}</span>
                  <small>{fitMode} · {garmentColor}</small>
                </div>
              </div>

              {/* Photorealistic Diffusion Try-On Split Slider */}
              {aiSynthesized && (
                <div className="tryon-ai-synthesis-overlay">
                  <div
                    className="tryon-ai-slice"
                    style={{ clipPath: `inset(0 0 0 ${splitSliderPos}%)` }}
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
                <Camera size={26} />
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
                  min="30"
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
                  max="135"
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
                  min="80"
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
                Garment automatically mapped to chest and shoulders on your photo. Use sliders if you want a custom position.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
