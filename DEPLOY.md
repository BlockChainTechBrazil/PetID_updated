# Guia de Deploy - PetID na Vercel

## 📋 Pré-requisitos

- Conta no GitHub (já tem ✅)
- Conta na Vercel (criar em https://vercel.com)
- Repositório PetID no GitHub (já está no ar)
- Credenciais Pinata (PINATA_API_KEY e PINATA_API_SECRET)

## 🎯 Visão Geral

A aplicação PetID tem dois componentes:
1. **Frontend**: HTML/CSS/JS estático (Vercel serve automaticamente)
2. **Backend**: API Node.js para proxy Pinata (Vercel Serverless Functions)

---

## 🚀 Passo a Passo: Deploy na Vercel

### 1. Preparar o Repositório

Primeiro, vamos adicionar a configuração da Vercel ao projeto:

**Arquivo: `vercel.json`** (criar na raiz do projeto)
```json
{
  "version": 2,
  "buildCommand": "npm install",
  "devCommand": "npm start",
  "env": {
    "PINATA_API_KEY": "@pinata_api_key",
    "PINATA_API_SECRET": "@pinata_api_secret"
  },
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ],
  "headers": [
    {
      "source": "/api/:path*",
      "headers": [
        { "key": "Access-Control-Allow-Credentials", "value": "true" },
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
        { "key": "Access-Control-Allow-Headers", "value": "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" }
      ]
    }
  ]
}
```

### 2. Converter Backend para Serverless Function

**Criar o diretório:** `api/`

**Mover a lógica do server.js para:** `api/upload-image.js`

```javascript
// api/upload-image.js
const multer = require('multer');
const FormData = require('form-data');
const fetch = require('node-fetch');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Processar upload com multer
    await new Promise((resolve, reject) => {
      upload.single('file')(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    // Validar tipo de arquivo
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: 'Arquivo deve ser uma imagem' });
    }

    // Upload para Pinata
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    const metadata = JSON.stringify({
      name: req.body.petName || req.file.originalname,
      keyvalues: {
        type: 'pet-photo',
        uploadedAt: new Date().toISOString()
      }
    });

    formData.append('pinataMetadata', metadata);

    const pinataRes = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': process.env.PINATA_API_KEY,
        'pinata_secret_api_key': process.env.PINATA_API_SECRET,
        ...formData.getHeaders()
      },
      body: formData
    });

    if (!pinataRes.ok) {
      const errorText = await pinataRes.text();
      console.error('Pinata error:', errorText);
      return res.status(500).json({ error: 'Erro ao fazer upload para IPFS' });
    }

    const data = await pinataRes.json();
    
    return res.status(200).json({
      success: true,
      ipfsHash: data.IpfsHash,
      pinataUrl: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`,
      timestamp: data.Timestamp
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: error.message });
  }
}
```

**Criar também:** `api/health.js`

```javascript
// api/health.js
export default function handler(req, res) {
  res.status(200).json({
    status: 'OK',
    service: 'PetID Backend',
    pinataConfigured: !!(process.env.PINATA_API_KEY && process.env.PINATA_API_SECRET),
    timestamp: new Date().toISOString()
  });
}
```

### 3. Atualizar Frontend para usar nova URL

**Editar `public/contract-helper.js` ou onde as chamadas API estão:**

Trocar:
```javascript
const BACKEND_URL = 'http://localhost:3001';
```

Por:
```javascript
const BACKEND_URL = process.env.NODE_ENV === 'production' 
  ? '' // Usar mesma origem na Vercel
  : 'http://localhost:3001';
```

Ou simplesmente usar URLs relativas:
```javascript
// De:
fetch('http://localhost:3001/api/upload-image', ...)

// Para:
fetch('/api/upload-image', ...)
```

### 4. Fazer Push das alterações

```bash
git add .
git commit -m "Configure Vercel deployment"
git push origin main
```

### 5. Deploy na Vercel

1. Acesse https://vercel.com e faça login
2. Clique em **"New Project"**
3. Importe o repositório **PetID** do GitHub
4. Configure as variáveis de ambiente:
   - `PINATA_API_KEY` = sua chave da Pinata
   - `PINATA_API_SECRET` = seu secret da Pinata
5. Clique em **"Deploy"**

### 6. Verificar Deploy

Após o deploy:
- Frontend estará em: `https://petid.vercel.app` (ou URL personalizada)
- API estará em: `https://petid.vercel.app/api/upload-image`

Teste:
```bash
curl https://petid.vercel.app/api/health
```

---

## 🎨 Opção 2: Netlify (Frontend) + Railway (Backend)

Se preferir separar:

### Frontend na Netlify:
1. Login em https://netlify.com
2. Conectar repositório GitHub
3. Build settings:
   - Build command: (deixar vazio)
   - Publish directory: `/`
4. Deploy!

### Backend no Railway:
1. Login em https://railway.app
2. New Project → Deploy from GitHub
3. Selecionar repositório PetID
4. Configurar variáveis:
   - `PINATA_API_KEY`
   - `PINATA_API_SECRET`
   - `PORT=3001`
   - `FRONTEND_URL=https://seu-site.netlify.app`
5. Railway detectará o `package.json` e rodará `npm start`

**Atualizar frontend para apontar para Railway:**
```javascript
const BACKEND_URL = 'https://petid-production.up.railway.app';
```

---

## 🔒 Configurações de Segurança

### Variáveis de Ambiente (.env)
Nunca commitar o arquivo `.env` ao Git!

No `.gitignore` deve ter:
```
.env
.env.local
```

### CORS
Na Vercel, o CORS é configurado no `vercel.json`.
No Railway, o backend já tem configuração dinâmica.

---

## 📝 Checklist Final

- [ ] Código commitado no GitHub
- [ ] `vercel.json` criado (se usar Vercel)
- [ ] Serverless functions criadas em `/api`
- [ ] Frontend usando URLs relativas ou variável de ambiente
- [ ] Variáveis PINATA configuradas na plataforma
- [ ] `.env` no `.gitignore`
- [ ] Deploy realizado com sucesso
- [ ] Teste de upload de imagem funcionando
- [ ] Conexão MetaMask funcionando
- [ ] Contratos apontando para Sepolia (já configurado)

---

## 🆘 Troubleshooting

### Erro: "Module not found"
- Verifique se todas as dependências estão no `package.json`
- Rode `npm install` localmente primeiro

### Erro: CORS
- Verifique configuração no `vercel.json`
- Headers devem permitir origem do seu domínio

### Erro: Pinata upload falha
- Verifique se as variáveis de ambiente estão corretas
- Teste as credenciais localmente primeiro

### MetaMask não conecta
- Certifique-se de usar HTTPS (Vercel/Netlify fornecem automaticamente)
- Verifique console do navegador para erros

---

## 🎉 Pronto!

Após o deploy, sua aplicação estará acessível publicamente e funcionando com:
- ✅ Frontend hospedado
- ✅ Backend serverless
- ✅ Upload de imagens via Pinata
- ✅ Contratos na Sepolia
- ✅ HTTPS automático

**URL final:** `https://petid.vercel.app` (ou domínio personalizado)
