# Casa Nexo — primeira versão funcional (autenticação + estoque)

## Escopo deste PR

Com um projeto Supabase conectado, disponibiliza:
- cadastro e login por e-mail e senha (a confirmação de e-mail depende da configuração no Supabase Auth);
- criação de Casa e convite de uso único, válido por 48 horas;
- uso em dois celulares/contas independentes, com dados de uma Casa;
- armários, cômodos, gavetas, prateleiras, geladeira, freezer e locais aninhados;
- produtos com nome, marca, embalagem, categoria, quantidade, estoque mínimo, validade e fotografia;
- aumento e baixa da quantidade com histórico de movimentos no banco;
- pesquisa por produtos, filtro de reposição e painel de produtos acabando/validade;
- armazenamento privado de fotos e links assinados temporários;
- atualização ao retomar o app e a cada ~20 segundos.
- roteamento anterior de etiquetas preservado se o Supabase **não** estiver configurado.

**Não implementa ainda** lista de compras, análise automática de fotos por IA, leitura de comprovantes, financeiro, faturas, controle de parcelamentos, atualização de múltiplos lotes na interface, redução do tamanho das fotos ou PWA/offline. Esses módulos continuam no plano `docs/CASA_NEXO_PLAN.md`.

## Ambiente de desenvolvimento conectado — 07/11/2026

- Projeto Supabase dedicado: `casa-nexo` (ref pública `yjvtihujlzydefsorxrn`, região `sa-east-1`).
- Migrations `shared_house_foundation` e `couple_finance`: aplicadas no novo projeto com sucesso.
- Netlify site `etiquetasms`: configuradas as variáveis públicas `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` em **All scopes / All deploy contexts** (valores omitidos deste repositório).
- Este commit dispara nova prévia do PR #4 para incorporar as variáveis no build.
- Pendente: testar login e confirmação de e-mail, dois moradores reais, convites, leitura/escrita, armazenamento de fotos, policies de acesso entre Casas e fluxos de erro. Não afirmar que estão testados.
- Auditoria Supabase acusou funções `SECURITY DEFINER` acessíveis a authenticated (convite e movimentação) e ausência intencional de policies diretas em `house_invites`; revisar permissões/risco antes de produção, além de índices para desempenho.

## Configuração necessária para testar

1. Crie um projeto Supabase dedicado ao Casa Nexo. Evite usar banco de outros projetos.
2. No SQL Editor ou via Supabase CLI, aplique **na ordem**:
   - `supabase/migrations/202611070001_shared_house_foundation.sql`
   - `supabase/migrations/202611070002_couple_finance.sql`
   Aplique primeiro em ambiente de desenvolvimento e revise as policies, triggers e as tabelas de Storage.
3. No Supabase Authentication habilite **Email/Password** e configure **Site URL** e **Redirect URLs** apontando ao domínio do site. Configure SMTP para confirmação de cadastro se exigir verificação por e-mail. Verifique limites de e-mail e políticas contra cadastro indevido.
4. Copie `.env.example` para `.env.local` e substitua somente `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` (ou `VITE_SUPABASE_ANON_KEY`). No Netlify configure as mesmas variáveis em **Environment variables** e acione novo deploy.
5. Execute:
   ```bash
   npm ci
   npm run lint
   npm run test
   npm run build
   npm run dev
   ```
6. Crie a conta do primeiro morador, a Casa e alguns locais. Em **Configurações**, gere um código e compartilhe com a noiva de forma privada. Ela cria a conta dela e usa “Entrar com convite”.
7. Cadastre um produto com foto em um celular; verifique no outro celular após atualização, teste quantidade +1/-1, produto acabando, validade e foto.
8. Verifique que contas de outra Casa **não** veem produtos, objetos de Storage ou despesas dos demais; teste alteração indevida de `house_id`, `product_id`, `location_id` nas chamadas. A segurança depende de RLS, não de filtro no React.

## Limites e cuidados

- URLs de fotos são assinadas por 10 minutos; não são URLs públicas permanentes. Fotos devem ser pessoais/da residência e não devem ser adicionadas ao Git.
- Chaves Vite são visíveis a todos que visitam o site. **Somente use chave publicável/anon com RLS ativo**. Nunca use `service_role` ou segredo de IA no navegador.
- O cliente utiliza a API REST do Supabase sem dependência nova de npm; a sessão do navegador fica em `localStorage`. Recomenda-se revisar ameaças de XSS, política de conteúdo (CSP) e logout em dispositivos compartilhados antes de produção.
- Quantidades do formulário são contadas em *embalagens/unidades*, não gramas ou mililitros. Ajuste fino de unidades e lotes virá depois.
- Fotos: até 8 MB por arquivo. O upload individual usa o formato de origem; compressão e detecção automática por foto estão no backlog.
- Se um produto for criado, mas a foto falhar, o cadastro continua salvo e pode receber foto depois. Se ocorrer erro na criação do lote, pode ser necessária correção de dados via admin Supabase.
- O MVP usa polling de ~20 s em vez de Supabase Realtime. A lista/estoque é compartilhada, mas mudanças não necessariamente aparecem instantaneamente.
- Este PR não faz execução de migration nem publica no Netlify. É necessário verificar o ambiente e aprovar a mudança.

## Critérios de aceite sugeridos
- [ ] Login, criação e entrada via convite funcionam com contas diferentes.
- [ ] Não há acesso entre Casas sem associação explícita.
- [ ] Um produto com foto aparece nos dois celulares.
- [ ] Busca, filtro, validade e localização corretos.
- [ ] Inventário não permite estoque negativo mesmo com requisições concorrentes.
- [ ] Arquivos privados não são acessíveis sem autorização.
- [ ] Todos os testes anteriores do gerador de etiquetas continuam passando.
