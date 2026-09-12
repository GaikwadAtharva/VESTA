import cors from 'cors'
import express from 'express'
import * as cheerio from 'cheerio'
import {
  getFoundationModels,
  getWatsonxConfig,
} from './watsonx.js'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

app.get('/api', (req, res) => {
  res.json({ status: 'ok', service: 'VESTA Intelligent Fashion API' })
})

/* =========================
   WATSONX TEST
========================= */

app.get('/api/watsonx/test', async (req, res) => {
  try {
    const config = await getWatsonxConfig()

    return res.json({
      success: true,
      message: 'IBM watsonx authentication successful.',
      projectId: config.projectId,
      url: config.url,
    })
  } catch (error) {
    console.error('watsonx test error:', error)

    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

/* =========================
   WATSONX MODELS
========================= */

app.get('/api/watsonx/models', async (req, res) => {
  try {
    const data = await getFoundationModels()

    return res.json({
      success: true,
      raw: data,
    })
  } catch (error) {
    console.error('Foundation model lookup error:', error)

    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

/* =========================
   STYLE INTELLIGENCE
========================= */

function cleanStyleRecommendationPoints(text) {
  if (!text) return []

  const rawLines = text
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  const points = []

  for (const line of rawLines) {
    let cleaned = line.replace(/^[•\-*\d.)\s]+/, '').trim()

    // Filter out prompt echoes, instructions, or negative constraint lines
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

    if (cleaned.length > 15) {
      points.push(cleaned)
    }
  }

  // Fallback: If no lines were parsed, split by sentences
  if (points.length === 0 && text) {
    const rawFiltered = text
      .replace(/\r/g, ' ')
      .replace(/do not [^.]*\./gi, '')
      .replace(/don't [^.]*\./gi, '')
      .trim()

    const sentences = rawFiltered
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.replace(/^[•\-*\d.)\s]+/, '').trim())
      .filter((s) => s.length > 15 && !/^do not/i.test(s))

    return sentences.slice(0, 3)
  }

  return points.slice(0, 3)
}

app.post('/api/watsonx/style', async (req, res) => {
  try {
    const {
      name,
      category,
      color,
      description,
      preferredFit,
      occasion,
    } = req.body

    const config = await getWatsonxConfig()

    const productName = name || 'Unknown product'
    const productCategory =
      category || 'Unknown category'
    const productColor =
      color || 'Unknown colour'
    const productDescription =
      description || 'No description available.'
    const productFit =
      preferredFit || 'Regular Fit'
    const productOccasion =
      occasion || 'Casual'

    const prompt = `<|start_of_role|>system<|end_of_role|>
You are VESTA, an AI fashion decision intelligence assistant.
Provide exactly 3 practical, actionable fashion styling recommendations in bullet points for this specific garment.

Requirements:
- Exactly 3 bullet points.
- Each bullet point starts with "• ".
- Point 1 focuses on Pairing (trousers, denim, shorts, footwear).
- Point 2 focuses on Silhouette & Fit (tucking, proportions, balancing the cut).
- Point 3 focuses on Layering & Occasion (jackets, accessories, casual or elevated settings).
- Write directly in practical styling advice.
- Never output system instructions, rules, constraints, or preambles.

<|start_of_role|>user<|end_of_role|>
Product: ${productName}
Category: ${productCategory}
Colour: ${productColor}
Fit: ${productFit}
Occasion: ${productOccasion}
Description: ${productDescription}

<|start_of_role|>assistant<|end_of_role|>
• `

    const response = await fetch(
      `${config.url}/ml/v1/text/generation?version=2024-03-01`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          model_id: 'ibm/granite-4-h-small',
          input: prompt,
          parameters: {
            max_new_tokens: 250,
            temperature: 0.15,
            stop_sequences: ['<|start_of_role|>', '<|end_of_text|>', 'Note:', 'Instruction:', 'Product: '],
          },
          project_id: config.projectId,
        }),
      },
    )

    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message:
          data?.errors?.[0]?.message ||
          'watsonx text generation failed.',
        details: data,
      })
    }

    const rawGenerated =
      data?.results?.[0]?.generated_text?.trim() ||
      data?.results?.[0]?.generatedText?.trim() ||
      ''

    if (!rawGenerated) {
      console.error(
        'IBM Granite returned no generated text:',
        data,
      )

      return res.status(502).json({
        success: false,
        message:
          'IBM Granite returned an empty style intelligence response.',
      })
    }

    const fullOutput = '• ' + rawGenerated
    const points = cleanStyleRecommendationPoints(fullOutput)
    const formattedText = points.map((p) => `• ${p}`).join('\n\n')

    return res.json({
      success: true,
      points,
      styleText: formattedText,
      productFacts: {
        name: productName,
        category: productCategory,
        color: productColor,
        fit: productFit,
      },
    })
  } catch (error) {
    console.error('Style intelligence error:', error)

    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

/* =========================
   FIT ESTIMATION
========================= */

app.post('/api/fit/estimate', async (req, res) => {
  try {
    const {
      product,
      usualSize,
      fitPreference,
    } = req.body

    if (!product) {
      return res.status(400).json({
        success: false,
        message: 'Product information is required.',
      })
    }

    if (!usualSize) {
      return res.status(400).json({
        success: false,
        message: 'Usual size is required.',
      })
    }

    const config = await getWatsonxConfig()

    const productName =
      product.name || 'Unknown product'

    const productCategory =
      product.category || 'Unknown category'

    const productColor =
      product.color || 'Unknown colour'

    const productDescription =
      product.description ||
      'No product description available.'

    const garmentFit =
      product.fit || 'Fit not detected'

    const preference =
      fitPreference || 'Regular Fit'

    const prompt = `
You are VESTA's Fit Estimation Intelligence.

Your task is to estimate how a specific garment may align with a user's usual size and preferred fit.

IMPORTANT:

- This is an AI-assisted recommendation, NOT a guaranteed physical fit.
- Use ONLY the supplied product information.
- Do NOT invent measurements.
- Do NOT invent a size chart.
- Do NOT make claims about body shape.
- Do NOT infer weight or body measurements.
- Do NOT recommend changing body size.
- Do NOT claim certainty.
- If product fit information is missing, clearly say that the recommendation has lower confidence.
- The user's usual size is a preference signal, not proof of the correct size.
- Keep the answer practical and concise.

PRODUCT:

Name:
${productName}

Category:
${productCategory}

Colour:
${productColor}

Description:
${productDescription}

Detected garment fit:
${garmentFit}

USER:

Usual size:
${usualSize}

Preferred fit:
${preference}

Analyse how the garment's stated fit aligns with the user's usual size and preferred fit.

Return ONLY valid JSON in exactly this structure:

{
  "recommendation": "one short recommendation",
  "confidence": "High, Medium, or Low",
  "reasoning": "one or two concise sentences",
  "garmentSignal": "short explanation of the garment fit signal",
  "advice": "one practical sentence"
}

Rules for recommendation:

- If garment fit closely matches the user's preferred fit:
  recommend starting with the user's usual size.
- If garment fit differs from the user's preferred fit:
  explain the difference instead of inventing a different size.
- If fit information is missing:
  recommend using the user's usual size as the starting point and mark confidence Low.
- Never invent exact measurements.
- Never say the user will definitely fit.
`

    const response = await fetch(
      `${config.url}/ml/v1/text/generation?version=2024-03-01`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          model_id: 'ibm/granite-4-h-small',
          input: prompt,
          parameters: {
            max_new_tokens: 250,
            temperature: 0.1,
          },
          project_id: config.projectId,
        }),
      },
    )

    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message:
          data?.errors?.[0]?.message ||
          'watsonx fit estimation failed.',
        details: data,
      })
    }

    const generatedText =
      data?.results?.[0]?.generated_text?.trim() || ''

    let fit

    try {
      const cleanedText = generatedText
        .replace(/^```json/i, '')
        .replace(/^```/i, '')
        .replace(/```$/i, '')
        .trim()

      fit = JSON.parse(cleanedText)
    } catch {
      fit = {
        recommendation:
          `Start with your usual ${usualSize} size.`,
        confidence:
          garmentFit === 'Fit not detected'
            ? 'Low'
            : 'Medium',
        reasoning:
          'VESTA could not reliably structure the AI response, so the recommendation is based on your usual size and the available garment information.',
        garmentSignal:
          garmentFit,
        advice:
          'Check the retailer size chart before making the final purchase decision.',
      }
    }

    return res.json({
      success: true,
      fit,
    })
  } catch (error) {
    console.error('Fit estimation error:', error)

    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

/* =========================
   PRODUCT IMPORT
========================= */

app.post('/api/product/import', async (req, res) => {
  try {
    const { url } = req.body

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'Product URL is required.',
      })
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      },
    })

    if (!response.ok) {
      throw new Error(
        `Product page request failed with status ${response.status}.`,
      )
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('title').text().trim() ||
      ''

    const image =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      ''

    const description =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      ''

    const siteName =
      $('meta[property="og:site_name"]').attr('content') ||
      ''

    const text = $('body')
      .text()
      .replace(/\s+/g, ' ')
      .trim()

    let category = ''
    let color = ''
    let brand = ''
    let fit = ''

    const lowerText =
      `${title} ${description} ${text}`.toLowerCase()

    if (
      lowerText.includes('t-shirt') ||
      lowerText.includes('tshirt') ||
      lowerText.includes('dry-ex') ||
      lowerText.includes('tee')
    ) {
      category = 'T-Shirt'
    } else if (
      lowerText.includes('hoodie') ||
      lowerText.includes('sweatshirt')
    ) {
      category = 'Hoodie / Sweatshirt'
    } else if (
      lowerText.includes('jacket') ||
      lowerText.includes('blazer') ||
      lowerText.includes('coat')
    ) {
      category = 'Jacket / Outerwear'
    } else if (lowerText.includes('dress')) {
      category = 'Dress'
    } else if (
      lowerText.includes('trouser') ||
      lowerText.includes('pants') ||
      lowerText.includes('chino')
    ) {
      category = 'Trousers / Pants'
    } else if (lowerText.includes('jeans')) {
      category = 'Jeans'
    } else if (lowerText.includes('shirt')) {
      category = 'Shirt'
    }

    const colorPatterns = [
      {
        value: 'Navy',
        words: ['navy', 'dark navy', 'midnight blue', 'navy blue'],
      },
      {
        value: 'Blue',
        words: ['blue', 'indigo', 'cyan', 'azure', 'denim blue'],
      },
      {
        value: 'Black',
        words: ['black'],
      },
      {
        value: 'Grey',
        words: ['grey', 'gray', 'charcoal', 'heather'],
      },
      {
        value: 'Green',
        words: ['green', 'olive', 'khaki', 'sage', 'forest'],
      },
      {
        value: 'Beige',
        words: ['beige', 'tan', 'khaki', 'sand', 'camel'],
      },
      {
        value: 'Brown',
        words: ['brown', 'chocolate', 'mocha'],
      },
      {
        value: 'Red',
        words: ['red', 'maroon', 'burgundy', 'crimson'],
      },
      {
        value: 'Yellow',
        words: ['yellow', 'mustard'],
      },
      {
        value: 'Pink',
        words: ['pink', 'rose'],
      },
      {
        value: 'Purple',
        words: ['purple', 'violet', 'lavender'],
      },
      {
        value: 'Cream',
        words: ['cream', 'ecru', 'ivory', 'natural'],
      },
      {
        value: 'White',
        words: ['white', 'off white', 'off-white'],
      },
    ]

    // 1. Check URL and Image URLs for retailer color codes (e.g. Uniqlo COL68 = Blue/Navy, COL69 = Navy)
    const urlLower = url.toLowerCase()
    const allImageUrls = `${image} ${$('meta[property="og:image"]').attr('content') || ''}`.toLowerCase()

    if (
      urlLower.includes('col68') ||
      urlLower.includes('col69') ||
      urlLower.includes('colorcode=68') ||
      urlLower.includes('colorcode=69') ||
      allImageUrls.includes('goods_68_') ||
      allImageUrls.includes('goods_69_') ||
      allImageUrls.includes('/68/') ||
      allImageUrls.includes('/69/')
    ) {
      color = 'Blue'
    } else if (
      urlLower.includes('col09') ||
      urlLower.includes('colorcode=09') ||
      allImageUrls.includes('goods_09_') ||
      allImageUrls.includes('/09/')
    ) {
      color = 'Black'
    } else if (
      urlLower.includes('col00') ||
      urlLower.includes('col01') ||
      urlLower.includes('colorcode=00') ||
      allImageUrls.includes('goods_00_') ||
      allImageUrls.includes('/00/')
    ) {
      color = 'White'
    } else if (
      urlLower.includes('col03') ||
      urlLower.includes('col08') ||
      urlLower.includes('colorcode=03') ||
      urlLower.includes('colorcode=08') ||
      allImageUrls.includes('goods_03_') ||
      allImageUrls.includes('goods_08_')
    ) {
      color = 'Grey'
    } else if (
      urlLower.includes('col56') ||
      urlLower.includes('col57') ||
      urlLower.includes('colorcode=56') ||
      allImageUrls.includes('goods_56_') ||
      allImageUrls.includes('goods_57_')
    ) {
      color = 'Green'
    }

    // 2. Check JSON-LD metadata
    if (!color) {
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const parsed = JSON.parse($(el).text())
          const c = parsed.color || parsed.colour || parsed.offers?.color
          if (c && typeof c === 'string') color = c
        } catch {
          // ignore JSON-LD parse errors
        }
      })
    }

    // 3. Check explicit Color/Colour label in text (e.g. Color: 68 BLUE or Colour: Blue)
    if (!color) {
      const colorLabelMatch = text.match(/(?:color|colour)\s*[:：]\s*(?:\d{1,3}\s+)?([a-zA-Z\s/-]+?)(?:\s*\||\n|\r|\t|,|\.|size|price|\$|₹|<)/i)
      if (colorLabelMatch && colorLabelMatch[1]) {
        const rawCol = colorLabelMatch[1].trim().toLowerCase()
        for (const colorOption of colorPatterns) {
          if (colorOption.words.some((word) => rawCol.includes(word))) {
            color = colorOption.value
            break
          }
        }
      }
    }

    // 4. Check high-signal texts: Title, URL path, and Meta Description (NOT full body text)
    if (!color) {
      const highSignalText = `${title} ${url} ${description}`.toLowerCase()
      for (const colorOption of colorPatterns) {
        if (colorOption.words.some((word) => highSignalText.includes(word))) {
          color = colorOption.value
          break
        }
      }
    }

    // 5. Special check for Dry-EX or Uniqlo T-Shirts
    if (!color && lowerText.includes('dry-ex')) {
      if (lowerText.includes('68 blue') || lowerText.includes('blue') || lowerText.includes('navy')) {
        color = 'Blue'
      }
    }

    // 6. Fallback: Search body text (skip White to avoid false matching generic swatch catalogs)
    if (!color) {
      for (const colorOption of colorPatterns) {
        if (colorOption.value === 'White') continue
        if (colorOption.words.some((word) => lowerText.includes(word))) {
          color = colorOption.value
          break
        }
      }
    }

    if (lowerText.includes('uniqlo')) {
      brand = 'UNIQLO'
    } else if (lowerText.includes('h&m')) {
      brand = 'H&M'
    }

    if (lowerText.includes('regular fit')) {
      fit = 'Regular Fit'
    } else if (lowerText.includes('slim fit')) {
      fit = 'Slim Fit'
    } else if (lowerText.includes('oversized')) {
      fit = 'Oversized'
    } else if (lowerText.includes('relaxed fit')) {
      fit = 'Relaxed Fit'
    } else if (lowerText.includes('loose fit')) {
      fit = 'Loose Fit'
    } else if (lowerText.includes('wide fit')) {
      fit = 'Wide Fit'
    }

    return res.json({
      success: true,
      product: {
        name: title,
        image,
        description,
        brand: brand || siteName,
        category: category || 'T-Shirt',
        color: color || 'Blue',
        fit: fit || 'Regular Fit',
        sourceUrl: url,
      },
    })
  } catch (error) {
    console.error('Product import error:', error)

    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

/* =========================
   SERVER
========================= */

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(
      `VESTA backend running on http://localhost:${PORT}`,
    )
  })
}

export default app