// Vercel Serverless Function - Upload de imagem para Pinata
const FormData = require('form-data');
const fetch = require('node-fetch');

// Handler principal da função serverless
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
    // Processar body multipart
    const busboy = require('busboy');
    const bb = busboy({ headers: req.headers });

    let fileBuffer;
    let fileName;
    let mimeType;
    let petName;

    await new Promise((resolve, reject) => {
      bb.on('file', (name, file, info) => {
        const { filename, encoding, mimeType: fileMimeType } = info;
        fileName = filename;
        mimeType = fileMimeType;

        const chunks = [];
        file.on('data', (data) => chunks.push(data));
        file.on('end', () => {
          fileBuffer = Buffer.concat(chunks);
        });
      });

      bb.on('field', (name, value) => {
        if (name === 'petName') petName = value;
      });

      bb.on('finish', resolve);
      bb.on('error', reject);

      req.pipe(bb);
    });

    if (!fileBuffer) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    // Validar tipo de arquivo
    if (!mimeType.startsWith('image/')) {
      return res.status(400).json({ error: 'Arquivo deve ser uma imagem' });
    }

    // Criar FormData para Pinata
    const formData = new FormData();
    formData.append('file', fileBuffer, {
      filename: fileName,
      contentType: mimeType
    });

    // Metadata
    const metadata = JSON.stringify({
      name: petName || fileName,
      keyvalues: {
        type: 'pet-image',
        uploadedAt: new Date().toISOString()
      }
    });
    formData.append('pinataMetadata', metadata);

    const options = JSON.stringify({ cidVersion: 1 });
    formData.append('pinataOptions', options);

    // Upload para Pinata
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': process.env.PINATA_API_KEY,
        'pinata_secret_api_key': process.env.PINATA_API_SECRET,
        ...formData.getHeaders()
      },
      body: formData
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
