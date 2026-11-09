# M&S — composição e impressão térmica

## Tamanho físico
- SVG e prévia: 40 × 12 mm, viewBox 2000 × 600 (10:3).
- PNG: 203 DPI = 320 × 96 px; 300 DPI = 472 × 142 px; 600 DPI = 945 × 283 px.
- Na configuração de impressão, usar **tamanho real / 100%**, sem "ajustar à página".
- O branco é o fundo do papel. Nome e quantidade usam tinta preta sem transparência.

## Regras do layout
- O template e o logotipo M&S continuam os arquivos oficiais.
- `src/label/layout.ts` controla a área útil, o dimensionamento em unidades SVG
  e a disposição das linhas. Nenhuma regra depende do tamanho CSS da prévia.
- O nome ocupa uma ou duas linhas, quando isso aumentar significativamente a
  legibilidade. A quantidade usa fonte serifada negritada com até 82% do nome.
- A descrição é opcional e aparece separada, sem reduzir a quantidade a uma legenda.
- A prévia, PNG e SVG compartilham `VintageLabel` (uma única árvore SVG).
- O ajuste evita transbordamento até para nomes extensos e números longos.
- O histórico mantém compatibilidade com valores antigos sem unidade (gramas).
  Valores novos aceitam g, kg, ml e L.

## Ilustrações
- Assets antigos em PNG preservados; novos desenhos em SVG preto e branco,
  com contornos reforçados e hachuras compatíveis com a redução.
- `src/label/assets.ts`: caminhos e IDs do catálogo.
- `src/label/label.types.ts`: opções de seleção manual.
- `src/utils/selectIllustration.ts`: correspondência por palavras completas,
  preferindo o nome do produto à descrição.
- `src/label/assets-manifest.json`: documentação do catálogo.
- Produto desconhecido usa o ornamento neutro já existente.
- Para ampliar: adicionar SVG/PNG em `public/assets/illustrations/`, cadastrar
  caminho e ID nos arquivos acima, criar regra específica e teste correspondente.

## Validação
```sh
npm ci
npm run lint
npm run test
npm run build
```

A qualidade final depende da calibração e da densidade da impressora. Antes de
produzir um lote, imprimir uma etiqueta real para verificar cortes e leitura.
