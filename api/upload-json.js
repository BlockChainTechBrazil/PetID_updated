// Vercel Serverless Function - Upload de metadata JSON para Pinata
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { metadata } = req.body;

    if (!metadata) {
      return res.status(400).json({ error: 'Metadata é obrigatório' });
    }

    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': process.env.PINATA_API_KEY,
        'pinata_secret_api_key': process.env.PINATA_API_SECRET
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: metadata.name || 'Pet Metadata',
          keyvalues: {
            type: 'pet-metadata',
            uploadedAt: new Date().toISOString()
          }
        },
        pinataOptions: {
          cidVersion: 1
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Pinata error:', error);
      return res.status(response.status).json({ 
        error: `Pinata upload failed: ${error.error || response.statusText}` 
      });
    }

    const result = await response.json();

    return res.status(200).json({
      ipfsHash: result.IpfsHash,
      pinataUrl: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
      gatewayUrl: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: error.message });
  }
};
