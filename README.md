# PetID — Landing Page (Tailwind + Vanilla JS)

Template simples de landing page para um dApp Web3 (PetID). Mobile-first, feita com Tailwind CDN e JavaScript leve (menu toggle + animações de entrada).

```markdown
# PetID — Landing Page (Tailwind + Vanilla JS)

Template simples de landing page para um dApp Web3 (PetID). Mobile-first, feita com Tailwind CDN e JavaScript leve (menu toggle + animações de entrada).

Como usar
- Abra `index.html` diretamente no navegador (recomendo rodar via servidor local para evitar bloqueios de recursos).

Servir localmente (opções):

PowerShell / CMD (Python 3):
```bash
python -m http.server 8000
```

npx (serve):
```bash
npx serve . -l 5000
```

Arquivos criados
- `index.html` — template principal
- `assets/hero-petid-illustration.svg` — placeholder de ilustração

Personalização Rápida
- Troque cores editando classes Tailwind (`text-purple-600`, `bg-blue-500`, etc.).
- Substitua o SVG em `assets/hero-petid-illustration.svg` por ilustração designada.
- Para adicionar integrações Web3, insira scripts de provider (MetaMask / ethers.js / @dfinity/agent) e implemente fluxos de conexão no botão "Conectar Wallet".

Quer que eu adicione um exemplo de integração com `ethers.js` para conectar Metamask e mostrar endereço?

Gerar PNGs a partir de SVGs

Se quiser gerar variantes PNG responsivas a partir dos SVGs em `assets/`, use o script Node incluído. Exemplo:

```bash
cd c:\Users\davio\projects\blockchaintech\PetId
npm install
npm run generate-pngs
```

Os PNGs serão gerados em `assets/` com sufixos `-320.png`, `-640.png`, `-1280.png`.
```
