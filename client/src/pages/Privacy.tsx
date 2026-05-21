export default function Privacy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Política de Privacidade</h1>
        <p className="text-muted-foreground text-sm mb-8">
          Triarc Social Manager — Última atualização: maio de 2026
        </p>

        <section className="space-y-6 text-sm leading-relaxed">
          <div>
            <h2 className="text-lg font-semibold mb-2">1. Quem somos</h2>
            <p>
              O <strong>Triarc Social Manager (TSM)</strong> é uma ferramenta interna desenvolvida e
              operada pela <strong>Triarc Solutions</strong> para gerenciamento e publicação automática
              de conteúdo em redes sociais (Instagram, Facebook, LinkedIn). O responsável pelo
              tratamento de dados é a Triarc Solutions, com contato em{" "}
              <a href="mailto:contato@triarcsolutions.com.br" className="text-primary underline">
                contato@triarcsolutions.com.br
              </a>
              .
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">2. Dados coletados</h2>
            <p>O TSM coleta e processa os seguintes dados:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
              <li>Informações de perfil das contas conectadas (nome, foto, handle)</li>
              <li>Tokens de acesso OAuth das plataformas autorizadas (Facebook, Instagram, LinkedIn)</li>
              <li>Conteúdo de posts criados e agendados dentro da plataforma</li>
              <li>Logs de publicação (data, status, ID do post publicado)</li>
              <li>Dados de autenticação do usuário (via Manus OAuth)</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">3. Finalidade do uso dos dados</h2>
            <p>Os dados são utilizados exclusivamente para:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
              <li>Autenticar e conectar contas de redes sociais</li>
              <li>Publicar conteúdo aprovado nas plataformas conectadas</li>
              <li>Exibir métricas e histórico de publicações</li>
              <li>Enviar notificações operacionais ao administrador do sistema</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">4. Compartilhamento de dados</h2>
            <p>
              Os dados <strong>não são compartilhados com terceiros</strong> para fins comerciais ou
              publicitários. Os tokens OAuth são armazenados de forma segura no banco de dados da
              aplicação e utilizados apenas para as operações descritas nesta política. As APIs das
              plataformas (Meta Graph API, LinkedIn API) recebem apenas os dados necessários para
              executar as publicações autorizadas.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">5. Retenção de dados</h2>
            <p>
              Os tokens de acesso são mantidos enquanto a conta estiver conectada ao TSM. O usuário
              pode revogar o acesso a qualquer momento desconectando a conta na página{" "}
              <strong>Contas</strong> do sistema, o que remove o token do banco de dados. Os logs de
              publicação são mantidos por até 90 dias.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">6. Segurança</h2>
            <p>
              Todos os dados são transmitidos via HTTPS. Os tokens de acesso são armazenados de forma
              criptografada. O acesso ao sistema é restrito a usuários autenticados via OAuth.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">7. Direitos do usuário</h2>
            <p>
              Em conformidade com a LGPD (Lei nº 13.709/2018), o usuário tem direito a acessar,
              corrigir ou solicitar a exclusão de seus dados. Para exercer esses direitos, entre em
              contato pelo e-mail{" "}
              <a href="mailto:contato@triarcsolutions.com.br" className="text-primary underline">
                contato@triarcsolutions.com.br
              </a>
              .
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">8. Alterações nesta política</h2>
            <p>
              Esta política pode ser atualizada periodicamente. A data de última atualização será
              sempre indicada no topo desta página.
            </p>
          </div>
        </section>

        <div className="mt-10 pt-6 border-t text-xs text-muted-foreground">
          <p>© 2026 Triarc Solutions. Todos os direitos reservados.</p>
          <p className="mt-1">
            <a href="/" className="text-primary underline">← Voltar ao início</a>
          </p>
        </div>
      </div>
    </div>
  );
}
