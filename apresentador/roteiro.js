/* Roteiro de fala (uso pessoal do apresentador). time = segundos planejados. */
window.ROTEIRO = [
 {
  "title": "Capa",
  "time": 35,
  "notes": [
   "Boa tarde a todos. Cumprimento os membros da banca e agradeço pela leitura atenta do trabalho. Agradeço também ao meu orientador, professor Rafael Ballottin Martins, e a todos que estão assistindo.",
   "Meu nome é Diego Fonseca da Silva e vou apresentar o produto tecnológico \"Orquestração de um Pipeline End-to-End de Dados Geoespaciais sobre Unidades de Conservação em Santa Catarina\"."
  ]
 },
 {
  "title": "Roteiro da apresentação",
  "time": 20,
  "notes": [
   "A apresentação tem quatro partes. Primeiro, o contexto, o problema e os objetivos. Depois, o produto desenvolvido. Em seguida, os resultados, que são a maior parte do tempo. Por fim, a análise crítica e as considerações finais."
  ]
 },
 {
  "title": "Contexto e justificativa",
  "time": 80,
  "notes": [
   "O projeto trabalha com 186 Unidades de Conservação de Santa Catarina: 85 federais, 52 estaduais e 49 municipais.",
   "As bases de monitoramento, como PRODES, MapBiomas e FIRMS, já são abertas e consolidadas. Mas elas são generalistas: chegam em formatos, sistemas de referência e frequências diferentes, e não estão recortadas para essas áreas.",
   "O projeto de extensão Unidades de Conservação é Preciso, da UNIVALI, precisa desses dados de forma atualizada e padronizada. A justificativa do trabalho é justamente transformar dados abertos em evidência territorial reutilizável, para que os pesquisadores gastem tempo analisando e não preparando bases."
  ]
 },
 {
  "title": "Problema",
  "time": 65,
  "notes": [
   "O problema tratado é a dificuldade de produzir, de forma consistente e recorrente, informação geoespacial confiável sobre as UCs e seus entornos.",
   "Ele combina cinco fatores. Algumas UCs só têm um ponto ou um limite incompleto. Muitas não têm Zona de Amortecimento oficial cartografada. As fontes são heterogêneas. A preparação é manual. E os procedimentos ficam pouco rastreáveis.",
   "O resultado é que cada nova demanda refaz recortes, reprojeções e cruzamentos, e o resultado é difícil de reproduzir."
  ]
 },
 {
  "title": "Objetivos",
  "time": 75,
  "notes": [
   "O objetivo geral foi desenvolver um pipeline automatizado para dados geoespaciais sobre Unidades de Conservação e seus entornos em Santa Catarina, com foco na preparação, integração e disponibilização de dados analisáveis para apoio às pesquisas nas áreas de interesse.",
   "Os objetivos específicos foram: um, levantar os requisitos das fontes de dados. Dois, estruturar uma base geoespacial rastreável e reutilizável. Três, automatizar a preparação de dados de múltiplas fontes heterogêneas. Quatro, viabilizar a manutenção das informações espaciais. Cinco, desenvolver uma interface web para cadastro e atualização de geometrias. E seis, disponibilizar os dados preparados para consumo analítico."
  ]
 },
 {
  "title": "Como o trabalho foi conduzido",
  "time": 80,
  "notes": [
   "O trabalho seguiu quatro etapas. Primeiro, comparei seis bases e escolhi quatro fontes: PRODES, MapBiomas Alerta, MapBiomas Uso e Cobertura e FIRMS. Depois, especifiquei regras de negócio, requisitos e o modelo lógico. Em seguida, implementei com Apache Airflow, PostgreSQL com PostGIS, uma API FastAPI, uma interface React e a nuvem AWS.",
   "Na validação, uma operação só foi considerada concluída quando o estado na API, a execução no Airflow e os dados no banco estavam coerentes entre si. Isso combinou testes automatizados, cenários ponta a ponta por HTTP e consultas ao banco. Para o MapBiomas, comparei as áreas com o cálculo oficial do próprio MapBiomas."
  ]
 },
 {
  "title": "Visão geral do produto",
  "time": 100,
  "notes": [
   "Esta é a arquitetura geral. A camada Bronze, no Amazon S3, preserva as entradas originais. A Silver guarda os dados tratados e a Gold os derivados prontos para consumo. O S3 é a fonte da verdade. O disco local é apenas cache.",
   "O Airflow orquestra 12 DAGs, que fazem o cadastro, o cálculo dos entornos, os quatro temas, a aquisição histórica e a publicação. O PostgreSQL com PostGIS persiste o resultado.",
   "O cadastro reúne 186 UCs. Do Cadastro Nacional, só ficou de fora a APA Estadual de Guaratuba, que é gerida pelo Paraná. O produto prepara dados. Ele não confirma infrações nem gera um índice de risco."
  ]
 },
 {
  "title": "UC, ZA oficial e Buffer",
  "time": 70,
  "notes": [
   "Um ponto central da modelagem é distinguir três geometrias. A UC é a entidade de referência, com identidade estável e versões. A Zona de Amortecimento oficial tem precedência sempre que existir.",
   "Quando não há ZA, o pipeline gera um Buffer de Abrangência de 3.000 metros. Ele é uma delimitação operacional para os cruzamentos, sem natureza jurídica. Para calcular em metros, a geometria é reprojetada de SIRGAS 2000 para UTM 22 Sul e depois retorna.",
   "Cada UC ativa tem um único entorno vigente, e a substituição encerra a vigência sem apagar o histórico."
  ]
 },
 {
  "title": "Orquestração por manifesto",
  "time": 95,
  "notes": [
   "O produto opera com dois regimes. As fontes externas rodam pela agenda de publicação de cada uma: o PRODES uma vez por ano, o Alerta e o FIRMS toda semana.",
   "Já uma alteração cadastral gera um manifesto imutável na camada Bronze. Ele dispara o cadastro da UC, depois o entorno e, só então, os quatro temas, com o histórico completo para a geometria nova. O FIRMS recruza o acervo da Silver, sem consultar a NASA de novo.",
   "A importação só é dada como concluída quando os quatro temas terminam. Assim, cada alteração territorial fica ligada aos seus derivados."
  ]
 },
 {
  "title": "Manutenção cadastral versionada",
  "time": 95,
  "notes": [
   "A manutenção cadastral é feita pela interface web e pela API. Validei sete cenários, cada um executado ponta a ponta e conferido no banco: cadastro poligonal e em lote, cadastro pontual, UC com ZA oficial, atualização versionada, extinção, troca de ponto por polígono e troca do Buffer pela ZA oficial.",
   "O princípio é que nenhuma transição apaga dados. Atualizar cria uma versão nova, e extinguir apenas encerra a vigência. Uma requisição baseada em versão antiga é recusada.",
   "Se a banca quiser, abro aqui a tela da interface e a sequência da importação com a máquina de processamento desligada."
  ]
 },
 {
  "title": "Resultados das fontes temáticas",
  "time": 110,
  "notes": [
   "Agora os resultados. Esta é a leitura do banco na AWS depois da carga do cadastro completo, em 1º de novembro.",
   "No PRODES, 13.213 polígonos de desmatamento, de 15 mapeamentos entre 2004 e 2023, geraram 16.006 relações com 182 UCs e seus entornos. No MapBiomas Alerta, 267 alertas geraram 312 relações em 107 UCs. No MapBiomas Uso e Cobertura, os 41 anos da Coleção 11 viraram 93.905 registros de área por ano e classe. No FIRMS, 1.628 focos de calor, de 2000 a 2026, geraram 1.759 relações em 132 UCs.",
   "Cada fonte manteve sua semântica. Um alerta não é infração confirmada, e um foco de calor não é área queimada. Por isso a interpretação continua com o pesquisador."
  ]
 },
 {
  "title": "Verificação com o MapBiomas",
  "time": 100,
  "notes": [
   "Os mapas mostram o recorte estadual gerado a partir dos rasters da camada Gold, em 1989 e em 2025.",
   "Para verificar a exatidão, comparei as áreas por classe com o script oficial do MapBiomas no Google Earth Engine, em 139 UCs sem parte fora do estado nem sobreposição, nos 41 anos. A diferença total de área foi de 0,002 por cento. 97 por cento das linhas ficaram com até três pixels de diferença, e a discordância de composição foi de 0,007 ponto percentual, restrita a pixels de borda.",
   "As diferenças maiores vêm de decisões de modelagem, como o recorte pelo limite estadual nas UCs costeiras. Essa comparação não avalia a acurácia temática do MapBiomas."
  ]
 },
 {
  "title": "Disponibilização analítica",
  "time": 90,
  "notes": [
   "Os dados chegam ao pesquisador por um contrato somente leitura. São nove views no schema reporting, separadas da base operacional, de autenticação e de auditoria, com usuário próprio e TLS.",
   "O GeoServer publica sete camadas vetoriais e 41 rasters, um por ano do MapBiomas, pelos serviços WMS, WMTS, WFS e WCS. Validei o consumo com QGIS, DBeaver e Power BI.",
   "Aqui é possível abrir a resposta WMS real do Parque Nacional das Araucárias, com o Buffer, o PRODES, os alertas e os focos do FIRMS."
  ]
 },
 {
  "title": "Implantação e validação na AWS",
  "time": 95,
  "notes": [
   "O produto está implantado na AWS. Uma máquina pequena atende a interface, a API e o GeoServer o tempo todo. A máquina de processamento só liga quando há carga ou importação e desliga depois de 20 minutos sem execução.",
   "A validação teve 156 testes da API e 114 do pipeline aprovados. A carga de referência de uma UC nova levou 71 minutos, da Bronze até a última sincronização, com os temas em paralelo.",
   "E a reconstrução a partir da Bronze, num banco vazio, reproduziu as mesmas contagens e o mesmo hash dos rasters, o que confirma a reprodutibilidade."
  ]
 },
 {
  "title": "Custo da operação",
  "time": 55,
  "notes": [
   "Sobre o custo: a proposta estimava cerca de 30 dólares por mês. A implantação incluiu componentes não previstos, como a máquina de serviço contínua, IPv4 e domínio, e a estimativa subiu para 53,70 dólares.",
   "Na fatura de outubro, a operação estável custou 1,61 dólar por dia, o que projeta cerca de 51,20 dólares mensais com o domínio rateado. A máquina de processamento ficou ligada 27,7 horas, abaixo das 50 previstas. Esse valor ainda precisa ser confirmado em novos ciclos."
  ]
 },
 {
  "title": "Atendimento aos objetivos",
  "time": 75,
  "notes": [
   "Retomando os objetivos, os seis apresentaram evidências de atendimento. Os requisitos viraram contratos das quatro fontes. A base é rastreável e pode ser reconstruída pela Bronze. A preparação foi automatizada para vetor, raster e ponto. A manutenção foi verificada nos sete cenários. A interface está integrada à API com autenticação. E os dados estão disponíveis por reporting e GeoServer.",
   "Esse atendimento vale para as condições ensaiadas. Ele não equivale a uma validação ampla de usabilidade, segurança ou impacto no trabalho dos pesquisadores."
  ]
 },
 {
  "title": "Limitações e trabalhos futuros",
  "time": 85,
  "notes": [
   "As limitações delimitam as conclusões. A avaliação com a equipe foi preliminar: seis participantes por videochamada e três no laboratório. Houve interesse, mas a redução do retrabalho ainda não foi medida.",
   "Na modelagem, as relações do PRODES, Alerta e FIRMS com o interior da UC não guardam a versão geométrica. Isso só aparece quando a geometria de uma UC é substituída, o que não ocorreu nos dados apresentados. E os ensaios foram limitados a quatro usuários simultâneos, sem teste de intrusão.",
   "Daí vêm os trabalhos futuros: medir o efeito com a equipe, registrar a versão geométrica nas relações, implementar a troca automática dos dados NRT pelo SP no FIRMS e avaliar alta disponibilidade do banco."
  ]
 },
 {
  "title": "Considerações finais",
  "time": 90,
  "notes": [
   "Respondendo ao problema: o produto integra quatro fontes às 186 UCs e aos seus entornos, mantém o cadastro com versionamento e disponibiliza os resultados a ferramentas externas. O objetivo geral foi atendido nas condições de validação.",
   "Três decisões sustentaram isso. O manifesto imutável como entrada única, que liga cada alteração aos seus derivados. A idempotência em cada camada. E a separação entre armazenamento e processamento, que permitiu operar publicamente com custo conhecido.",
   "Com o produto, a preparação deixa de ser refeita a cada estudo. Uma alteração no cadastro reprocessa a série histórica, e o tempo dos pesquisadores pode ir para a análise das pressões sobre as áreas protegidas. O código é aberto e pode ser estendido a novas áreas ou temas."
  ]
 },
 {
  "title": "Agradecimentos e perguntas",
  "time": 20,
  "notes": [
   "Agradeço à banca pela leitura atenta, ao meu orientador e à equipe do projeto Unidades de Conservação é Preciso. Fico à disposição para as perguntas.",
   "(Arguição: ouvir com atenção, agradecer as sugestões e não discutir. Os slides de apoio A1 a A8 estão no menu.)"
  ]
 }
];
window.ROTEIRO_APENDICE = [
 [
  "Slide de apoio. As linhas destacadas são as fontes escolhidas. As demais serviram de referência."
 ],
 [
  "Slide de apoio para perguntas sobre persistência e cardinalidades."
 ],
 [
  "Slide de apoio. Cadastro, entorno, quatro temas, aquisição histórica, publicação e retenção."
 ],
 [
  "Slide de apoio para perguntas sobre qualidade, idempotência e rastreabilidade."
 ],
 [
  "Slide de apoio. O despachante da API reenvia importações pendentes a cada 60 segundos até o Airflow aceitar."
 ],
 [
  "Slide de apoio. us-east-1, Single-AZ, sem NAT Gateway, sem tributos. S3 (0,90) e imagens, logs e alertas (0,90) somados na última linha."
 ],
 [
  "Slide de apoio para perguntas sobre desempenho."
 ],
 [
  "Slide de apoio. Exemplo de consumo dos dados preparados por uma ferramenta de BI."
 ]
];
