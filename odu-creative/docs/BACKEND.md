# Backend opcional (C# / ASP.NET Core) — especificação

> **Status: não implementado.** A plataforma atual funciona 100% no navegador e não armazena
> dados de alunos em servidor. Este documento define o contrato para quando a escola precisar de
> contas, turmas, relatórios centralizados ou integração com LMS.

## Quando é necessário

- Professores acompanharem várias turmas sem receber arquivos JSON manualmente.
- Autenticação de alunos e permissões (aluno / professor / coordenação).
- Hospedar unidades e áudios centralmente e gerar apostilas no servidor.
- Integração com LMS (LTI 1.3 ou xAPI).

## API REST proposta (`/api/v1`)

| Método | Rota | Papel | Descrição |
|---|---|---|---|
| POST | `/auth/login` | todos | OIDC/OAuth (Google Workspace for Education, Microsoft 365) → JWT de curta duração. |
| GET | `/units` | todos | Lista de unidades (mesmo formato de `units/index.json`). |
| GET | `/units/{id}` | todos | `unit.json`. |
| PUT | `/units/{id}` | professor | Salva unidade (validação com as mesmas regras de `validateQuestion`). |
| POST | `/units/{id}/audio/{trackId}` | professor | Upload de áudio (multipart) → URL em armazenamento de objetos. |
| POST | `/attempts` | aluno | Lote de tentativas `{ qid, skills[], correct, firstTry, module, ts }` — mesmo formato de `progress.attempts`. |
| GET | `/classes/{id}/report?unit=` | professor | Agregado por aluno/competência (equivalente à aba Resultados). |
| GET | `/units/{id}/docx?version=student\|teacher` | professor | Gera DOCX (DocumentFormat.OpenXml ou porta do `docx-builder.js` via Node). |

No front-end, a troca é localizada: `store.logAttempt` passa a também enfileirar o envio, e
`unit-loader.js` passa a buscar de `/api/v1/units`.

## Modelo de dados mínimo

`User(id, role, displayName, schoolId)` · `Class(id, name, teacherId)` · `Enrollment(userId, classId)` ·
`Unit(id, json, version)` · `Attempt(id, userId, unitId, qid, skills, correct, firstTry, module, ts)`.

## LGPD — requisitos para a implementação

- **Base legal**: execução de contrato/serviço educacional com a escola (controladora); a ODU CREATIVE
  atua como operadora. Alunos de 13 anos: tratamento no melhor interesse do adolescente (art. 14).
- **Minimização**: não coletar CPF, endereço ou foto. Gravações de voz **não** são enviadas ao servidor.
- **Transparência**: aviso de privacidade em linguagem acessível ao adolescente e aos responsáveis.
- **Segurança**: HTTPS obrigatório, JWT com expiração curta, senhas apenas via provedor OIDC,
  criptografia em repouso, logs de acesso a relatórios, princípio do menor privilégio por papel.
- **Direitos do titular**: exportação e exclusão de dados por aluno; retenção definida pela escola
  (sugestão: fim do ano letivo + 6 meses).
- **Registro das operações** (art. 37) e relatório de impacto quando aplicável.
