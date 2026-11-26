/* Cola para a arguição (uso pessoal do apresentador). Não é fala e não conta no tempo do slide.
   Chave = número do slide; cada bloco vira um item recolhível (q = pergunta, a = resposta em HTML). */
window.ROTEIRO_COLA = {
 12: [
  { q: "O que a frase do slide quer dizer",
    a: `<ul>
<li><b>“Linha”</b> = uma combinação <b>ano × UC × classe</b> (ex.: Formação Florestal na UC X em 2003). Na comparação direta foram <b>18.122 linhas</b>, de <b>139 UCs</b> nos <b>41 anos</b>.</li>
<li><b>“Até três pixels de diferença”</b>: em <b>97,0%</b> dessas linhas, o número de pixels somado pelo pipeline e pelo GEE difere em no máximo 3. Em <b>76,3%</b> é exatamente o mesmo conjunto de pixels; com até 1 pixel, <b>91,7%</b>. Pior linha: <b>34 pixels</b>.</li>
<li>Escala: em SC um pixel tem de <b>0,078 a 0,081 ha</b>, ou seja, 3 pixels ≈ <b>0,24 ha</b>. No maior caso (RPPN Emílio Einsfeld Filho, 6.331,95 ha), 39 pixels = 3,09 ha = <b>0,05%</b> da UC.</li>
<li><b>“Discordância de composição de 0,007 ponto percentual”</b>: mede se a <b>proporção de cada classe dentro da UC</b> muda entre os dois cálculos. É uma média por UC e ano, ponderada pela área do GEE (Quadro 22). 0,007 p.p. significa que a composição da UC praticamente não muda.</li>
<li><b>“Restrita a pixels de borda”</b>: a diferença de cada UC é <b>a mesma nos 41 anos</b> (varia menos de 10⁻⁴ pixel). Se o problema fosse de classe, ela mudaria de um ano para outro, porque as classes mudam. Logo, a diferença está em <b>quais pixels entram no recorte</b>, e não na classe. UCs que coincidem 100% têm mediana de 10,4 ha; as que diferem têm mediana de 201,2 ha (mais perímetro, mais borda).</li>
</ul>` },
  { q: "Como o pipeline calcula a área (DAG_MAPBIOMAS)",
    a: `<ol>
<li><b>Raster</b>: mapa anual da Coleção 11 exportado do próprio GEE, grade <b>EPSG:4326</b>, pixel de <b>0,000269°</b> (≈ 30 m). Não reprojeta nem reamostra, para não alterar as contagens.</li>
<li><b>Área de interesse</b>: UC recortada pelo <b>limite de SC do IBGE</b>. ZA oficial e Buffer entram <b>sem o interior da UC</b>. UC pontual não gera área.</li>
<li><b>Seleção do pixel</b>: entra se o <b>centro do pixel</b> cai dentro do polígono (<code>geometry_mask</code>, <code>all_touched=False</code>). Evita contar a mesma borda para dois lados.</li>
<li><b>Área do pixel</b>: <b>geodésica</b>, no elipsoide WGS 84 (<code>pyproj.Geod</code>), calculada <b>por linha do raster</b>: todos os pixels de uma linha têm a mesma área, que muda com a latitude. Não usa 900 m² fixo, como o próprio MapBiomas recomenda.</li>
<li><b>Soma</b> por classe → m² → <b>hectares</b>. Classe 0 (sem classificação) não entra.</li>
<li><b>Controles</b>: se a área classificada passar a área geodésica do polígono em mais de 5% <i>e</i> mais de 1 ha → <code>COVERAGE_OUT_OF_TOLERANCE</code>, não grava. O total de SC também é conferido com a planilha oficial da Coleção 11.</li>
</ol>` },
  { q: "Como o script do MapBiomas no GEE calcula (referência)",
    a: `<p>Script oficial <code>mapbiomas-user-toolkit-calculate-area.js</code>, repositório <b>mapbiomas/user-toolkit</b>, versão de <b>18/09/2026</b> (commit f742492, conferido no GitHub):</p>
<ul>
<li><code>selfMask()</code>: descarta pixels sem classe.</li>
<li><code>ee.Image.pixelArea()</code> ÷ 1.000.000: área real de cada pixel, em <b>km²</b>.</li>
<li>Redutor <code>ee.Reducer.sum().group(classe).group(território)</code> com <code>reduceRegion</code>, <b>escala 30 m</b>, <code>maxPixels 1e12</code>, região = extensão do mapa.</li>
<li>O original usa um <b>raster de territórios</b> (biomas e estados). <b>4 adaptações</b> (TCC 3.3.3.1): asset da Coleção 11 v3, anos 1985–2025, território = UCs rasterizadas com <code>ee.Image.paint</code> pelo <code>uc_id</code> numérico, coluna da classe renomeada. Escala, unidade, redutor, máscara e região ficaram como no original.</li>
</ul>` },
  { q: "De onde vêm as áreas do GEE usadas na comparação",
    a: `<ol>
<li>Peguei o script oficial e fiz as 4 adaptações (Coleção 11, anos 1985–2025, UCs como território, nome da coluna).</li>
<li>Enviei ao GEE a <b>coleção vetorial das UCs</b> cadastradas. O script a rasteriza com <code>ee.Image.paint</code>, usando o <code>uc_id</code> como número de cada território.</li>
<li><b>Rodei o script no próprio GEE</b>. Ele calcula a área por UC, classe e ano no mapa oficial e exporta uma <b>tabela</b> (<code>Export.table.toDrive</code>, CSV) com uma linha por território, classe e ano: <b>28.998 linhas</b>.</li>
<li>Do lado do pipeline, li as <b>29.952 linhas</b> de área por classe do interior das UCs gravadas no banco.</li>
<li>Juntei as duas pelo <b>código CNUC</b> (o <code>uc_id</code> do arquivo enviado ao GEE diferia em 6 UCs), converti km² para hectare e tratei classe ausente no GEE como zero, porque o GEE só exporta área positiva. Resultado: 29.143 linhas comparáveis.</li>
<li>Para achar a causa das diferenças, exportei também do GEE o <b>raster dos territórios</b> gerado pelo <code>paint</code> e comparei <b>pixel a pixel</b> com a seleção do pipeline. A diferença estava na regra de seleção do pixel de borda e no traçado das arestas.</li>
</ol>
<p>Ou seja: as áreas do GEE não vêm de nenhuma tabela pronta do MapBiomas. São o resultado do <b>script oficial executado por mim</b>, sobre o mesmo mapa e as mesmas UCs.</p>` },
  { q: "Critério a critério: pipeline × GEE",
    a: `<table>
<tr><th>Critério</th><th>Pipeline</th><th>GEE (referência)</th></tr>
<tr><td>Dado</td><td>Coleção 11 exportada do GEE</td><td>Coleção 11 v3 no GEE</td></tr>
<tr><td>Grade</td><td>EPSG:4326, 0,000269°</td><td>mesma grade, sem reamostragem</td></tr>
<tr><td>Pixel sem classe</td><td>classe 0 ignorada</td><td><code>selfMask()</code></td></tr>
<tr><td>Área do pixel</td><td>elipsoide WGS 84, por linha</td><td><code>ee.Image.pixelArea()</code></td></tr>
<tr><td>Unidade</td><td>hectare</td><td>km² (convertido ×100)</td></tr>
<tr><td>Pixel de borda</td><td>centro dentro do polígono</td><td>rasterização do <code>paint</code></td></tr>
<tr><td>Limite de SC</td><td><b>corta</b> pela divisa IBGE</td><td>polígono inteiro</td></tr>
<tr><td>UCs sobrepostas</td><td>cada UC medida inteira</td><td>pixel fica com <b>uma</b> UC</td></tr>
<tr><td>Implementação</td><td>Python (rasterio, pyproj)</td><td>JavaScript no GEE</td></tr>
</table>
<p>Só as duas linhas em negrito são diferenças de <b>método</b>, conhecidas antes. Por isso a comparação direta usa as 139 UCs <b>sem</b> parte fora de SC e <b>sem</b> sobreposição.</p>` },
  { q: "E nas outras UCs? (se perguntarem)",
    a: `<ul>
<li>Bases ligadas pelo <b>código CNUC</b> (o <code>uc_id</code> enviado ao GEE diferia em 6 UCs). Classe ausente no GEE = área zero. Ao todo, 29.143 linhas comparáveis em 180 UCs.</li>
<li><b>Parte fora de SC</b> (10 UCs): pipeline mede <b>9,5% a menos</b>, quase tudo “Rio, Lago e Oceano”, porque o IBGE segue a linha de costa. Ex.: REBIO Marinha do Arvoredo, 97,7% fora.</li>
<li><b>Sobreposição</b> (24 UCs): <b>+0,66%</b>, efeito do <code>paint</code>. Ex.: PE Serra Furada, 1.330,36 ha, dos quais 1.151,53 ha sobrepostos ao PARNA São Joaquim; o GEE dá 178,38 ha.</li>
<li><b>Ambos</b> (7 UCs): −13,2%. Todas as comparáveis: −4,6%.</li>
<li><b>Não avalia a acurácia temática</b> do MapBiomas: compara o cálculo de área, não se a classificação do pixel está certa.</li>
</ul>` }
 ],
 13: [
  { q: "Frase-chave (diga assim)",
    a: `<p><b>“O usuário não lê as tabelas operacionais do banco. Ele lê nove views de um schema separado, o <code>reporting</code>, com login próprio, somente leitura e com limites de tempo e de conexões.”</b></p>
<p class="alerta"><b>Cuidado:</b> não diga que é “outro banco”. É a <b>mesma instância RDS</b>; o isolamento é <b>lógico</b> (schema, papéis e permissões), não uma réplica.</p>` },
  { q: "Como o isolamento é montado",
    a: `<ol>
<li><b>Tabelas operacionais</b> (<code>public</code>): só a API e o Airflow escrevem. Ninguém de fora tem permissão nelas.</li>
<li><b>9 views em <code>reporting</code></b>: UC, ZA oficial, Buffer, PRODES, Alerta, FIRMS, MapBiomas, legenda e catálogo de rasters. Não trazem autoria, motivo nem identificadores de correlação; testes da API falham se alguma passar a expor coluna de auditoria.</li>
<li><b>Papel de grupo <code>reporting_readonly</code></b>, sem login: só <code>SELECT</code> no <code>reporting</code>, sem <code>CREATE</code> no <code>public</code>.</li>
<li><b>Um login por consumidor</b>, herdando esse papel, todos com <code>default_transaction_read_only = on</code>. Verificado pela internet: lê as views, e leitura de tabela interna e qualquer escrita são negadas.</li>
</ol>` },
  { q: "Como o usuário não fica “pendurado” no banco",
    a: `<table>
<tr><th>Login</th><th>Conexões máx.</th><th>Consulta máx.</th><th>Transação ociosa</th><th>Validade</th></tr>
<tr><td>geoserver_svc</td><td>20 (pool de 1 a 10)</td><td>120 s</td><td>–</td><td>permanente</td></tr>
<tr><td>powerbi_svc</td><td>10</td><td>120 s</td><td>300 s</td><td>permanente</td></tr>
<tr><td>lab_svc</td><td>12</td><td>220 s</td><td>300 s</td><td>permanente; senha trocada quando alguém sai</td></tr>
<tr><td>ws_&lt;inst&gt;_&lt;data&gt;</td><td>80</td><td>120 s</td><td>–</td><td><code>VALID UNTIL</code> fim do evento; removido no retorno</td></tr>
</table>
<ul>
<li><code>statement_timeout</code>: corta consulta longa demais.</li>
<li><code>idle_in_transaction_session_timeout</code> (300 s): derruba quem abriu uma transação e deixou o DBeaver ou o Power BI parado.</li>
<li><code>CONNECTION LIMIT</code>: um consumidor não esgota as conexões que a API e o Airflow precisam.</li>
<li>Somente leitura: nenhuma consulta externa segura bloqueio de escrita das cargas.</li>
</ul>` },
  { q: "De onde vêm WMS, WMTS, WFS e WCS",
    a: `<p>Caminho: usuário → <b>CloudFront</b> (HTTPS) → nginx no <b>nó de serviço</b> → <b>GeoServer</b>. <b>Quem usa mapa nunca conecta no banco</b>; só o GeoServer conecta, com o login <code>geoserver_svc</code> e um <b>pool de no máximo 10 conexões</b>. Com 100 pessoas no QGIS, o banco continua vendo no máximo 10.</p>
<table>
<tr><th>Serviço</th><th>Entrega</th><th>Origem do dado</th></tr>
<tr><td>WMS</td><td>imagem do mapa, já colorida</td><td>vetores: views pelo pool · raster: COG em disco</td></tr>
<tr><td>WMTS</td><td>blocos de imagem em cache</td><td>GeoWebCache: bloco em cache não vai ao banco; no modo eventos pré-gera SC (zoom 5 a 11)</td></tr>
<tr><td>WFS</td><td>feições com atributos (GeoJSON, CSV)</td><td>views pelo pool, páginas de 1.000 feições</td></tr>
<tr><td>WCS</td><td>raster MapBiomas (código da classe)</td><td>COG em disco, <b>sem banco</b></td></tr>
</table>
<p><b>COG</b> = GeoTIFF da camada Gold, copiado do S3 para o disco do nó de serviço, com hash conferido contra o catálogo. A cada carga, a <code>DAG_GEOSERVER_SYNC</code> republica as camadas e limpa os caches.</p>` },
  { q: "Risco que fica (se perguntarem)",
    a: `<p>O banco aceita conexão direta pela internet, por decisão das oficinas (redes desconhecidas, sem VPN nem lista de IPs). Mitigações: TLS obrigatório (<code>rds.force_ssl</code>), um login por consumidor, menor privilégio, limites de tempo e conexão e registro de conexões. Trabalho futuro: abrir o banco só durante as oficinas.</p>` }
 ],
 14: [
  { q: "Serviços da AWS: o que é e para que serve no projeto",
    a: `<table>
<tr><th>Serviço</th><th>O que é</th><th>No projeto</th></tr>
<tr><td><b>EC2</b></td><td>máquinas virtuais</td><td><b>Nó de serviço</b> t3a.small (2 GiB), 24/7: API, GeoServer e nginx em Docker Compose. <b>Nó de processamento</b> t3a.large (8 GiB, disco de 100 GB): Airflow e DAGs, só liga quando precisa e desliga após 20 min ocioso.</td></tr>
<tr><td><b>EBS</b></td><td>discos das EC2</td><td>gp3: 20 GB no serviço e 100 GB criptografado no processamento (cache da Medallion).</td></tr>
<tr><td><b>Elastic IP</b></td><td>IPv4 público fixo</td><td>Endereço fixo do nó de serviço, origem do CloudFront.</td></tr>
<tr><td><b>RDS</b></td><td>banco gerenciado (backup, patches)</td><td>PostgreSQL 17 + PostGIS 3.5, db.t3.micro, 20 GB, Single-AZ, backup de 7 dias, TLS obrigatório.</td></tr>
<tr><td><b>S3</b></td><td>armazenamento de objetos</td><td><b>Fonte da verdade</b> da Medallion. Bronze versionada e imutável; Silver, Gold e qualidade em outro bucket, criptografado; um terceiro bucket guarda o site do front.</td></tr>
<tr><td><b>CloudFront</b></td><td>CDN (rede de entrega)</td><td>Domínio único em HTTPS: entrega o front do S3 e repassa <code>/api/*</code> e <code>/geoserver/*</code> ao nó de serviço. Põe HSTS, CSP e X-Frame-Options. Só ele alcança a porta 80 da máquina.</td></tr>
<tr><td><b>Route 53</b></td><td>DNS e registro de domínio</td><td><code>areasprotegidas-sc.com</code> apontando para o CloudFront.</td></tr>
<tr><td><b>ACM</b></td><td>certificados TLS gratuitos</td><td>Certificado do domínio, validado por DNS.</td></tr>
<tr><td><b>VPC</b> e security groups</td><td>rede privada e firewall</td><td>2 zonas, sub-redes públicas, <b>sem NAT Gateway</b> (economia); endpoint de gateway do S3 (tráfego sem custo); regras explícitas por máquina.</td></tr>
<tr><td><b>IAM</b> e OIDC</td><td>identidades e permissões</td><td>Um papel por máquina e por repositório. O GitHub Actions assume papel por <b>OIDC</b>, sem chave fixa guardada.</td></tr>
<tr><td><b>ECR</b></td><td>registro de imagens Docker</td><td>Imagens da API e do pipeline, com a tag do commit; guarda as 5 mais recentes.</td></tr>
<tr><td><b>Systems Manager (SSM)</b></td><td>administração das máquinas</td><td><b>Parameter Store</b>: senhas criptografadas. <b>Run Command</b>: deploy da API e sincronização do GeoServer. <b>Session Manager</b>: acesso sem SSH aberto. <b>Automation</b>: modo eventos (para, troca o tamanho e religa).</td></tr>
<tr><td><b>EventBridge</b> (Scheduler e regras)</td><td>agendador e eventos</td><td>Liga o processamento nas janelas (segunda 06:00 UTC e 3 de janeiro); agenda o retorno do modo eventos como garantia; avisa por e-mail mudanças das automações.</td></tr>
<tr><td><b>CloudWatch</b></td><td>logs, métricas e alarmes</td><td>Logs de cada contêiner e de cada tarefa do Airflow (14 dias, legíveis com a máquina desligada); alarmes de erro 5xx e de falhas de login.</td></tr>
<tr><td><b>SNS</b></td><td>notificações</td><td>E-mail de falha de tarefa do Airflow, alarmes e modo eventos.</td></tr>
<tr><td><b>Budgets</b></td><td>alerta de gasto</td><td>Aviso em 80% e 100% de US$ 65 por mês.</td></tr>
</table>
<p>Tudo descrito em <b>Terraform</b> (repositório <code>infra-protected-areas-sc</code>), revisado como plano antes de aplicar. Região <b>us-east-1</b>.</p>` },
  { q: "Por que duas máquinas e não uma?",
    a: `<p>Separar o que precisa responder a qualquer hora (interface, API, mapas) do que só existe enquanto processa. A máquina de 8 GiB, necessária pelo pico de 4,36 GiB do MapBiomas, fica desligada quase o mês todo (27,7 h em outubro), e a de 2 GiB, barata, fica sempre ligada.</p>` }
 ],
 15: [
  { q: "Como a estimativa foi feita",
    a: `<ul>
<li><b>Proposta (TCC II), ≈ US$ 30/mês</b>, feita na <b>AWS Pricing Calculator</b>, antes de existir qualquer fatura. Na calculadora informei cada componente com a configuração e as horas previstas, e ela aplicou o preço sob demanda de us-east-1: RDS db.t3.micro ≈ 15,00 + 20 GB ≈ 2,00 a 3,00 + EC2 t3.medium 150 h ≈ 10,00 + disco de 30 GB ≈ 2,40 + S3 20 GB ≈ 0,81. <i>(A menção à calculadora não ficou no PDF final.)</i></li>
<li><b>Implantação, US$ 53,70/mês</b>: com a infraestrutura definida, recalculei com os preços <b>sob demanda</b> de us-east-1 da <b>AWS Price List API</b> (a mesma tabela de preços que a calculadora usa), em 30/09/2026, câmbio de R$ 5,50, domínio rateado por mês, <b>sem tributos</b>. É o que o Quadro 28 do PDF registra.</li>
<li><b>Real</b>: depois veio a fatura de outubro (bloco abaixo). Ordem: calculadora (previsão) → Price List API (configuração implantada) → fatura (medido).</li>
</ul>
<table>
<tr><th>Item</th><th>US$/mês</th></tr>
<tr><td>Máquina de serviço (instância 13,72 + disco 1,60 + IPv4 3,65)</td><td>18,97</td></tr>
<tr><td>RDS (instância 13,14 + IPv4 3,65)</td><td>16,79</td></tr>
<tr><td>Disco do processamento, 100 GB</td><td>8,00</td></tr>
<tr><td>Processamento ≈ 50 h (3,76 + IPv4 0,25)</td><td>4,01</td></tr>
<tr><td>Armazenamento do banco, 20 GB</td><td>2,30</td></tr>
<tr><td>Domínio (1,33) + zona DNS (0,50)</td><td>1,83</td></tr>
<tr><td>S3</td><td>0,90</td></tr>
<tr><td>ECR (0,35) + CloudWatch Logs (0,55)</td><td>0,90</td></tr>
<tr><td><b>Total</b></td><td><b>53,70</b></td></tr>
</table>
<p>Subiu por 4 itens não previstos: máquina de serviço contínua, IPv4 pago desde 2024 (≈ US$ 7,55), domínio e disco maior. O processamento ficou <b>mais barato</b> (4,01 contra 10,00): máquina maior, por menos horas.</p>` },
  { q: "Como o custo real foi medido",
    a: `<ul>
<li><b>Fatura de outubro/2026</b>, o primeiro mês completo: <b>US$ 69,20</b> = 47,44 de uso + 16,00 do registro anual do domínio + 5,76 de tributos; os créditos da AWS abateram 25,00.</li>
<li>Por serviço: RDS 14,76 · máquina de serviço 12,61 · discos 8,71 · IPv4 6,88 · processamento 2,48.</li>
<li>Outubro foi atípico: a infraestrutura entrou no ar no dia 2 (≈ 670 das 744 h). Por isso a média usa só a <b>operação estável, de 5 a 31/10</b>: <b>US$ 1,61/dia</b>.</li>
<li>Projeção: 1,61 × 31 = 49,91 + 1,33 do domínio = <b>≈ US$ 51,20/mês</b>, cerca de 5% abaixo dos 53,70. Com tributos, ≈ US$ 54.</li>
<li>Processamento: <b>27,7 h</b> ligado em outubro (8 partidas pela agenda, incluindo cargas históricas e testes), abaixo das 50 h previstas.</li>
<li>Limite: <b>um único ciclo</b> de faturamento. Por isso “acompanhar o custo em novos ciclos” é trabalho futuro.</li>
</ul>` }
 ],
 18: [
  { q: "O que é o manifesto imutável",
    a: `<ul>
<li>É um arquivo <code>manifest.json</code> que a API grava na <b>camada Bronze do S3</b> junto com os arquivos de cada importação aceita. Ele descreve <b>exatamente</b> o que deve ser feito: <code>import_id</code>, operação (create, update, extinguish…), domínio, quem pediu (da sessão), chave de idempotência, identificador de correlação, metadados validados, o arquivo original e o canônico (EPSG:4674) com <b>checksum SHA-256</b> e o relatório de validação.</li>
<li><b>Imutável</b>: depois de publicado, o lote não é alterado. Uma correção é uma <b>nova importação</b>, com novo manifesto. A Bronze é versionada e os objetos correntes nunca expiram.</li>
<li><b>Gravado por último</b>: a API grava os arquivos primeiro e o manifesto no fim. Para o pipeline, o lote só existe quando o manifesto existe, então um envio interrompido nunca fica visível pela metade.</li>
<li>A DAG confere o <b>checksum</b> do manifesto com o informado no disparo: se o lote foi alterado, ela não processa.</li>
</ul>` },
  { q: "Por que o manifesto neste projeto",
    a: `<ul>
<li><b>Entrada única das escritas</b>: a API <b>não grava</b> UC nem geometria no PostGIS. Toda mudança de cadastro vira um manifesto, e só o Airflow aplica. Assim, toda alteração passa pelo mesmo caminho, que recalcula os derivados (entorno e os quatro temas).</li>
<li><b>Funciona com a máquina desligada</b>: com o Airflow desligado, a importação fica PUBLISHED; a API liga o nó de processamento e o despachante reenvia a cada 60 s até ser aceita. O pedido não se perde.</li>
<li><b>Rastreabilidade</b>: o identificador de correlação nasce no clique, vai no manifesto, acompanha a execução do Airflow e chega ao evento cadastral no banco. Dá para seguir um pedido do operador até a linha do banco.</li>
<li><b>Reprodutibilidade</b>: com a Bronze e os manifestos, o banco foi reconstruído do zero com as mesmas contagens e o mesmo hash dos rasters (Seção 3.8.5).</li>
</ul>` },
  { q: "O que é idempotência",
    a: `<p>Uma operação é <b>idempotente</b> quando repeti-la produz o <b>mesmo resultado</b> que executá-la uma vez. Exemplo: apertar “enviar” duas vezes deve cadastrar a UC <b>uma</b> vez, e não criar duas versões.</p>` },
  { q: "Por que idempotência neste projeto (e onde)",
    a: `<p>Aqui a repetição é <b>normal</b>, não exceção: clique duplicado, reenvio de rede, nova tentativa automática de tarefa do Airflow, execução agendada de uma janela já processada e reconstrução a partir da Bronze. Sem idempotência, cada uma criaria versões, cruzamentos ou focos duplicados. Por isso há controle <b>em cada camada</b> (Quadro 26):</p>
<table>
<tr><th>Camada</th><th>Mecanismo</th><th>Evita</th></tr>
<tr><td>API</td><td><code>Idempotency-Key</code> obrigatória: mesma chave e mesmo conteúdo devolvem a importação original; mesma chave com outro conteúdo → 409</td><td>clique duplicado, reenvio de rede</td></tr>
<tr><td>Bronze</td><td>lote imutável, manifesto por último, checksum conferido</td><td>processar lote incompleto ou alterado</td></tr>
<tr><td>Evento cadastral</td><td>chave do evento = SHA-256 da chave da requisição + operação + UC; consultada antes de gravar</td><td>nova versão por nova tentativa da DAG</td></tr>
<tr><td>Regras de negócio</td><td>versão esperada, cardinalidade, estado da UC</td><td>sobrescrita concorrente, mutação já recusada</td></tr>
<tr><td>Entorno</td><td>nova versão do Buffer só se o anel mudou</td><td>histórico inflado por reexecução</td></tr>
<tr><td>Cargas temáticas</td><td>chaves naturais da fonte verificadas antes de inserir; <code>ON CONFLICT</code> e índices únicos</td><td>cruzamento duplicado</td></tr>
<tr><td>Aquisição</td><td>checksum (Alerta) e estado por janela (FIRMS)</td><td>baixar de novo o que já foi publicado</td></tr>
<tr><td>GeoServer</td><td>sincronização que só muda o que mudou</td><td>camada duplicada</td></tr>
</table>
<p>Regra junto: falha <b>transitória</b> (rede) tem nova tentativa; violação de <b>regra de negócio</b> encerra sem repetir.</p>` },
  { q: "Ressalva honesta (se perguntarem)",
    a: `<p>No PRODES e no MapBiomas Alerta a proteção contra duplicidade está <b>no código</b>, e não em restrição única no banco, como já acontece no FIRMS. Por isso vale desde que as execuções dirigidas não rodem ao mesmo tempo (a DAG do Alerta aceita uma execução ativa por vez). Converter isso em restrições únicas é trabalho futuro.</p>` }
 ],
 17: [
  { q: "Por que a troca automática NRT → SP no FIRMS não foi feita",
    a: `<ul>
<li><b>NRT</b> (tempo quase real) sai em horas; <b>SP</b> (processamento padrão) é a versão consolidada, publicada pela NASA <b>meses depois</b>.</li>
<li>Para o período <b>após junho de 2026</b> o SP <b>ainda não existia</b>, e o <b>VIIRS NOAA-21 não tem SP</b> nenhum. Dentro do prazo do TCC não havia SP novo para testar a troca de ponta a ponta.</li>
<li>No pipeline, NRT e SP são <b>produtos distintos</b> (a deduplicação vale só para a mesma detecção do mesmo produto). Trocar exige uma regra para aposentar as relações NRT de uma janela quando o SP dela sair, sem contar o mesmo foco duas vezes. Ficou registrado como incremento posterior.</li>
<li>Hoje: o histórico usa SP onde existe e o NRT completa o período recente, sempre com o produto identificado.</li>
</ul>` },
  { q: "Por que não há alta disponibilidade",
    a: `<ul>
<li><b>Decisão de custo</b>: o RDS está em <b>uma única zona</b> (<code>multi_az = false</code>). A réplica em outra zona <b>dobra o custo da instância</b> do banco.</li>
<li>O uso atual (cargas semanais e consultas do projeto) tolera uma parada: adia consultas e cargas, <b>sem perda de dados</b>, com backup diário de 7 dias.</li>
<li>Ativar depois é só uma opção do próprio RDS, <b>sem mudar a aplicação</b>.</li>
</ul>` },
  { q: "Por que o custo ainda não foi confirmado",
    a: `<p>Não é algo que faltou implementar: é <b>tempo</b>. A infraestrutura entrou no ar em 02/10/2026, então só havia <b>um ciclo completo</b> (outubro) antes da entrega. A média de US$ 1,61/dia precisa de novos meses para ser confirmada.</p>` },
  { q: "Se perguntarem sobre carga e segurança",
    a: `<ul>
<li><b>Carga</b>: o modo eventos foi ensaiado com <b>4 usuários simultâneos</b> (três do projeto e o autor). Oficinas maiores pedem novo ensaio; a máquina pode ser ampliada pelo mesmo mecanismo.</li>
<li><b>Segurança</b>: foram verificados controles específicos pela internet (Quadro 29), o que <b>não equivale</b> a teste de intrusão, auditoria independente ou análise formal de ameaças.</li>
</ul>` }
 ]
};
