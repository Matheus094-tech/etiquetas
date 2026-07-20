# Gerador de Etiquetas M&S

Ferramenta de uso pessoal, desenvolvida pela **MB Software**, para gerar etiquetas de
cozinha vintage (preto e branco) a partir do template oficial M&S — sem depender de
geração de imagens por IA a cada etiqueta.

## Objetivo

Substituir a geração recorrente de etiquetas via IA generativa por uma composição
determinística no navegador: você digita o nome do alimento, uma descrição opcional e o
peso, escolhe (ou deixa automática) a ilustração, e a etiqueta é montada
instantaneamente usando os assets oficiais aprovados (moldura, logo M&S e ilustrações),
no tamanho físico exato de **40mm × 12mm** (proporção 10:3).

## Stack

- **React 19** + **TypeScript**
- **Vite** (build e dev server)
- **CSS próprio** (sem framework de UI)
- **Vitest** para testes unitários
- Aplicação **100% client-side**: sem backend, sem banco de dados, sem Supabase, sem
  chamadas a APIs externas e sem IA generativa
- Persistência local via **localStorage** (apenas os dados do histórico, nunca as
  imagens geradas)
- Pronta para hospedagem estática compatível com **Netlify** (`netlify.toml` incluso)

## Como instalar

Pré-requisitos: Node.js 20+ e npm.

```bash
npm install
```

## Como executar (desenvolvimento)

```bash
npm run dev
```

Acesse o endereço exibido no terminal (por padrão `http://localhost:5173`). A aplicação
funciona inteiramente no navegador; os únicos "pedidos de rede" são para os próprios
assets estáticos do projeto (`/assets/...`), servidos pelo mesmo servidor/hospedagem —
nunca para um serviço externo.

## Como gerar o build de produção

```bash
npm run build
```

Os arquivos otimizados são gerados em `dist/`. Para pré-visualizar o build localmente:

```bash
npm run preview
```

## Como publicar na Netlify

1. Faça o build (`npm run build`) ou deixe a Netlify rodar o build automaticamente.
2. Configure:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
3. O arquivo `netlify.toml` na raiz do projeto já define esses valores e um redirect
   `/* -> /index.html` (necessário porque é uma SPA), então basta conectar o
   repositório e publicar — nenhuma variável de ambiente é necessária. Os assets em
   `public/assets/` são copiados para `dist/assets/` automaticamente pelo Vite.

## Testes e validações

```bash
npm run lint    # ESLint (TypeScript + regras de React Hooks)
npm run test    # Vitest (testes unitários)
npm run build   # tsc --build + build de produção do Vite
```

Os testes cobrem: normalização do peso (incluindo o separador de milhar `1.560g`),
criação do nome do arquivo (com sufixo de resolução), seleção automática da ilustração
(ordem de regras específica → genérica, conforme `docs/illustration-map.example.ts` do
pacote oficial), serialização/parsing do histórico, embutimento de imagens locais como
data URL para exportação, tratamento de campos vazios, remoção de acentos e substituição
de `/` no nome do arquivo.

## Assets oficiais

A etiqueta é composta a partir dos arquivos oficiais aprovados, em `public/assets/`
(servidos como estão — nenhum é redesenhado):

```
public/assets/
├── brand/logo-ms.png                         # medalhão M&S
├── template/
│   ├── etiqueta-base-40x12mm.png             # moldura + fundo branco (camada de baixo)
│   └── moldura-overlay-40x12mm.png           # moldura por cima (camada de cima, transparente no centro)
└── illustrations/
    ├── legumes.png
    ├── carne-moida.png
    ├── carne-com-batata.png
    ├── batata-patinho.png
    ├── fruta-coloral.png
    └── default-ornamento.png                 # fallback quando nada corresponde
```

`src/label/assets-manifest.json` (cópia do manifesto do pacote oficial) e
`src/label/assets.ts` documentam a origem e as URLs desses arquivos.

### Como adicionar uma nova ilustração

Sem redesenhar nada em código — apenas registrando um novo arquivo oficial:

1. Coloque o PNG aprovado (fundo transparente) em `public/assets/illustrations/`.
2. Adicione o `id` e a URL em `ILLUSTRATION_ASSET_URLS`
   (`src/label/assets.ts`).
3. Adicione a opção correspondente em `IllustrationKey` e `ILLUSTRATION_OPTIONS`
   (`src/label/label.types.ts`), para aparecer no seletor manual do formulário.
4. Se fizer sentido, ensine a detecção automática a reconhecê-la por palavra-chave em
   `src/utils/selectIllustration.ts` (função `detectIllustrationFromName`) — mantendo
   as regras mais específicas antes das mais genéricas.

## Como funciona a composição e a exportação

`src/label/VintageLabel.tsx` monta um único `<svg>` (`viewBox="0 0 2000 600"`,
`width="40mm"`, `height="12mm"`) empilhando, nesta ordem, `<image>` do template base →
`<image>` do logo → texto do nome → texto de descrição/peso → `<image>` da ilustração
resolvida → `<image>` do overlay da moldura por cima de tudo. A mesma árvore SVG
alimenta a pré-visualização e as duas exportações (não há um "modo de exportação"
separado a manter sincronizado).

Como as imagens são referenciadas por URL local (`/assets/...`), antes de qualquer
download `src/utils/embedSvgImages.ts` busca cada arquivo, converte para uma **data URL
base64** e substitui o `href` num clone do SVG — por isso o arquivo baixado (SVG ou PNG)
abre corretamente sozinho, mesmo sem internet e fora do site.

- **SVG**: o clone com as imagens já embutidas é serializado como XML autocontido
  (`src/utils/exportSvg.ts`) e baixado com `width="40mm"`/`height="12mm"`.
- **PNG**: o mesmo clone embutido é desenhado (`drawImage`) num `<canvas>` nos dois
  tamanhos de impressão exigidos (`src/utils/exportPng.ts`): **300 DPI → 472×142px** e
  **600 DPI → 945×283px** (calculados a partir do tamanho físico de 40mm×12mm; uma
  diferença de 1px por arredondamento é esperada). O canvas nunca recebe um retângulo
  de fundo, então a transparência fora da moldura é real e o branco só existe dentro do
  contorno da etiqueta.

O padrão quadriculado da pré-visualização é puramente CSS de página — nunca entra no
SVG nem no PNG exportado.

## O sistema não usa IA generativa

Não há geração de imagem por modelo de IA em nenhuma etapa, nem redesenho dos assets: a
etiqueta é sempre a mesma composição de arquivos oficiais aprovados (moldura, medalhão
M&S, ilustrações) com dados determinísticos do formulário (nome, descrição, peso,
ilustração escolhida). O único "algoritmo" envolvido é o ajuste automático do tamanho do
texto do nome (`src/utils/fitText.ts`), que mede a largura real do texto (via
`canvas.measureText`, com fallback heurístico) para escolher o maior tamanho de fonte
que caiba no espaço disponível, quebrando em até duas linhas quando necessário.

## Limitações conhecidas

- O conjunto de ilustrações é o do pacote oficial aprovado (legumes, carne moída, carne
  com batata, batata/patinho, fruta/coloral) mais o ornamento padrão de fallback; comidas
  fora desse vocabulário (ex.: frango, arroz, feijão) caem no ornamento padrão até que um
  novo asset oficial seja fornecido — a detecção automática não inventa ilustrações.
- A tipografia usa a pilha de fontes serifadas do sistema (`Georgia`, `Times New
  Roman`, `serif`), para garantir que a aplicação funcione totalmente offline após a
  instalação, sem depender de uma fonte web carregada pela rede.
- A exportação SVG/PNG faz uma busca (`fetch`) local aos arquivos em `/assets/...` para
  embuti-los como data URL; isso exige que o site esteja carregado normalmente (local ou
  hospedado) — não há chamada a nenhum serviço externo.
- Não há exportação em folha A4 com múltiplas etiquetas nesta versão — a arquitetura
  (uma única árvore SVG determinística, desacoplada da exportação) foi pensada para
  permitir isso no futuro, mas a funcionalidade em si está fora do escopo atual.
- O histórico guarda no máximo as 10 últimas etiquetas (apenas os dados, nunca a
  imagem) em `localStorage`; limpar os dados do site no navegador apaga esse
  histórico.

## Estrutura do projeto

```
public/assets/          # template, logo e ilustrações oficiais (ver "Assets oficiais")
src/
├── components/         # LabelEditor, LabelForm, LabelPreview, LabelHistory, PresetList, ExportActions
├── label/               # VintageLabel (composição SVG), assets.ts, tipos e presets
├── hooks/               # useLabelHistory
├── utils/               # normalizeWeight, createFilename, selectIllustration, fitText,
│                        # exportSvg, exportPng, embedSvgImages, historyStorage
├── styles/              # CSS próprio (reset + layout/componentes)
└── App.tsx
```

---

Desenvolvido por MB Software.
