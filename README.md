# Diário de Bordo

Aplicação de diário de viagens sem framework. As entradas ficam no `localStorage` do navegador e podem ser criadas, consultadas e removidas sem conexão após a primeira visita.

## Executar

Sirva esta pasta por HTTP local (por exemplo, com a extensão Live Server do VS Code) e abra o endereço no navegador. Service workers e instalação PWA requerem contexto seguro: HTTPS em produção ou `localhost` durante o desenvolvimento. Abrir o `index.html` diretamente como arquivo não ativa esses recursos.

## Publicar

Publique os arquivos desta pasta em um repositório GitHub e habilite GitHub Pages na branch desejada. O app shell já contém os arquivos necessários para o uso offline depois da primeira visita online.

## Recursos

- Entradas com título, descrição e data, armazenadas localmente.
- Remoção individual das entradas.
- Interface responsiva e acessível.
- Manifesto, ícones 192 × 192 e 512 × 512 e service worker para cache offline.
- Botão de instalação exibido quando o navegador oferece a instalação.
