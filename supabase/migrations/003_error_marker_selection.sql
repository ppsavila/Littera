-- Adiciona suporte a seleção de texto nos marcadores de erro
alter table error_markers
  add column if not exists x2 real,           -- normalized end x (para seleção retangular)
  add column if not exists y2 real,           -- normalized end y
  add column if not exists selected_text text; -- texto selecionado pelo professor
