# joyceeeira

Site de resenhas literárias no formato de livro aberto. Cada folha mostra uma resenha. No celular, aparece uma folha por vez. Os visitantes podem folhear, consultar o índice e buscar livros pelo título ou pelo autor.

## Escrever uma resenha no VS Code

1. Copie `modelo-resenha.md` para a pasta `resenhas/`. Dê um nome como `a-hora-da-estrela.md`, com letras minúsculas e hífens.
2. Preencha `titulo`, `autor`, `genero`, `data` e `nota`. A nota vai de 1 a 5. A data usa `AAAA-MM-DD` entre aspas. Você pode deixar o gênero, a data ou a nota em branco.
3. Escreva a resenha abaixo da segunda linha de três hífens. Uma linha em branco separa os parágrafos. Você pode usar `**negrito**` e `*itálico*`.

Para alterar uma resenha já cadastrada, abra o arquivo dela em `resenhas/`. A ordem das páginas segue a data de leitura, da mais recente para a mais antiga. Leituras sem data aparecem depois, por título. O arquivo `caderno.json` guarda o título do caderno e o nome da autora mostrado no índice.

O site mostra resenhas identificadas como exemplos até você adicionar a primeira resenha em `resenhas/`. O texto de teste de *Uma Vida Pequena* está em `rascunhos/`. Para publicá-lo, termine de escrever e mova o arquivo para `resenhas/`.

## Adicionar capa e frases

1. Na pasta descompactada, abra `editar-livro.html` no Chrome ou Edge do computador.
2. Clique em **Abrir pasta do projeto**, selecione a pasta `joyceeeira` e autorize a edição. Selecione uma resenha já escrita.
3. Clique em **Adicionar capa** e escolha uma imagem JPG, PNG ou WebP. Confira a prévia e clique em **Salvar capa**.
4. Escreva uma frase por linha no campo **Frases do livro** e clique em **Salvar frases**. Para apagar as frases de uma resenha, esvazie o campo e salve.

O editor salva a capa em `public/capas/enviadas/` e as frases em `resenhas/frases/`, com o mesmo nome do arquivo da resenha. Para editar pelo código, use o campo `capa` do Markdown com uma imagem em `public/capas/` e use um arquivo `.txt` em `resenhas/frases/`. Se houver uma capa salva pelo editor, ela aparece no lugar da imagem indicada no Markdown.

Atualize a página local para conferir. Para levar as mudanças ao site, envie os arquivos novos ou atualizados ao GitHub conectado à Vercel.

## Ver no computador antes de publicar

Abra o terminal na pasta `joyceeeira` com Node.js 22.13 ou superior.

```bash
npm ci
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). Salve seus arquivos e atualize a página para conferir as resenhas.

## Publicar na Vercel

1. Envie o conteúdo da pasta `joyceeeira` para um repositório seu no GitHub.
2. Na Vercel, importe esse repositório como um projeto **Next.js**. Use a pasta que contém `package.json` como raiz. O projeto usa os arquivos do repositório como fonte das resenhas.
3. Depois da primeira publicação, salve e envie as alterações para o ramo de produção conectado à Vercel, normalmente `main`. A Vercel publica a nova versão a partir desse envio.

A edição depende de permissão para gravar no repositório. Cada resenha incluída na pasta `resenhas/` fica disponível para leitura no site publicado.

[Documentação da integração com GitHub na Vercel](https://vercel.com/docs/git/vercel-for-github)

## Créditos

A imagem de exemplo de *Dom Casmurro* é da Livraria Garnier, 1899, em domínio público. [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:DomCasmurroMachadodeAssis.jpg)

A frase de exemplo de *Dom Casmurro* está na página 197 da edição de 1899. [Wikisource](https://pt.wikisource.org/wiki/P%C3%A1gina:Dom_Casmurro-1899.pdf/204)

As licenças das fontes Newsreader e DM Sans estão em `public/fontes/`.
