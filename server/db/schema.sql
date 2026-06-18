-- ===================================================================
-- Synapse AI — Supabase schema for the AlphaRAG vector store
-- Run this ONCE in Supabase → SQL Editor → New query → Run.
-- ===================================================================

-- 1) Enable pgvector (the AI vector-math extension)
create extension if not exists vector;

-- 2) Table that holds news articles + their embeddings
--    768 dimensions = Google's text-embedding-004 model.
create table if not exists news_articles (
  id           bigserial primary key,
  title        text not null,
  link         text unique,
  source       text,
  snippet      text,
  published_at timestamptz,
  embedding    vector(768),
  created_at   timestamptz default now()
);

-- 3) Fast approximate nearest-neighbour index (cosine distance)
create index if not exists news_articles_embedding_idx
  on news_articles using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- 4) Allow the anon key to read/write (fine for a hackathon demo)
alter table news_articles enable row level security;
drop policy if exists "synapse demo access" on news_articles;
create policy "synapse demo access" on news_articles
  for all using (true) with check (true);

-- 5) Semantic-search function: returns the most similar articles to a query vector
create or replace function match_news(query_embedding vector(768), match_count int)
returns table (
  id bigint,
  title text,
  link text,
  source text,
  snippet text,
  published_at timestamptz,
  similarity float
)
language sql stable as $$
  select
    na.id, na.title, na.link, na.source, na.snippet, na.published_at,
    1 - (na.embedding <=> query_embedding) as similarity
  from news_articles na
  where na.embedding is not null
  order by na.embedding <=> query_embedding
  limit match_count;
$$;
