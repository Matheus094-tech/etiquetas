# Gerador de Etiquetas M&S

Ferramenta de uso pessoal, desenvolvida pela **MB Software**, para gerar etiquetas de
cozinha vintage (preto e branco) a partir de um template visual fixo — sem depender de
geração de imagens por IA a cada etiqueta.

## Objetivo

Substituir a geração recorrente de etiquetas via IA generativa por um template
determinístico em SVG: você digita o nome do alimento, uma descrição opcional, o peso e
escolhe (ou deixa automática) a ilustração, e a etiqueta é montada instantaneamente no
navegador, sempre com a mesma moldura, tipografia e composição.

## Stack

- **React 19** + **TypeScript**
- **Vite** (build e dev server)
- **CSS próprio** (sem framework de UI)
- **Vitest** + Testing Library para testes unitários
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
funciona inteiramente no navegador, sem qualquer chamada de rede após o carregamento
inicial dos arquivos estáticos.

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
   repositório e publicar — nenhuma variável de ambiente é necessária.

## Testes e validações

```bash
npm run lint    # ESLint (TypeScript + regras de React Hooks)
npm run test    # Vitest (testes unitários)
npm run build   # tsc --build + build de produção do Vite
```

Os testes cobrem: normalização do peso, criação do nome do arquivo, seleção automática
da ilustração, serialização/parsing do histórico (incluindo dados malformados),
tratamento de campos vazios, remoção de acentos e substituição de `/` no nome do
arquivo.

## Como adicionar uma nova ilustração

As ilustrações são componentes SVG simples, sem dependências externas, em
`src/label/illustrations/`. Para adicionar uma nova:

1. Crie `src/label/illustrations/MinhaIlustracao.tsx` exportando um componente que
   renderiza um `<g>` desenhado dentro de um viewBox nativo de `240x240` (mesma
   convenção das ilustrações existentes), em preto e branco, sem fill sólido — use
   `stroke` e, se quiser sombreamento, o utilitário `<HatchLines />`
   (`src/label/illustrations/HatchLines.tsx`) para o efeito de gravura antiga.
2. Registre o componente em `ILLUSTRATION_COMPONENTS`, dentro de
   `src/label/LabelIllustration.tsx`.
3. Adicione a nova opção em `ILLUSTRATION_OPTIONS` (`src/label/label.types.ts`), que
   alimenta o `<select>` do formulário.
4. Se fizer sentido, ensine a detecção automática a reconhecê-la por palavra-chave em
   `src/utils/selectIllustration.ts` (função `detectIllustrationFromName`).

Nenhuma imagem externa (arquivo `.png`/`.jpg` ou URL remota) deve ser usada — tudo é
vetor, desenhado em código, para manter a etiqueta nítida em qualquer resolução de
exportação.

## Como funciona a exportação para PNG

A pré-visualização e a exportação usam **a mesma árvore SVG** (não há um "modo de
exportação" separado a ser mantido sincronizado):

1. O SVG ao vivo é clonado e serializado como XML autocontido
   (`src/utils/exportSvg.ts`).
2. Esse XML vira uma `Blob`/`Object URL` e é carregado como uma `Image` do navegador.
3. Essa imagem é desenhada (`drawImage`) em um `<canvas>` dimensionado para a
   resolução de exportação (largura mínima de **2400px**, mantendo a proporção
   1200×750 do template) — como o desenho é vetorial, o navegador rasteriza nessa
   resolução alvo, então o resultado fica nítido em vez de "esticado".
4. O canvas é convertido para PNG (`canvas.toBlob`) e o download é disparado.

Como o `<canvas>` nunca recebe um retângulo de fundo, a transparência fora da moldura é
real (canal alfa 0) e o branco só existe dentro do contorno da etiqueta — o padrão
quadriculado que aparece na pré-visualização é puramente CSS de página e nunca entra no
SVG nem no PNG exportado.

O download do SVG original segue o mesmo passo 1, sem rasterização.

## O sistema não usa IA generativa

Não há geração de imagem por modelo de IA em nenhuma etapa. A etiqueta é sempre a
mesma composição (moldura, ornamentos, medalhão M&S) desenhada em SVG com dados
determinísticos (nome, descrição, peso, ilustração escolhida). O único "algoritmo"
envolvido é o ajuste automático do tamanho do texto do nome (`src/utils/fitText.ts`),
que mede a largura do texto (via `canvas.measureText`, com fallback heurístico) para
escolher o maior tamanho de fonte que caiba no espaço disponível, quebrando em até duas
linhas quando necessário.

## Limitações conhecidas

- As seis ilustrações iniciais (legumes, carne moída, batata com carne, frango, arroz,
  feijão) são desenhos vetoriais próprios, estilizados como gravura vintage — não são
  ilustrações realistas nem fotografias.
- A tipografia usa a pilha de fontes serifadas do sistema (`Georgia`, `Times New
  Roman`, `serif`), para garantir que a aplicação funcione totalmente offline após a
  instalação, sem depender de uma fonte web carregada pela rede.
- A detecção automática de ilustração é baseada em palavras-chave simples (com remoção
  de acentos); nomes de alimentos fora do vocabulário mapeado caem em "sem
  ilustração" e podem ser ajustados manualmente no campo Ilustração.
- Não há exportação em folha A4 com múltiplas etiquetas nesta versão — a arquitetura
  (template SVG único e determinístico, desacoplado da exportação) foi pensada para
  permitir isso no futuro, mas a funcionalidade em si está fora do escopo atual.
- Em navegadores muito antigos sem suporte a `canvas.toBlob` ou a `SVGSVGElement`
  totalmente compatível, a exportação em PNG pode não funcionar; o download do SVG
  depende apenas de `Blob`/`XMLSerializer`, amplamente suportados.
- O histórico guarda no máximo as 10 últimas etiquetas (apenas os dados, nunca a
  imagem) em `localStorage`; limpar os dados do site no navegador apaga esse
  histórico.

## Estrutura do projeto

```
src/
├── components/        # LabelEditor, LabelForm, LabelPreview, LabelHistory, PresetList, ExportActions
├── label/              # VintageLabel (template SVG), ilustrações, tipos e presets
│   └── illustrations/
├── hooks/              # useLabelHistory
├── utils/              # normalizeWeight, createFilename, selectIllustration, fitText, exportSvg, exportPng, historyStorage
├── styles/             # CSS próprio (reset + layout/componentes)
└── App.tsx
```

---

Desenvolvido por MB Software.
