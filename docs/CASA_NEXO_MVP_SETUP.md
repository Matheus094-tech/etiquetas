## Ativação de moradores — primeira utilização Neon (08/11/2026)

A branch do PR #6 agora tem uma rota pública `/ativar` para que Matheus e Stephany **escolham a própria senha sem enviá-la pelo chat**.

- O administrador gera dois códigos aleatórios de uso único e insere **somente SHA-256** no banco Neon, em `private.household_activation`. Os códigos brutos **nunca são commitados** nem armazenados no frontend.
- O morador seleciona o nome, digita o código, escolhe e confirma senha de pelo menos 12 caracteres.
- O navegador deriva um e-mail técnico não adivinhável a partir do SHA-256 do código e registra a conta no **Neon Auth oficial**.
- O primeiro login gera um JWT; somente então o banco confere código, usuário autenticado e identificador técnico, vincula a conta à Casa e cria seu livro financeiro pessoal.
- Os quatro usuários legados de testes ficam com `house_members.active=false` (migration 004), preservando os registros mas revogando acesso à Casa. As novas contas entram com `active=true`.
- Somente o alias técnico é guardado no localStorage para o login cotidiano; **senha e código nunca são guardados lá**.
- O usuário entra como `matheus` ou `stephany`. Em outro navegador/dispositivo, pode informar o código original na área recolhível “Primeiro login neste dispositivo?” até cadastrarmos os aliases definitivos no frontend. Isso não reativa nem reutiliza o código; apenas deriva localmente o alias da identidade já existente.
- O cadastro de novas contas do Neon Auth precisa ficar **temporariamente habilitado** para a ativação, e deve voltar a **desabilitado** imediatamente após ambos concluírem (ou ao término da janela). A RLS impede acesso à Casa para inscrições não vinculadas, mas habilitar cadastro público aumenta a superfície de abuso — não deixar permanentemente ligado.
- Os tokens expiram no Neon em **10/11/2026 às 14:04 (America/Sao_Paulo)**. Após expiração será necessária renovação administrativa.
- Não usar `Admin123` ou qualquer senha compartilhada para dados reais.
- **Pendente:** homologar registros reais de ambos, senha + JWT, função de fotos e RLS; NÃO fazer merge antes desses testes.

Arquivos: `neon/migrations/003_household_activation.sql`, `004_disable_legacy_memberships.sql`, `src/pages/ActivatePage.tsx`.

## Migração Neon — PR #6 (08/11/2026)

O frontend do PR #6 foi migrado para Neon Managed Better Auth e Neon Data API:
- Cliente `@neon/neon-js` com sessão restaurada no React, autenticação por usuário + senha (mapeado para identidade técnica) e Bearer JWT.
- API PostgreSQL Neon por HTTPS; `VITE_NEON_URL` está em `.env.production` porque é **endpoint público sem segredo**. Nenhuma connection string PostgreSQL ou service key foi adicionada ao GitHub.
- As tabelas e RLS foram aplicadas no projeto Neon `dawn-hill-01046642`; banco `casa_nexo`.
- Upload/leitura de fotos por **Netlify Functions + Netlify Blobs**, com autorização por JWT e consulta de produto via Neon Data API sujeita à RLS; limite 8 MB, JPEG/PNG/WebP e objetos privados.
- As rotas originais de etiqueta foram preservadas, enquanto a integração Supabase antiga não é mais usada na branch.
- Página pública temporária de provisionamento e workflows de instalação foram removidos após testes; não entram no PR final.

**Bloqueios antes do merge**:
- [ ] Duas identidades Neon criadas pela administração não possuem senha de login. O fluxo de criação administrativa não permitiu definir senha; as senhas do Supabase antigo não podem ser migradas. É preciso provisionar os dois usuários **via fluxo suportado pelo Neon Auth**, mantendo a Casa e os livros vinculados aos novos UUIDs, e testar login real.
- [ ] Testar upload/consulta de foto end-to-end no deploy preview com JWT válido, incluindo recusa a usuário não membro.
- [ ] Testar RLS completo com JWT real na Neon Data API, inclusive dados financeiros pessoais.
- [ ] Validar ciclo de sessão, logout e recuperação segura de credenciais sem e-mail real.
- [ ] Conferir implantações de Netlify Functions e quotas de Netlify Blobs.
- [ ] Garantir CI e deploy preview verdes no commit final.

**Não realizar merge** enquanto login com senha e regras de acesso não forem homologados. Este PR não contém nenhuma alteração direta na `main`.

# Casa Nexo — primeira versão funcional (autenticação + estoque)

## Mudança de infraestrutura — 08/11/2026

**Decisão:** o Casa Nexo será migrado para um backend separado **fora do Supabase**, para reservar os dois projetos ativos gratuitos do Supabase para `confeitium` e `apego-croche`.

- Supabase `casa-nexo` (ref `yjvtihujlzydefsorxrn`): solicitação de **pausa** enviada e aceita. O projeto é preservado como backup; não foi excluído. A API ficará indisponível enquanto pausado.
- Supabase `confeitium`: solicitação de **restauração** enviada e aceita.
- Estado do banco antigo antes da pausa: 2 usuários Auth, 1 Casa, 2 moradores, 3 livros financeiros (compartilhado + pessoal de cada um); **0 produtos, 0 fotos, 0 compras, 0 lançamentos financeiros**.
- **Novo backend proposto:** Neon Free (PostgreSQL + Managed Better Auth + Object Storage + Functions); conectar o aplicativo Neon antes de executar migração.
- **Não reutilizar** as credenciais e a API do Supabase na nova hospedagem. Usuários precisarão ser provisionados no novo provedor, com novos fluxos de autenticação e senhas definidas por canal seguro.
- **Não dar merge no PR #4** enquanto o cliente depender da API `yjvtihujlzydefsorxrn.supabase.co`. A prévia atual do PR está intencionalmente indisponível para login.
- Refatorar camada `src/lib/casaApi.ts`, trocar Auth, armazenamento de fotos e autorização equivalente a RLS antes de liberar dados privados ou financeiros.
- Após migração, remover as variáveis Netlify `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` (em todos os contextos) e configurar apenas as variáveis públicas exigidas pela nova integração. **Não fazer essa mudança até o Neon estar operacional.**
- Manter o gerador de etiquetas M&S original preservado durante a transição.

## Neon — migração do banco concluída parcialmente (08/11/2026)

- Projeto Neon: `casa-nexo` (`dawn-hill-01046642`, branch `main`, PostgreSQL 17, AWS São Paulo).
- Backend Neon Auth (Managed Better Auth): provisionado; cadastro público desabilitado; verificação de e-mail desnecessária no ambiente atual.
- Neon Data API: ativada para o banco `casa_nexo` usando Neon Auth. A API usa JWT + RLS; **não** colocar credenciais PostgreSQL no navegador.
- Migrations portadas para `neon/migrations/001_shared_house.sql` e `002_couple_finance.sql`, **executadas com sucesso** no banco Neon: 21 tabelas e 73 políticas RLS.
- A adaptação usa `neon_auth."user"(id)` no lugar de `auth.users(id)`; os IDs de usuários **mudaram** em relação ao antigo Supabase.
- Duas identidades técnicas criadas pelo Neon Admin Auth: `matheus` e `stephany`; `Nossa Casa` e os três livros financeiros preparados. **Não foi validado login com senha no Neon.** A ação administrativa de criação de usuário não permite configurar uma senha diretamente, e as identidades aparecem sem verificação de e-mail; não presumir que podem efetuar login.
- Os esquemas de armazenamento `storage.buckets` / `storage.objects` do Supabase **não se aplicam ao Neon**. Neon Object Storage não está disponível na região `aws-sa-east-1`. Fotos devem usar um provedor separado com URLs assinadas e autorização por morador, antes da liberação em produção.
- Frontend **ainda aponta ao Supabase pausado**, portanto PR #4 **não está pronto para merge**. A autenticação e o cliente REST de `src/lib/casaApi.ts` precisam ser migrados para Neon SDK, com ajustes para armazenamento.
- Vaga de Supabase liberada: `confeitium` e `apego-croche` confirmados `ACTIVE_HEALTHY`; Supabase `casa-nexo` confirmado `INACTIVE`, sem exclusão.
- Priorizar: (1) credenciais gerenciadas no Neon com um fluxo de recuperação real, (2) auth + JWT + RLS no frontend, (3) storage privado compatível, (4) testes ponta a ponta e configurações da Netlify.

## Escopo deste PR

Com um projeto Supabase conectado, disponibiliza:
- acesso reservado por nomes de usuário `matheus` e `stephany` com senha pelo Supabase Auth (contas criadas no painel administrativo, sem cadastro público no aplicativo);
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

## Provisionamento realizado no Supabase — 07/11/2026

- Criadas e confirmadas as contas técnicas `matheus` e `stephany` pelo painel administrativo Auth, **sem senhas no repositório**.
- O cadastro público e os logins anônimos foram desativados; autenticação Email/Password continua habilitada internamente.
- Criada `Nossa Casa` com Matheus como proprietário e Stephany como moradora, ambos já associados. **Não precisam usar convites**.
- Preparados três livros financeiros: `Nossa Casa` (compartilhado), `Minhas Finanças — Matheus` e `Minhas Finanças — Stephany` (privados). A interface financeira ainda não está implementada.
- Testes de isolamento com papel `authenticated` e UID de cada usuário: Matheus e Stephany enxergam 1 Casa, 2 membros, 1 livro compartilhado e somente o próprio livro pessoal; identidade fora da Casa não enxerga registros. Os testes são SQL com RLS; **login real via interface ainda precisa de homologação**.
- Senhas iniciais são temporárias e devem ser substituídas por cada morador em **Configurações → Alterar minha senha**. A atualização usa Supabase Auth, valida a senha atual e não grava senhas em localStorage nem nos repositórios.
- Como não existem caixas postais reais, perda de senha requer redefinição administrativa. Antes de guardar dados financeiros sensíveis, definir processo de recuperação e reavaliar o risco de identidades sem e-mail verificável.

## Acesso sem e-mail — Matheus e Stephany (solicitado em 07/11/2026)

- A interface do preview aceita apenas **usuário e senha**; os logins são `matheus` e `stephany`. Não há campo e-mail nem opção de cadastro público.
- O Supabase Auth continua gerenciando o hash das senhas, sessões e JWT. Para login de senha, o Supabase precisa internamente de um e-mail ou telefone. Por isso mapeamos cada usuário para um endereço técnico reservado do tipo `usuario@users.casa-nexo.example`. Não é caixa postal, não é para receber mensagens e não deve aparecer na interface.
- **Provisionamento obrigatório no painel administrativo do Supabase Auth:** criar exatamente as duas contas com os identificadores técnicos definidos em `src/lib/householdUsers.ts`, senhas fortes exclusivas e e-mail marcado como confirmado pelo administrador. **Nunca inserir diretamente em `auth.users` por SQL, nunca salvar senhas no código ou no repositório.**
- Desativar cadastros públicos no projeto Supabase depois de criar as duas contas; manter login por e-mail/senha do Auth ativo. Se uma das contas já existir, não recriar nem alterar senhas sem necessidade.
- Como os endereços são fictícios, **não há recuperação de senha por e-mail**. Uma redefinição precisará ser feita pelo administrador do projeto até haver e-mail real/verificado ou outro método de recuperação.
- Ambos precisam pertencer à mesma Casa; o primeiro morador cria a Casa e gera um convite. O segundo entra com seu login e o código. Não compartilham senha.
- Os identificadores técnicos não são fator de autorização: permissões vêm do ID autenticado no Supabase e de RLS de membership da Casa.
- Antes do merge, testar logins de ambos, impedir acesso indevido e verificar que o usuário sem sessão não lê estoque/fotos.

## Configuração necessária para testar

1. Crie um projeto Supabase dedicado ao Casa Nexo. Evite usar banco de outros projetos.
2. No SQL Editor ou via Supabase CLI, aplique **na ordem**:
   - `supabase/migrations/202611070001_shared_house_foundation.sql`
   - `supabase/migrations/202611070002_couple_finance.sql`
   Aplique primeiro em ambiente de desenvolvimento e revise as policies, triggers e as tabelas de Storage.
3. No Supabase Authentication habilite **Email/Password**, crie as duas contas com **Auto Confirm** e configure **Site URL** e **Redirect URLs** apontando ao domínio do site. Não será enviado e-mail de cadastro para os endereços técnicos; desative cadastros públicos após o provisionamento. Verifique limites de e-mail e políticas contra cadastro indevido.
4. Copie `.env.example` para `.env.local` e substitua somente `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` (ou `VITE_SUPABASE_ANON_KEY`). No Netlify configure as mesmas variáveis em **Environment variables** e acione novo deploy.
5. Execute:
   ```bash
   npm ci
   npm run lint
   npm run test
   npm run build
   npm run dev
   ```
6. Faça login como `matheus`, crie uma Casa e locais. Em **Configurações**, gere um código. Entre como `stephany` usando sua própria senha e use “Entrar com convite”.
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
