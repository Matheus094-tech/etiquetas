# Casa Nexo — plano de evolução do Etiquetas M&S

## Objetivo
Aplicativo privado e compartilhado entre dois moradores para responder, rapidamente:
- O que já temos em casa?
- Onde está guardado?
- O que realmente precisa ser comprado?
- Quanto gastamos e com o quê?
- Quanto cada um deve pagar, o que está vencendo e quanto sobra do orçamento?
- Como administrar as finanças individuais sem expor dados privados automaticamente?

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
- `/financas` — painel financeiro com seletor de visão (Casa / Pessoal), sem somar ou revelar finanças privadas dos dois por padrão.
- `/financas/casa` — despesas compartilhadas, quem pagou, rateios, acertos, contas a pagar e orçamento familiar.
- `/financas/pessoal` — receitas, despesas, contas, metas e lançamentos visíveis somente ao próprio usuário.
- `/financas/cartoes` — cartões pessoais ou compartilhados, faturas, datas de fechamento/vencimento e parcelamentos.
- `/financas/planejamento` — limites por categoria, compromissos futuros e fluxo de caixa projetado.
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
- O financeiro escolhido é **Opção B (gestão financeira completa do casal)**, com contas pessoais privadas e despesas da Casa compartilhadas; não misturar automaticamente movimentações de estoque com despesas.
- Uma compra confirmada poderá gerar lançamento financeiro **e** entrada de estoque de forma atômica em uma etapa futura. Nunca lançar despesa duplicada ao pagar a fatura do cartão.
- Despesas domésticas registram quem pagou e como foram rateadas. Os acertos entre pessoas não são novos gastos da Casa.
- Parcelamentos preservam a compra original e as parcelas; totais à vista vs. previsão mensal têm métricas distintas, para não duplicar o valor da compra.
- Integração bancária, importação de extratos, notificações de vencimento e conciliação ficam para etapas posteriores, sem bloquear cadastro manual.

## Finanças do casal — decisão aprovada (opção B)

### Três visões e privacidade
1. **Nossa Casa** (compartilhada): contas da residência, alimentação, mercado, internet, energia, lazer comum, compras do lar, despesas fixas e variáveis. Ambos podem ver lançamentos, valores, rateios, vencimentos e quem pagou.
2. **Minhas Finanças** (privada): salário, receitas, gastos individuais, bancos, cartões, compromissos, financiamentos/consignados, dívidas e metas. **Somente o titular** consegue ler e alterar seus dados, mesmo que o outro membro seja o proprietário da Casa.
3. **Planejamento do casal**: metas e orçamento do núcleo familiar usando recursos explicitamente compartilhados; o aplicativo **não revela automaticamente rendas, saldos ou despesas privadas** do parceiro. Divulgar valores pessoais individualmente exigirá um recurso de consentimento e controle de acesso a desenvolver mais adiante.

### Funcionalidades financeiras priorizadas
- Contas manuais (banco, carteira, investimentos e cartões), saldos de referência e identificação de quem é titular.
- Receitas e despesas: valor, data, competência, vencimento, categoria, descrição, pago/pendente, comprovante privado e origem.
- Cartões de crédito: fechamento, vencimento e previsão das parcelas; pagamento da fatura é transferência/quitação, nunca nova despesa.
- Despesas compartilhadas: pagador, participantes, percentuais ou valores de rateio, saldo a acertar e registro de transferências entre moradores.
- Recorrências: água, energia, internet, condomínio, assinaturas e demais contas fixas.
- Planejamento: orçamento mensal por categoria, projeção de contas, receitas e parcelas, alertas de vencimento configuráveis.
- Histórico: preço por produto/mercado, gastos por mês/categoria/pagador e compras de supermercado alimentando estoque.
- Importação de comprovantes/fotos com sugestões assistidas por IA e revisão humana.
- Sem sincronização bancária automática no MVP. Nenhum dado sensível ou credencial de banco no GitHub.

### Modelo e regras de acesso
- A migração `202611070002_couple_finance.sql` introduz **livros financeiros (ledgers)** associados a uma Casa:
  - `shared`: todos os moradores podem consultar e registrar despesas compartilhadas.
  - `personal`: somente o morador proprietário pode consultar e registrar dados, inclusive perante o administrador da Casa.
- Cada morador tem seu próprio livro pessoal; a Casa tem um único livro compartilhado.
- Registros financeiros dependem do livro a que pertencem, protegidos por RLS. Não é permitido trocar o livro de um lançamento depois do cadastro, evitando mover dados compartilhados para uma área privada sem controle.
- Divisões de despesa e acertos somente existem no livro compartilhado, vinculados a membros da mesma Casa.
- Atividades no financeiro são registradas com autor e data; alteração/exclusão deverá ter trilha de auditoria antes de uso real com pagamentos.
- A política de visibilidade acima é garantia no banco, **não apenas uma opção de interface**.
- Registro de compras já existente na fundação continua sendo um documento compartilhado da Casa; o fechamento financeiro completo exigirá função transacional de confirmação e vínculo único a um lançamento, em fase posterior.

### Exemplo prático
Uma compra de R$ 380,00 na farmácia/mercado pode ser marcada como **Casa** (compartilhada) ou **Pessoal** (privada). Uma compra da Casa, paga por um dos moradores e dividida 50/50, gera duas responsabilidades de R$ 190,00; isso não cria duas despesas de R$ 380,00. Em caso de parcelamento de 4× R$ 95,00, o orçamento mensal apresenta as parcelas sem somar novamente R$ 380,00 a cada mês.

## Arquitetura e segurança
- Frontend atual: React/TypeScript; backend recomendado: Supabase (Auth + PostgreSQL + Storage).
- Banco inicial: `supabase/migrations/202611070001_shared_house_foundation.sql` e `supabase/migrations/202611070002_couple_finance.sql` (propostas ainda **não aplicadas**).
- Testes adicionais: visibilidade de livros pessoais entre dois moradores, tentativa de acesso pelo proprietário da Casa, associação de registros entre Casas, rateio somente em livro compartilhado e vazamento por armazenamento de comprovantes.
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
6. **Financeiro Casa**: despesas compartilhadas, pagadores, divisão, contas recorrentes, acertos, orçamento por mês.
7. **Financeiro pessoal**: livros privados, contas, cartões, faturas, compras parceladas, metas e projeção de fluxo de caixa.
8. **Assistência por IA**: sugestões a partir de fotos e comprovantes, com revisão.
9. **Etiquetas integradas**: aproveitar o cadastro de produtos para preencher o gerador atual.
10. **Conciliação opcional**: importação de extratos e alertas configuráveis; integração bancária somente com autorização explícita.

## Critérios de aceite para o primeiro MVP utilizável
- Dois usuários com contas próprias veem as mesmas mudanças na Casa.
- Nenhum outro usuário consegue consultar fotos, despesas ou itens.
- Pesquisar produto retorna foto, unidade, quantidade e local em até duas interações no celular.
- Ajustar estoque registra autor, motivo e data; quantidade nunca fica negativa.
- Lista de compras é compartilhada e não cria automaticamente estoque antes da confirmação.
- Os moradores acessam despesas da Casa, mas não conseguem ler ou editar lançamentos pessoais um do outro.
- Divisão de despesa não aumenta indevidamente o gasto total; fatura de cartão não é contabilizada duas vezes.
- Gerador M&S segue funcionando e todos os testes de regressão continuam verdes.
