-- Neon Data API exige GRANT além de RLS. Executado no Neon casa_nexo em 2026-11-08.
-- Não dá privilégio a anonymous. Todas as 21 tabelas de public estão com RLS.
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
-- Convites são acessíveis exclusivamente pelas funções RPC com verificação interna.
REVOKE ALL ON public.house_invites FROM authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
