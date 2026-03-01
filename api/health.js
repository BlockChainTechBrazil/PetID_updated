// Vercel Serverless Function - Health check
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  return res.status(200).json({
    status: 'OK',
    service: 'PetID Backend (Vercel)',
    pinataConfigured: !!(process.env.PINATA_API_KEY && process.env.PINATA_API_SECRET),
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL_ENV || 'development'
  });
};
