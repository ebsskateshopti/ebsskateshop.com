# EBS Skateshop — site da loja (versão de apresentação)

Site estático (HTML, CSS e JavaScript puros) da **EBS Skateshop** (@ebsskateshop), "seu skate com quem entende".
Catálogo por categorias, busca, página de produto, carrinho que monta o pedido e envia pelo WhatsApp, Quinta da Oferta e "Como nos encontrar".
Mesma arquitetura do site da INRUSH, com identidade própria: fundo grafite, texto branco, degradê rosa e amarelo da logo só em detalhes (divisórias, hover, ícone do carrinho) e as letras EBS da logo como marca d'água.

## Estrutura

```
index.html          página única (início, catálogo, produto, contato)
css/style.css       visual e tokens (:root)
js/app.js           lógica, categorias e dados da loja (STORE: WhatsApp, endereço, cidade)
js/dados.js         TODOS os dados editáveis (produtos, categorias, banners, textos, loja)
painel-ebs-XXXXXXXX.html          painel do dono (veja ADMIN.md)
images/logo.webp    logo (recorte do print do perfil; trocar pelo arquivo original)
images/ebs-letras.png  letras EBS da logo, usadas como máscara nos detalhes
images/favicon.png  ícone da aba
images/produtos/    fotos dos produtos
images/site/        fotos da loja (fachada)
```

## Ver no computador

Para ver as letras EBS de fundo, use o `index.html` de arquivo único ou um servidor local (abrir a versão em pastas com dois cliques bloqueia a máscara no Chrome). Rode `python3 -m http.server 8000` e acesse http://localhost:8000.
O `index.html` avulso entregue junto com o .zip é a versão em arquivo único (CSS, JS e imagens embutidos).

## Subir para o GitHub e publicar

1. Em github.com, clique em **New repository**, dê um nome (ex.: `site`) e crie. Pode ser público (o GitHub Pages grátis exige).
2. Na página do repositório: **Add file → Upload files**. Arraste **o conteúdo desta pasta** (arquivos e pastas, não o .zip) e clique em **Commit changes**. Se o GitHub reclamar do número de arquivos, envie em duas levas (primeiro `images`, depois o resto).
3. **Settings → Pages → Deploy from a branch → main / (root) → Save**. Em 1 a 2 minutos o site abre em `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`.
4. Para o dono editar o site sozinho, siga o `ADMIN.md` (token + painel).

Pelo terminal: `git init`, `git add .`, `git commit -m "site EBS"`, `git branch -M main`, `git remote add origin URL-DO-REPOSITORIO`, `git push -u origin main`.

## Como atualizar o site

Pelo painel: abra `painel-ebs-XXXXXXXX.html` e siga o `ADMIN.md`. O painel edita o `js/dados.js` e envia as fotos para o GitHub.
À mão: edite `js/dados.js` (mesmo formato). Produto sem foto fica escondido, e `promo: true` põe o produto na Quinta da Oferta.

## Pendências para confirmar com o dono

- **Catálogo**: nomes e preços vieram dos prints do catálogo do WhatsApp. Alguns nomes estavam cortados ou com erro de digitação (Roda Spitfire F4 101A, "Tênis Milk 101 A" que na foto é uma roda, "Nineclods", "Grizzy"): conferir um a um.
- Produtos sem preço no print aparecem como "Consulte o preço no WhatsApp" (Spitfire 101A, Trurium Jimmy, Milk 54mm, Dramd, Sense Titanium, kit ARS).
- O Kit This Way aparece no print com preço riscado (de R$ 279,99 por R$ 269,99). O site mostra só R$ 269,99.
- As fotos dos produtos são miniaturas dos prints (300px, baixa resolução). Substituir pelos originais em `images/produtos/` (mesmo nome de arquivo).
- Roupas e Parafusos e acessórios ainda não têm produto, então as categorias ficam escondidas.
- **Endereço**: tirado do link do Google Maps. Foto da fachada (`FOTOS.fachada`) e logo em alta resolução ainda faltam.
- Preço do skate montado HSC (R$ 349,99) e do kit ARS (R$ 249,99), vistos numa arte antiga, não foram usados: confirmar.
- Não há parcelamento nem "sem juros" afirmado em lugar nenhum.
