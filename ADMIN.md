# Painel do dono (painel-ebs-XXXXXXXX.html)

Com o painel o dono muda o site sem mexer em código: adiciona e tira produtos, troca preços e fotos, põe produto na Quinta da Oferta, edita categorias e marcas, banners, textos, horários, endereço, WhatsApp, cores e as imagens do site.

## Como funciona
O site é estático (sem servidor). O painel guarda as mudanças **no próprio repositório do GitHub** do site: ele envia as fotos e o arquivo `js/dados.js`, e o GitHub Pages atualiza o site em 1 a 2 minutos. O histórico de cada mudança fica no GitHub, então dá para voltar atrás.

## Configurar (uma vez só)
1. Crie uma conta grátis em github.com e um repositório (ex.: `ebsskateshop/site`). Envie para ele o conteúdo do `.zip` (index.html, painel-ebs-XXXXXXXX.html, css, js, images).
2. No repositório: **Settings → Pages → Deploy from a branch → main / (root)**. O site abre em `usuario.github.io/site`.
3. Crie o token: **GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
   - *Repository access*: **Only select repositories** e escolha só o repositório do site.
   - *Permissions → Contents*: **Read and write**.
   - Copie o token (aparece uma vez só).
4. Abra `usuario.github.io/site/painel-ebs-XXXXXXXX.html`, escreva `usuario/site`, cole o token e crie uma senha do painel (mínimo 10 caracteres). O token fica guardado neste aparelho, criptografado com essa senha.

## Uso no dia a dia
- **Produtos**: + Novo produto, escolha categoria e marca, preço (vazio = "consulte no WhatsApp"), foto, tamanhos, selo Novo, Quinta da Oferta. Produto sem foto não aparece no site.
- **Categorias e marcas**: renomear, trocar a capa, mudar a ordem, adicionar marcas. Categoria sem produto fica escondida.
- **Banners**, **Loja e textos**, **Imagens do site**: edite e use **Ver prévia** para conferir antes.
- **Publicar → Publicar agora**: envia tudo para o site.

## Cuidados
- Quem tem o token **e** a senha controla o site. Se perder o aparelho, apague o token em GitHub → Settings → Developer settings.
- As alterações ficam salvas no navegador até publicar. Fotos antigas trocadas continuam no repositório (ocupam espaço, mas não aparecem).
- Não editam pelo painel: o título e a descrição que aparecem no Google/WhatsApp (ficam no `index.html`).
- **Guarde o endereço do painel** (favoritos ou "Adicionar à tela inicial"). Ele não aparece no site nem no Google, e o nome do arquivo (o `painel-ebs-XXXXXXXX.html` do .zip) é de propósito difícil de adivinhar. Atenção: com repositório público, quem abrir a lista de arquivos no GitHub vê esse nome. O que protege o site é o token e a senha, não o nome.
- Para fazer backup, use **Publicar → Baixar dados.js**.
