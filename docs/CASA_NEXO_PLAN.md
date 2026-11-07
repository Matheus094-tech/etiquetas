# Casa Nexo — plano de evolução do Etiquetas M&S

## Objetivo
Aplicativo privado e compartilhado entre dois moradores para responder, rapidamente:
- O que já temos em casa?
- Onde está guardado?
- O que realmente precisa ser comprado?
- Quanto gastamos e com o quê?

A identidade M&S e o gerador existente de etiquetas de 40 × 12 mm devem ser preservados.

## Estado atual (novembro/2026)
React 19, Vite, TypeScript, React Router, Vitest e Netlify. A rota `/etiquetas` já existe. O histórico do gerador é localStorage, não compartilhado. Ainda não há autenticação, backend, estoque ou finanças.

## Jornada prioritária
1. Ambos entram com sua conta e são associados à mesma Casa por convite de uso único.
2. Organizam locais: cozinha > despensa > prateleira 1; lavanderia > armário superior; geladeira; freezer.
3. Cadastram produtos com foto tirada na hora, nome, marca, embalagem, quantidade, local e (opcional) validade.
4. Em qualquer celular, abrem o estoque ou pesquisam para verificar quantidade antes de comprar.
5. Adicionam produtos à lista compartilhada; itens são riscados em tempo real.
6. Registram compra e entrada em estoque, sem duplicar registros.
7. Consultam gastos mensais e evolução por categoria/mercado.
8. Geram etiquetas a partir de produtos cadastrados, sem redigitar dados.

## Domínios e telas propostas
- `/` — painel: faltando, vencendo, compras pendentes e gasto do mês.
- `/estoque` — busca, foto, quantidade, localização, validade, alerta mínimo, entradas e baixas.
- `/locais` — organização por cômodos, armários, prateleiras, gavetas, geladeira e freezer.
- `/compras` — lista compartilhada, progresso, sugestão de reposição e confirmação de compra.
- `/financas` — despesas domésticas, compras por mercado, categoria, mês e quem pagou.
- `/etiquetas` — gerador original, futuramente integrado ao cadastro.
- `/configuracoes` — moradores, convites, nome da Casa.

Navegação mobile-first com busca sempre acessível e botões grandes para ações frequentes.

## Identificação por fotografia
- Produto individual: enviar foto para bucket privado (Supabase Storage), gerar miniatura e criar cadastro em rascunho; reconhecimento de imagem com IA/OCR é uma etapa opcional servida por função no backend, nunca por chave de API no front-end.
- Foto de um armário com muitos itens: reconhecimento em lote produz **sugestões**, não saldos definitivos; usuário confirma nome, quantidade e local.
- Código de barras, quando disponível, facilita a identificação, mas pode haver erros de catálogo e variações de embalagem.
- Foto de comprovante: extrair itens, preços e total para revisão antes de registrar despesa/estoque. Nunca assumir preço/quantidade com base só em foto ambígua.
- Futuro fluxo ChatGPT: envio de fotos e revisão de sugestões através de um endpoint autenticado, auditável e com autorização da Casa. O GitHub não é o banco de dados da aplicação.

## Regras de produto
- Produto é um catálogo; lote representa quantidade em determinado local, com validade e preço de referência.
- Manter unidade consistente (ex.: um frasco de 1,5 L equivale a uma unidade de estoque; 1 L não equivale a 1 frasco).
- Movimentações com histórico: compra, consumo, ajuste, descarte, transferência.
- No MVP, considerar estoque suficiente quando `quantidade total > reorder_at`. Só sugerir compra quando `total <= reorder_at`, sem comprar nada automaticamente.
- Data de validade é opcional; exibir avisos apenas quando preenchida.
- O financeiro doméstico inicial acompanha despesas; não deve misturar automaticamente movimentações de estoque com gastos. Uma compra confirmada pode gerar ambas as ações numa única transação de backend futura.
- Lançamentos domésticos podem registrar quem pagou. Rateios, parcelamentos e integrações bancárias ficam para outra fase.

## Arquitetura e segurança
- Frontend atual: React/TypeScript; backend recomendado: Supabase (Auth + PostgreSQL + Storage).
- Banco inicial: `supabase/migrations/202611070001_shared_house_foundation.sql`.
- Todas as entidades associadas a `house_id`, com políticas RLS e vínculos internos que não atravessam Casas.
- Fotos e comprovantes em bucket privado, com caminhos prefixados por `house_id`; nunca publicar links permanentes nem subir imagens privadas no GitHub.
- Login individual para cada morador, sem compartilhar senha; convite criado por proprietário, expira em 48 h e só pode ser consumido uma vez.
- Movimentos de estoque atômicos via RPC. Criar lote com zero e depois creditar via movimento; nunca escrever diretamente em `quantity`.
- **Limitação intencional da fundação**: transação integrada de fechamento de compra, UX de upload, autenticação no frontend e integração com provedor de IA ainda não existem.
- Deploy Netlify: configurar `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no ambiente; apenas chave pública/publishable no cliente. `service_role` e chaves de IA jamais no frontend/repositório.
- Antes de produção: validar migration num Supabase novo, rodar testes RLS em duas Casas, testes de concorrência e políticas de Storage, limites para foto, backup e exclusão de dados.
- Tratar custos de IA como opcionais, com confirmação humana e limite de gastos.

## Entrega incremental
1. **Fundação (este PR)**: contrato de produto e migration de dados / RLS; sem mudança na experiência do gerador.
2. **Autenticação e Casa**: login, criação/convite, contexto de Casa, redirecionamento para painel.
3. **Estoque manual e locais**: CRUD, quantidades, buscas, tela mobile, baixa atômica e alertas.
4. **Fotografias**: upload privado, compressão, preview, foto de produto e galeria.
5. **Compras compartilhadas**: lista, check, inclusão por estoque baixo e fechamento de compra.
6. **Financeiro**: lançamentos e painel de gastos, filtros por mês e categoria.
7. **Assistência por IA**: sugestões a partir de fotos e comprovantes, com revisão.
8. **Etiquetas integradas**: aproveitar o cadastro de produtos para preencher o gerador atual.

## Critérios de aceite para o primeiro MVP utilizável
- Dois usuários com contas próprias veem as mesmas mudanças na Casa.
- Nenhum outro usuário consegue consultar fotos, despesas ou itens.
- Pesquisar produto retorna foto, unidade, quantidade e local em até duas interações no celular.
- Ajustar estoque registra autor, motivo e data; quantidade nunca fica negativa.
- Lista de compras é compartilhada e não cria automaticamente estoque antes da confirmação.
- Gerador M&S segue funcionando e todos os testes de regressão continuam verdes.
