import dotenv from 'dotenv'

dotenv.config()

const WATSONX_URL =
  process.env.WATSONX_URL || 'https://us-south.ml.cloud.ibm.com'

const WATSONX_API_KEY = process.env.WATSONX_API_KEY
const WATSONX_PROJECT_ID = process.env.WATSONX_PROJECT_ID

export async function getWatsonxToken() {
  if (!WATSONX_API_KEY) {
    throw new Error('WATSONX_API_KEY is missing from .env')
  }

  const response = await fetch(
    'https://iam.cloud.ibm.com/identity/token',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
        apikey: WATSONX_API_KEY,
      }),
    },
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`IBM authentication failed: ${errorText}`)
  }

  const data = await response.json()

  return data.access_token
}

export async function getWatsonxConfig() {
  if (!WATSONX_PROJECT_ID) {
    throw new Error('WATSONX_PROJECT_ID is missing from .env')
  }

  const token = await getWatsonxToken()

  return {
    url: WATSONX_URL,
    projectId: WATSONX_PROJECT_ID,
    token,
  }
}

export async function getFoundationModels() {
  const config = await getWatsonxConfig()

  const response = await fetch(
    `${config.url}/ml/v1/foundation_model_specs?version=2024-03-01`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/json',
      },
    },
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data?.errors?.[0]?.message ||
        'Could not retrieve IBM foundation models.',
    )
  }

  return data
}