# Missão visual — Gemini Frontend

Você receberá um aplicativo desktop Tauri já funcional em `C:\PROGRAMACAO\focus-cockpit`.
Sua missão é construir somente a experiência visual React das seis telas e conectá-la aos contratos já existentes. Não reescreva o produto, o banco, o Rust ou os repositórios.

## 1. Ponto de partida e segurança

1. Confirme que o repositório é `C:\PROGRAMACAO\focus-cockpit`.
2. Confirme que o commit `6c7113a` está no histórico.
3. Parta da branch `codex/core-domain-v1` e crie `gemini/frontend-v1`.
4. Antes de editar, execute `git status --short`. Não descarte alterações que já existam.
5. Não faça merge em `main`, não publique release e não altere a visibilidade do GitHub.

Arquivos proibidos para edição:

- `src-tauri/**`
- `src/database/**`
- `src/**/**Repository.ts`
- `src/**/**Schema.ts`
- `src/**/**Hooks.ts`
- `src/platform/**`
- `src/app/queryKeys.ts`
- `pnpm-lock.yaml`, `pnpm-workspace.yaml` e `package.json`

Se um contrato parecer insuficiente, pare e descreva exatamente o que falta. Não crie um segundo banco, dados mockados, localStorage para dados de negócio, APIs paralelas ou comandos nativos genéricos.

## 2. Liberdade visual com limites de produto

Você tem liberdade para definir hierarquia, espaçamento, microinterações e composição dos componentes. Preserve estas decisões já aprovadas:

- Aplicativo desktop pessoal, simples e focado; não é SaaS nem super app.
- Tema totalmente escuro, sem páginas ou diálogos claros.
- Sem sidebar.
- Barra superior discreta.
- Navegação fixa no rodapé, inspirada nas abas do Excel.
- Abas: `Foco | Plano | Projetos | Cursos | Diplomas | Arquivos`.
- A aba ativa tem uma linha superior ciano; nunca fundo branco.
- Lane A é ciano e Lane B é âmbar.
- Ciano e âmbar são acentos, não grandes fundos sólidos.
- Nada de gráficos ou métricas decorativas.
- Nada de agente, Jarvis, chat, calendário complexo, kanban ou botão `+` sem função.
- O texto visível deve estar em português do Brasil.

Direção visual: painel escuro elegante, técnico e sóbrio; bordas finas azul-acinzentadas, superfícies azul-marinho quase pretas, tipografia clara, alta legibilidade e densidade de informação semelhante a uma planilha evoluída.

Use os tokens de `src/design-system/tokens.css` como ponto de partida. Pode ampliá-los sem quebrar os nomes existentes. Use Tailwind e Lucide já instalados; não adicione dependências.

## 3. Arquivos que você pode criar ou editar

- `src/app/routes.tsx`
- `src/shell/**`
- `src/design-system/tokens.css`
- Componentes e telas `.tsx`/`.css` dentro de:
  - `src/focus/`
  - `src/plan/`
  - `src/projects/`
  - `src/courses/`
  - `src/credentials/`
  - `src/shortcuts/`
- Testes visuais e de interação `*.test.tsx` dentro dessas áreas.

Não crie pastas genéricas `components`, `utils`, `helpers` ou `common`. Um componente compartilhado só deve ir para `src/design-system/` quando possuir pelo menos dois usos reais.

## 4. Contratos prontos — use-os, não os replique

### Foco

De `src/focus/focusHooks.ts`:

- `useFocusSlots()`
- `useSetFocusProject()`
- `useWeeklyPriorities()`
- `useSaveWeeklyPriority()`
- `useToggleWeeklyPriority()`
- `useClearWeeklyPriority()`

De `src/projects/projectHooks.ts`:

- `useProjects(filters)`

De `src/shortcuts/shortcutHooks.ts`:

- `useFavoriteShortcuts()`

### Projetos

De `src/projects/projectHooks.ts`:

- `useProjects(filters)`
- `useCreateProject()`
- `useUpdateProject()`
- `useArchiveProject()`
- `useRestoreProject()`

### Plano

De `src/plan/planHooks.ts`:

- `usePlanItems(firstYear?, lastYear?)`
- `usePlanNotes(includeArchived?)`
- mutations de criar, editar e excluir item
- mutations de criar, editar e arquivar anotação

Use `periodIndex()` de `src/plan/planSchema.ts` para posicionar os blocos na grade.

### Cursos

De `src/courses/courseHooks.ts`:

- `useCourses(filters)`
- mutations de criar, editar, arquivar e restaurar curso

### Diplomas

De `src/credentials/credentialHooks.ts`:

- `useCredentials(filters)`
- `useImportCredential()`
- `useUpdateCredentialMetadata()`

De `src/platform/credentials.ts`:

- `openCredential(storedPath)`
- `readCredentialBytes(storedPath)`
- `exportCredential(storedPath, destinationPath)`

Use o diálogo nativo de `@tauri-apps/plugin-dialog` para selecionar/importar/exportar. Aceite somente PDF, PNG, JPG/JPEG e WebP. A validação definitiva já ocorre no Rust.

### Arquivos

De `src/shortcuts/shortcutHooks.ts`:

- `useShortcuts(filters)`
- mutations de criar, editar, arquivar e restaurar atalho

De `src/platform/nativeFiles.ts`:

- `inspectSavedTarget(path, targetType)`
- `openSavedTarget(path, targetType)`

Use o diálogo nativo para selecionar arquivo/pasta e para relocalizar. Copiar caminho pode usar `navigator.clipboard.writeText`. Nunca mova, renomeie, exclua ou escaneie arquivos.

### Backup

De `src/platform/backups.ts`:

- `createBackup(destinationPath)`
- `inspectBackup(backupPath)`
- `restoreBackupConfirmed(backupPath)`

Coloque um acesso discreto de `Backup e restauração` no cabeçalho, preferencialmente em um menu de configurações. Antes de restaurar, mostre o resumo retornado por `inspectBackup`, peça confirmação explícita e só então chame `restoreBackupConfirmed`. Após sucesso, recarregue a janela para limpar o cache visual.

## 5. Telas obrigatórias

### Foco — tela inicial

- Cabeçalho visual `PAINEL PESSOAL | FOCUS COCKPIT`.
- Título `Seu foco agora`.
- Dois cartões simétricos: Lane A à esquerda, Lane B à direita.
- Cada cartão mostra projeto, área, próxima ação, último avanço e botões seguros para abrir a pasta quando houver caminho.
- `Editar foco` abre um diálogo que permite escolher exatamente um projeto não arquivado da Lane correspondente ou deixar o slot vazio.
- Bloco `Esta semana` com exatamente três posições editáveis, checkbox de concluído e vínculo opcional com projeto.
- Bloco `Atalhos rápidos` com no máximo três favoritos e estado `Não encontrado` quando necessário.

### Plano — planilha evoluída

- Grade horizontal por ano, subdividida em `1º sem.` e `2º sem.`.
- Categorias fixas na primeira coluna: Idiomas, Cursos, Especializações, Certificados, Projetos e Habilidades.
- Blocos ocupam do início ao fim e mantêm cor/status legíveis no tema escuro.
- Rolagem horizontal; primeira coluna e cabeçalho fixos.
- Criar/editar/excluir por diálogo, sem drag-and-drop.
- Abaixo da grade: `Prioridades atuais`, `Cursos futuros` e `Projetos sugeridos`.

### Projetos

- Tabela escura com Nome, Lane, Área, Status, Prioridade, Próxima ação, Último avanço e ações.
- Busca e filtros por Lane/Status.
- Criar, editar, arquivar, restaurar, colocar em foco e abrir pasta.
- Confirmação antes de arquivar.

### Cursos

- Tabela escura com Instituição, Curso, Categoria, Status, Prioridade, Início, Conclusão e Diploma.
- Busca/filtros e CRUD completo sem inventário de materiais.
- Curso concluído pode receber diploma.
- Arquivar curso nunca apaga o diploma.

### Diplomas

- Galeria visual responsiva de cartões.
- Mostrar miniatura da própria imagem; para PDF, usar inicialmente um cartão elegante de PDF.
- Exibir título, instituição/emissor, tipo, ano e curso vinculado quando existir.
- Ações `Visualizar`, `Baixar` e `Editar dados`.
- Importar abre arquivo nativo e depois um diálogo de metadados.
- Revogar qualquer `URL.createObjectURL` criado para previews.

### Arquivos

- É um localizador manual, não um Explorer.
- Tabela com Nome, Tipo, Categoria, Caminho abreviado, Observação, Estado e ações.
- Categorias iniciais visíveis: Favoritos, Carreira e portfólio, Estudos, Projetos, Documentos e Pessoal.
- Busca/filtro, cadastrar, editar, arquivar, restaurar, abrir, copiar caminho, favoritar e relocalizar.
- Caminho inexistente mostra `Não encontrado` e não tenta abrir.

## 6. Componentes e estados mínimos

Crie apenas componentes necessários, com acessibilidade por teclado:

- Botões primário/secundário/perigo.
- Campo, select, textarea, checkbox.
- Modal com foco inicial, fechamento por Escape e rótulos acessíveis.
- Badge de Lane/status/prioridade.
- Estado de carregamento sem piscar a tela inteira.
- Estado vazio útil em todas as páginas.
- Mensagem de erro próxima da ação que falhou.
- Confirmação para ações destrutivas de registros.

Não use `alert()` como experiência principal. Não mostre stack traces. Preserve o estado dos filtros durante a navegação quando for simples fazê-lo.

## 7. Critérios de aceite

Antes de encerrar:

1. Todas as rotas funcionam sem recarregar a janela.
2. Nenhuma tela é placeholder.
3. Todos os dados vêm dos hooks/repositórios reais.
4. Não existe dado pessoal, token, caminho `C:\Users\...` ou segredo no código.
5. Não existe fundo claro, sidebar ou botão morto.
6. Os formulários exibem erros de validação compreensíveis.
7. Lint, testes e build passam:

```powershell
pnpm lint
pnpm test
pnpm build
```

8. Rode também, sem alterar o Rust:

```powershell
$env:PATH += ";$env:USERPROFILE\.cargo\bin;C:\Users\User\scoop\apps\mingw\current\bin"
Set-Location src-tauri
cargo fmt --check
cargo clippy --locked -- -D warnings
Set-Location migration-tests
cargo test --locked
```

9. Mostre no relatório final:
   - branch e commit;
   - arquivos criados/editados;
   - resultados exatos das validações;
   - screenshots das seis telas em 1280×800;
   - qualquer limitação real encontrada.

Não faça push antes da revisão do Codex. Ao terminar, deixe a branch e o commit locais prontos para auditoria.
