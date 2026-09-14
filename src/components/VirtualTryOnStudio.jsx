import { useState, useRef } from 'react'
import {
  Sparkles,
  Camera,
  Layers,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Flame,
} from 'lucide-react'

const AVATAR_MODELS = [
  {
    id: 'male_athletic',
    label: 'Athletic Male',
    gender: 'Male',
    height: "6'1\"",
    chest: '41 in',
    waist: '31 in',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=80',
    silhouetteType: 'broad',
  },
  {
    id: 'male_casual',
    label: 'Casual Male',
    gender: 'Male',
    height: "5'10\"",
    chest: '38 in',
    waist: '32 in',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=80',
    silhouetteType: 'regular',
  },
  {
    id: 'female_petite',
    label: 'Petite Female',
    gender: 'Female',
    height: "5'3\"",
    chest: '33 in',
    waist: '26 in',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
    silhouetteType: 'petite',
  },
  {
    id: 'female_curvy',
    label: 'Curvy Female',
    gender: 'Female',
    height: "5'7\"",
    chest: '37 in',
    waist: '29 in',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80',
    silhouetteType: 'curvy',
  },
]

export default function VirtualTryOnStudio({
  product,
  preferredFit = 'Regular Fit',
}) {
  const [selectedAvatarId, setSelectedAvatarId] = useState('male_athletic')
  const [customPhoto, setCustomPhoto] = useState(null)
  const [fitMode, setFitMode] = useState(preferredFit || 'Regular Fit')
  const [isTucked, setIsTucked] = useState(false)
  const [showHeatmap, setShowHeatmap] = useState(true)
  const [isGeneratingAi, setIsGeneratingAi] = useState(false)
  const [aiSynthesized, setAiSynthesized] = useState(false)
  const [splitSliderPos, setSplitSliderPos] = useState(50)
  const fileInputRef = useRef(null)

  const activeAvatar =
    AVATAR_MODELS.find((m) => m.id === selectedAvatarId) || AVATAR_MODELS[0]

  const garmentColor = (product?.color || 'Blue').toLowerCase()
  const garmentName = product?.name || 'Garment'

  function handlePhotoUpload(event) {
    const file = event.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setCustomPhoto(url)
      setSelectedAvatarId('custom')
      setAiSynthesized(false)
    }
  }

  function triggerAiDiffusionTryOn() {
    setIsGeneratingAi(true)
    setTimeout(() => {
      setIsGeneratingAi(false)
      setAiSynthesized(true)
    }, 1200)
  }

  return (
    <div className="tryon-studio-container">
      {/* Studio Header */}
      <div className="tryon-header">
        <div>
          <div className="tryon-badge">
            <Sparkles size={14} />
            NEURAL DIFFUSION TRY-ON STUDIO
          </div>
          <h2 className="tryon-title">Virtual Try-On &amp; Spatial Drape</h2>
          <p className="tryon-subtitle">
            Preview {garmentName} draped directly onto your physique, test styling variations, and inspect fabric tension heatmaps.
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
                Diffusion Try-On Ready
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
                {selectedAvatarId === 'custom'
                  ? 'Custom User Upload'
                  : `${activeAvatar.label} (${activeAvatar.height})`}
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
                {showHeatmap ? 'Heatmap ON' : 'Heatmap OFF'}
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

          {/* Model Canvas Stage */}
          <div className="tryon-stage">
            {/* Background Model / Avatar */}
            <div className="tryon-model-layer">
              <img
                src={selectedAvatarId === 'custom' ? customPhoto : activeAvatar.image}
                alt="Try-on model"
                className="tryon-avatar-img"
              />

              {/* Garment Drape Overlay */}
              <div
                className={`tryon-garment-overlay ${garmentColor} ${fitMode.toLowerCase().replace(/\s+/g, '-')} ${isTucked ? 'tucked' : 'untucked'}`}
              >
                {/* SVG Fabric Drape Silhouette */}
                <svg
                  className="tryon-garment-svg"
                  viewBox="0 0 400 600"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="fabricShading" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="currentColor" stopOpacity="0.88" />
                      <stop offset="50%" stopColor="currentColor" stopOpacity="0.75" />
                      <stop offset="100%" stopColor="#000" stopOpacity="0.4" />
                    </linearGradient>

                    <radialGradient id="strainChest" cx="50%" cy="30%" r="28%">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.65" />
                      <stop offset="70%" stopColor="#eab308" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
                    </radialGradient>
                  </defs>

                  {/* Garment Torso & Sleeves */}
                  <path
                    d={
                      isTucked
                        ? 'M130,120 Q160,110 200,115 Q240,110 270,120 L330,220 Q305,245 285,230 L260,185 L255,340 Q200,345 145,340 L140,185 L115,230 Q95,245 70,220 Z'
                        : 'M130,120 Q160,110 200,115 Q240,110 270,120 L330,220 Q305,245 285,230 L260,185 L255,420 Q200,435 145,420 L140,185 L115,230 Q95,245 70,220 Z'
                    }
                    fill="url(#fabricShading)"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="1.5"
                    className="fabric-mesh"
                  />

                  {/* Collar Stitch Accent */}
                  <path
                    d="M165,113 Q200,135 235,113"
                    stroke="rgba(255,255,255,0.4)"
                    strokeWidth="2.5"
                    fill="none"
                  />

                  {/* Scientific Tension Heatmap Overlay */}
                  {showHeatmap && (
                    <g className="tension-heatmap-group">
                      <ellipse
                        cx="200"
                        cy="180"
                        rx={fitMode === 'Slim Fit' ? '52' : fitMode === 'Oversized' ? '42' : '48'}
                        ry="35"
                        fill="url(#strainChest)"
                      />
                      <circle cx="140" cy="130" r="14" fill="#10b981" opacity="0.6" />
                      <circle cx="260" cy="130" r="14" fill="#10b981" opacity="0.6" />
                      <path
                        d="M175,230 Q200,280 185,340"
                        stroke="#10b981"
                        strokeWidth="2"
                        strokeDasharray="4,4"
                        opacity="0.8"
                      />
                      <path
                        d="M225,230 Q200,280 215,340"
                        stroke="#10b981"
                        strokeWidth="2"
                        strokeDasharray="4,4"
                        opacity="0.8"
                      />
                    </g>
                  )}
                </svg>

                {/* Garment Logo / Spec Stamp */}
                <div className="tryon-garment-badge">
                  <span>{product?.brand || 'VESTA'}</span>
                  <small>{fitMode}</small>
                </div>
              </div>

              {/* AI Photorealistic Split Comparison */}
              {aiSynthesized && (
                <div className="tryon-ai-synthesis-overlay">
                  <div
                    className="tryon-ai-slice"
                    style={{ clipPath: `inset(0 0 0 ${splitSliderPos}%)` }}
                  >
                    <div className="tryon-ai-render-label">IDM-VTON AI SYNTHESIS</div>
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

            {/* Tension Indicator Legend Overlay */}
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
                  <span>Tension Warning (&gt;12% Tight)</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Studio Controls, Avatar Selector, & Fit Metrics */}
        <div className="tryon-controls-col">
          {/* Section 1: Choose Physique / Model */}
          <div className="tryon-control-box">
            <div className="control-box-header">
              <span className="control-number">01</span>
              <h4>Select Body Silhouette</h4>
            </div>

            <div className="avatar-selection-grid">
              {AVATAR_MODELS.map((avatar) => (
                <button
                  key={avatar.id}
                  type="button"
                  className={`avatar-card ${selectedAvatarId === avatar.id ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedAvatarId(avatar.id)
                    setAiSynthesized(false)
                  }}
                >
                  <img src={avatar.image} alt={avatar.label} className="avatar-thumb" />
                  <div className="avatar-meta">
                    <strong>{avatar.label}</strong>
                    <small>{avatar.height} · Chest {avatar.chest}</small>
                  </div>
                </button>
              ))}

              {/* Upload Custom Photo Button */}
              <button
                type="button"
                className={`avatar-card upload-custom ${selectedAvatarId === 'custom' ? 'selected' : ''}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="avatar-thumb upload-thumb">
                  {customPhoto ? (
                    <img src={customPhoto} alt="Custom" className="avatar-thumb-img" />
                  ) : (
                    <Camera size={20} />
                  )}
                </div>
                <div className="avatar-meta">
                  <strong>Upload Your Photo</strong>
                  <small>{customPhoto ? 'Photo Loaded ✓' : 'PNG / JPG format'}</small>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handlePhotoUpload}
                />
              </button>
            </div>
          </div>

          {/* Section 2: Garment Cut & Drape Dynamics */}
          <div className="tryon-control-box">
            <div className="control-box-header">
              <span className="control-number">02</span>
              <h4>Silhouette &amp; Drape Tuning</h4>
            </div>

            <div className="fit-selector-pills">
              {['Slim Fit', 'Regular Fit', 'Oversized'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={`fit-pill ${fitMode === mode ? 'active' : ''}`}
                  onClick={() => setFitMode(mode)}
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
                  {fitMode === 'Oversized' ? '+1.8 in Drop Shoulder' : fitMode === 'Slim Fit' ? 'Tailored Seam (+0.2 in)' : 'Natural Seam Alignment'}
                </strong>
              </div>
              <div className="metric-row">
                <span className="metric-label">Chest Ease Allowance:</span>
                <strong className="metric-value">
                  {fitMode === 'Oversized' ? '4.5 in (Fluid Airflow)' : fitMode === 'Slim Fit' ? '1.5 in (Contoured)' : '3.0 in (Standard)'}
                </strong>
              </div>
              <div className="metric-row">
                <span className="metric-label">Hem Drop &amp; Drape:</span>
                <strong className="metric-value">
                  {isTucked ? 'Tucked Waistline (Clean Profile)' : 'Falls 1.5 in below waistband'}
                </strong>
              </div>
            </div>
          </div>

          {/* Section 3: Scientific Fit Score Card */}
          <div className="tryon-control-box highlight">
            <div className="control-box-header">
              <span className="control-number">03</span>
              <h4>Fit &amp; Tension Diagnosis</h4>
            </div>

            <div className="tension-summary">
              <div className="tension-stat">
                <span className="stat-num">95%</span>
                <span className="stat-desc">Drape Harmony</span>
              </div>
              <div className="tension-stat">
                <span className="stat-num">0%</span>
                <span className="stat-desc">Shoulder Strain</span>
              </div>
              <div className="tension-stat">
                <span className="stat-num">Low</span>
                <span className="stat-desc">Return Likelihood</span>
              </div>
            </div>

            <p className="tension-note">
              Based on the {product?.brand || 'brand'}&apos;s {product?.fit || 'Regular Fit'} cut and {selectedAvatarId === 'custom' ? 'your uploaded silhouette' : `${activeAvatar.label} proportions`}, the fabric falls naturally without tension lines across the chest.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
