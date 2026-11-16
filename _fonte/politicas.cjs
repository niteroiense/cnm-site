// Textos da Política de Privacidade e da Política de Cookies (item 2 da reunião
// de 11/11/2026). Descrevem o que o site e o painel fazem DE FATO — ao mudar o
// comportamento (ex.: ligar estatística de visitas ou o PagBank), atualize aqui.
// Rascunho redigido pela Mistura Tech: precisa da revisão da diretoria.

const ATUALIZADO = "16 de novembro de 2026";
const EMAIL = "cnm@niteroiense.org.br";

const privacidade = `
<p><em>Última atualização: ${ATUALIZADO}.</em></p>
<p>Esta política explica como o <strong>Clube Niteroiense de Montanhismo (CNM)</strong> trata dados pessoais no site <strong>niteroiense.org.br</strong> e no painel do sócio (<strong>painel.niteroiense.org.br</strong>), conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018, LGPD).</p>

<h2>Quem é o responsável</h2>
<p>O controlador dos dados é o Clube Niteroiense de Montanhismo, com sede na Rua Dr. Martins Tôrres, 18, Santa Rosa, Niterói/RJ, CEP 24240-705. Para qualquer assunto sobre dados pessoais, inclusive para falar com o encarregado, escreva para <a href="mailto:${EMAIL}?subject=Dados%20pessoais">${EMAIL}</a>.</p>

<h2>No site</h2>
<p>O site é informativo e não pede cadastro. Ele <strong>não usa ferramentas de estatística nem de publicidade</strong> e não grava cookies próprios. Como em qualquer site, o provedor de hospedagem registra dados técnicos de acesso (endereço IP, navegador, página e horário) para segurança e funcionamento, por prazo limitado.</p>
<p>Mapas do Google Maps e vídeos do YouTube incorporados ao site só carregam se você permitir, porque esses serviços podem gravar cookies próprios. Veja a <a href="/politica-de-cookies/">Política de Cookies</a>.</p>
<p>Se você nos procurar por WhatsApp ou e-mail a partir do site, usamos o que você enviar apenas para responder.</p>

<h2>No painel do sócio</h2>
<p>Para se associar e participar das atividades, tratamos:</p>
<ul>
<li><strong>Cadastro:</strong> nome, nome social, e-mail, telefone, foto, matrícula, plano e situação da anuidade;</li>
<li><strong>Documentos e endereço:</strong> RG, CPF, data de nascimento, naturalidade, estado civil, profissão e endereço;</li>
<li><strong>Contato de emergência:</strong> nome, telefone e parentesco;</li>
<li><strong>Ficha de associação:</strong> cursos que fez e experiência em caminhada, escalada e ciclismo;</li>
<li><strong>Informações de saúde</strong> (dado pessoal sensível): condições médicas, medicamentos, alergias, tipo sanguíneo e o que mais você informar na ficha;</li>
<li><strong>Participação:</strong> inscrições, presença e faltas em atividades e cursos, e relatórios das atividades.</li>
</ul>

<h2>Para que usamos</h2>
<ul>
<li>Administrar o quadro social, a anuidade e a carteirinha (execução do vínculo associativo e cumprimento do estatuto);</li>
<li>Organizar atividades e cursos com segurança: o guia precisa saber quem vai, como contatar a pessoa e a família e se há alguma condição de saúde relevante em campo (proteção da vida e da incolumidade física, e consentimento ao preencher a ficha);</li>
<li>Comunicar avisos, convocações de assembleia e novidades do clube;</li>
<li>Cumprir obrigações legais e fiscais.</li>
</ul>
<p>Não vendemos, não alugamos e não usamos seus dados para publicidade.</p>

<h2>Quem tem acesso</h2>
<ul>
<li><strong>Diretoria:</strong> ao cadastro completo, para administrar o clube;</li>
<li><strong>Guias e monitores:</strong> apenas aos dados de quem está inscrito nas atividades que conduzem — contato, contato de emergência, experiência e informações de saúde. Documentos (RG, CPF) e dados de filiação não ficam visíveis para eles;</li>
<li><strong>Cada sócio:</strong> aos próprios dados.</li>
</ul>
<p>Essas permissões são aplicadas pelo próprio banco de dados, não só pelas telas.</p>
<p>Os dados ficam em provedores que operam o painel e o site em nosso nome: <strong>Supabase</strong> (banco de dados e login, com servidores em São Paulo) e <strong>Vercel</strong> (hospedagem). Quando a cobrança online estiver ativa, o pagamento é processado pelo <strong>PagBank</strong>: o CNM não recebe nem guarda o número do seu cartão. Dados também podem ser fornecidos a autoridades quando a lei exigir.</p>

<h2>Por quanto tempo</h2>
<p>Mantemos os dados enquanto durar o vínculo com o clube. Depois do desligamento, guardamos apenas o necessário para cumprir obrigações legais e estatutárias e preservar o histórico do clube (como participação em atividades e cursos); o restante é excluído ou anonimizado.</p>

<h2>Segurança</h2>
<p>O acesso ao painel exige login individual, as conexões são cifradas (HTTPS) e cada pessoa só vê o que o seu nível de acesso permite. Nenhum sistema é infalível: se ocorrer um incidente que possa trazer risco a você, avisaremos e comunicaremos a Autoridade Nacional de Proteção de Dados (ANPD), como manda a lei.</p>

<h2>Seus direitos</h2>
<p>Você pode, a qualquer momento: confirmar se tratamos seus dados e acessá-los; corrigir dados incompletos ou desatualizados;pedir anonimização, bloqueio ou eliminação do que for desnecessário; pedir a portabilidade; saber com quem compartilhamos; e revogar o consentimento, quando for essa a base do tratamento. Escreva para <a href="mailto:${EMAIL}?subject=Direitos%20LGPD">${EMAIL}</a>. Você também pode reclamar à ANPD.</p>

<h2>Menores de idade</h2>
<p>A participação de menores de 18 anos depende de autorização do responsável legal, que responde pelo cadastro.</p>

<h2>Mudanças nesta política</h2>
<p>Esta política pode ser atualizada quando o site ou o painel mudarem. A data no início desta página indica a versão em vigor.</p>
`;

const cookies = `
<p><em>Última atualização: ${ATUALIZADO}.</em></p>
<p>Cookies e armazenamento local são pequenos registros que um site guarda no seu navegador. Esta página explica quais o CNM usa e como escolher.</p>

<h2>No site (niteroiense.org.br)</h2>
<div class="tabela"><table>
<thead><tr><th>O quê</th><th>Tipo</th><th>Para quê</th><th>Duração</th></tr></thead>
<tbody>
<tr><td><code>cnm_consentimento</code></td><td>Necessário (armazenamento local)</td><td>Lembrar a sua escolha sobre conteúdo de terceiros, para a barra não aparecer de novo</td><td>Até você limpar os dados do navegador ou mudar a escolha</td></tr>
<tr><td>Google Maps (página Contato)</td><td>Terceiros — opcional</td><td>Mostrar o mapa da sede. O Google pode gravar cookies próprios</td><td>Definida pelo Google</td></tr>
<tr><td>YouTube (vídeos em publicações)</td><td>Terceiros — opcional</td><td>Exibir vídeos dentro da página. Usamos o modo de privacidade reforçada do YouTube, mas o Google pode gravar cookies ao reproduzir</td><td>Definida pelo Google</td></tr>
</tbody>
</table></div>
<p>O site <strong>não usa cookies de estatística nem de publicidade</strong>. O mapa e os vídeos só carregam se você permitir; antes disso, aparece um aviso no lugar deles, com a opção de carregar.</p>

<h2>No painel do sócio (painel.niteroiense.org.br)</h2>
<p>O painel guarda no navegador apenas o necessário para funcionar: a sua sessão de login (para você não precisar entrar a cada página) e, para a diretoria, a opção “Ver como”. Não há cookies de estatística nem de publicidade.</p>

<h2>Como mudar a sua escolha</h2>
<p>Clique em <a href="#" data-cookies>Preferências de cookies</a> (o mesmo link fica no rodapé de todas as páginas). Você também pode apagar cookies e dados de sites nas configurações do seu navegador.</p>
<p>Sobre como o Google trata dados, veja a <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">política de privacidade do Google</a>. Dúvidas: <a href="mailto:${EMAIL}">${EMAIL}</a>. Veja também a <a href="/politica-de-privacidade/">Política de Privacidade</a>.</p>
`;

module.exports = { privacidade, cookies };
