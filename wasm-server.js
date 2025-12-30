const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;

// CORS para permitir acceso desde localhost:3000
app.use(cors());

// Servir archivos WASM con headers correctos
app.use('/wasm', (req, res, next) => {
  if (req.path.endsWith('.wasm')) {
    res.setHeader('Content-Type', 'application/wasm');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  }
  next();
}, express.static(path.join(__dirname, 'public', 'wasm')));

app.listen(PORT, () => {
  console.log(`🚀 WASM server running on http://localhost:${PORT}`);
});
