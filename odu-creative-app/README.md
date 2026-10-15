# Odu Creative Jogos

Hub de jogos da Odu Creative. Todos os jogos abrem **na mesma janela do app**: a navegação usa rotas internas (`#jogo-ayo`, `#jogo-oxumare`, `#jogo-memoria`), sem nenhum `target="_blank"` nem `window.open`.

- `site/index.html`: versão pronta para hospedar (Netlify, Vercel, GitHub Pages ou a pasta `public/` de um projeto Lovable).
- `index.html`: o mesmo app sem o esqueleto `<html>/<head>`, usado como Artifact.

## Jogos incluídos

| Jogo | Categoria | Controles |
| --- | --- | --- |
| Ayò | Estratégia | Toque numa casa da fileira de baixo. Captura 2 ou 3 sementes no campo adversário; vence quem passar de 24. |
| Oxumarê | Ação | Setas/WASD, deslizar o dedo ou o direcional na tela; espaço pausa. |
| Memória dos Odù | Raciocínio | Encontre os 8 pares de Odù (marcas e nomes dos 16 principais). |

Recursos: busca, filtro por categoria, favoritos, "Continue jogando", recordes salvos no aparelho (`localStorage`), tela cheia, tema claro/escuro automático, layout responsivo.

## Jogos hospedados em oducreative.com

Adicione uma entrada com `url` no array `GAMES`:

```js
{ id: "meu-jogo", title: "Meu Jogo", cat: "Online", odu: 4, time: "5 min",
  desc: "Descrição curta.", url: "https://oducreative.com/jogos/meu-jogo/" }
```

O jogo abre num iframe dentro do app. Para isso funcionar, o servidor do oducreative.com precisa **permitir ser incorporado**:

```
Content-Security-Policy: frame-ancestors 'self' https://SEU-APP.lovable.app
```

e não enviar `X-Frame-Options: DENY/SAMEORIGIN`. Se o carregamento falhar em 6 s, o app mostra um aviso com "Tentar de novo" e "Abrir em nova aba".
