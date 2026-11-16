const estado = {
  config: null,
  campaigns: [],
  ngos: [],
  reports: [],
  stats: {},
  selectedLocation: { lat: -28.4806, lng: -49.0064 },
  map: null,
  mapaInterativoAtivo: false,
  selectedMarker: null,
  reportMarkers: [],
  fallbackMarkers: [],
  user: null,
  token: lerArmazenamento("petconnect:token")
};

const elementos = {};

document.addEventListener("DOMContentLoaded", async () => {
  vincularElementos();
  vincularEventosInterface();
  await restaurarSessao();
  await carregarPainel();
  await carregarMapa();
  conectarEventos();
});

function vincularElementos() {
  elementos.campaignGrid = document.querySelector("#campaignGrid");
  elementos.ngoGrid = document.querySelector("#ngoGrid");
  elementos.reportList = document.querySelector("#reportList");
  elementos.heroStats = document.querySelector("#heroStats");
  elementos.mapCanvas = document.querySelector("#mapCanvas");
  elementos.mapStatus = document.querySelector("#mapStatus");
  elementos.selectedLat = document.querySelector("#selectedLat");
  elementos.selectedLng = document.querySelector("#selectedLng");
  elementos.reportForm = document.querySelector("#reportForm");
  elementos.donationModal = document.querySelector("#donationModal");
  elementos.donationForm = document.querySelector("#donationForm");
  elementos.donationTitle = document.querySelector("#donationTitle");
  elementos.donationType = document.querySelector("#donationType");
  elementos.moneyField = document.querySelector("#moneyField");
  elementos.foodField = document.querySelector("#foodField");
  elementos.loginModal = document.querySelector("#loginModal");
  elementos.loginButton = document.querySelector("#loginButton");
  elementos.logoutButton = document.querySelector("#logoutButton");
  elementos.visitorLoginForm = document.querySelector("#visitorLoginForm");
  elementos.ngoLoginForm = document.querySelector("#ngoLoginForm");
  elementos.ngoLoginError = document.querySelector("#ngoLoginError");
  elementos.newCampaignButton = document.querySelector("#newCampaignButton");
  elementos.campaignModal = document.querySelector("#campaignModal");
  elementos.campaignForm = document.querySelector("#campaignForm");
  elementos.campaignError = document.querySelector("#campaignError");
  elementos.campaignDetailModal = document.querySelector("#campaignDetailModal");
  elementos.campaignDetailContent = document.querySelector("#campaignDetailContent");
  elementos.volunteerForm = document.querySelector("#volunteerForm");
  elementos.toastStack = document.querySelector("#toastStack");
}

function vincularEventosInterface() {
  elementos.loginButton.addEventListener("click", () => {
    if (!estado.user) {
      elementos.loginModal.showModal();
    }
  });
  elementos.logoutButton.addEventListener("click", sair);
  elementos.visitorLoginForm.addEventListener("submit", entrarComoVisitante);
  elementos.ngoLoginForm.addEventListener("submit", entrarComoOng);
  elementos.newCampaignButton.addEventListener("click", () => {
    elementos.campaignError.hidden = true;
    elementos.campaignModal.showModal();
  });
  elementos.campaignForm.addEventListener("submit", abrirCampanha);

  document.querySelectorAll("[data-login-tab]").forEach((aba) => {
    aba.addEventListener("click", () => selecionarAbaLogin(aba.dataset.loginTab));
  });

  elementos.reportForm.addEventListener("submit", enviarDenuncia);
  elementos.donationForm.addEventListener("submit", enviarDoacao);
  elementos.volunteerForm.addEventListener("submit", enviarVoluntariado);

  document.querySelectorAll("[data-close]").forEach((botao) => {
    botao.addEventListener("click", () => {
      document.querySelector(`#${botao.dataset.close}`).close();
    });
  });

  elementos.donationType.addEventListener("change", () => {
    const doacaoAlimento = elementos.donationType.value === "food";
    elementos.moneyField.hidden = doacaoAlimento;
    elementos.foodField.hidden = !doacaoAlimento;
  });
}

async function carregarPainel() {
  const dados = await buscarJson("/api/dashboard");
  estado.campaigns = dados.campaigns;
  estado.ngos = dados.ngos;
  estado.reports = dados.reports;
  estado.stats = dados.stats;
  renderizarTudo();
}

async function carregarMapa() {
  estado.config = await buscarJson("/api/config");
  definirLocalSelecionado(estado.config.defaultCenter);

  if (!window.L) {
    exibirAlerta("Leaflet não carregou. Usando mapa local.");
    iniciarMapaAlternativo();
    return;
  }

  iniciarMapaLeaflet();
}

function iniciarMapaLeaflet() {
  elementos.mapCanvas.innerHTML = "";
  elementos.mapCanvas.removeEventListener("click", tratarCliqueMapaAlternativo);

  estado.map = L.map(elementos.mapCanvas, {
    zoomControl: true,
    scrollWheelZoom: true
  }).setView([estado.selectedLocation.lat, estado.selectedLocation.lng], estado.config.zoomInicial || 13);

  L.tileLayer(estado.config.urlTiles, {
    maxZoom: 19,
    attribution: estado.config.atribuicao
  }).addTo(estado.map);

  estado.mapaInterativoAtivo = true;
  estado.map.on("click", (evento) => {
    definirLocalSelecionado(evento.latlng);
  });

  renderizarMarcadoresLeaflet();
  elementos.mapStatus.textContent = "Leaflet + OpenStreetMap ativo.";
}

function iniciarMapaAlternativo() {
  estado.reportMarkers.forEach((marcador) => {
    marcador.remove?.();
  });
  estado.reportMarkers = [];
  if (estado.selectedMarker) {
    estado.selectedMarker.remove?.();
  }

  if (estado.map) {
    estado.map.remove?.();
  }
  estado.map = null;
  estado.selectedMarker = null;
  estado.mapaInterativoAtivo = false;
  elementos.mapCanvas.innerHTML = "";
  elementos.mapCanvas.removeEventListener("click", tratarCliqueMapaAlternativo);
  elementos.mapCanvas.addEventListener("click", tratarCliqueMapaAlternativo);
  elementos.mapStatus.textContent = "Mapa local ativo.";
  renderizarMarcadoresAlternativos();
}

function tratarCliqueMapaAlternativo(evento) {
  if (estado.map) {
    return;
  }

  const retangulo = elementos.mapCanvas.getBoundingClientRect();
  const x = (evento.clientX - retangulo.left) / retangulo.width;
  const y = (evento.clientY - retangulo.top) / retangulo.height;
  const lat = estado.config.defaultCenter.lat + (0.5 - y) * 0.05;
  const lng = estado.config.defaultCenter.lng + (x - 0.5) * 0.06;
  definirLocalSelecionado({ lat, lng });
}

function definirLocalSelecionado(localizacao) {
  estado.selectedLocation = {
    lat: Number(localizacao.lat),
    lng: Number(localizacao.lng)
  };

  elementos.selectedLat.textContent = estado.selectedLocation.lat.toFixed(5);
  elementos.selectedLng.textContent = estado.selectedLocation.lng.toFixed(5);

  if (estado.mapaInterativoAtivo) {
    renderizarMarcadorSelecionadoLeaflet();
  } else if (elementos.mapCanvas) {
    renderizarMarcadoresAlternativos();
  }
}

function renderizarTudo() {
  renderizarEstatisticas();
  renderizarCampanhas();
  renderizarOngs();
  renderizarDenuncias();

  if (estado.mapaInterativoAtivo) {
    renderizarMarcadoresLeaflet();
  } else if (elementos.mapCanvas) {
    renderizarMarcadoresAlternativos();
  }
}

function renderizarEstatisticas() {
  const stats = [
    [estado.stats.animalsHelped || 0, "Animais ajudados"],
    [estado.stats.activeNgos || 0, "ONGs locais"],
    [estado.stats.donors || 0, "Apoiadores"]
  ];

  elementos.heroStats.innerHTML = stats
    .map(
      ([valor, label]) => `
        <div>
          <dt>${valor}</dt>
          <dd>${label}</dd>
        </div>
      `
    )
    .join("");
}

function renderizarCampanhas() {
  elementos.campaignGrid.innerHTML = estado.campaigns
    .map((campanha) => {
      const porcentagem = Math.min(Math.round((campanha.raised / campanha.target) * 100), 100);
      return `
        <article class="campaign-card">
          <img class="card-image clickable" src="${escaparHtml(campanha.imageUrl)}" alt="${escaparHtml(campanha.title)}" data-details="${campanha.id}" />
          <div class="card-body">
            <h3>${escaparHtml(campanha.title)}</h3>
            <p>${escaparHtml(campanha.description)}</p>
            <div class="card-meta">
              <span>${escaparHtml(campanha.ngoName)}</span>
              <strong>R$ ${formatarMoeda(campanha.raised)}</strong>
            </div>
            <div class="progress-track" aria-label="Progresso da campanha">
              <div class="progress-fill" style="width: ${porcentagem}%"></div>
            </div>
            <div class="card-meta">
              <span>${campanha.supporters} apoiadores</span>
              <span>Meta R$ ${formatarMoeda(campanha.target)}</span>
            </div>
            <div class="card-actions">
              <button class="ghost-button" type="button" data-details="${campanha.id}">
                Ver detalhes
              </button>
              <button class="primary-button" type="button" data-donate="${campanha.id}">
                Apoiar
              </button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  document.querySelectorAll("[data-donate]").forEach((botao) => {
    botao.addEventListener("click", () => abrirModalDoacao(botao.dataset.donate));
  });
  document.querySelectorAll("[data-details]").forEach((elemento) => {
    elemento.addEventListener("click", () => abrirDetalhesCampanha(elemento.dataset.details));
  });
}

function renderizarOngs() {
  elementos.ngoGrid.innerHTML = estado.ngos
    .map(
      (ngo) => `
        <article class="ngo-card">
          <img class="card-image" src="${ngo.imageUrl}" alt="${escaparHtml(ngo.name)}" />
          <div class="card-body">
            <h3>${escaparHtml(ngo.name)}</h3>
            <p>${escaparHtml(ngo.about)}</p>
            <div class="chip-row">
              <span class="chip">${ngo.animalsHelped} animais</span>
              <span class="chip">${ngo.volunteers} voluntários</span>
              <span class="chip">${ngo.activeCampaigns} campanhas</span>
            </div>
          </div>
        </article>
      `
    )
    .join("");
}

function renderizarDenuncias() {
  elementos.reportList.innerHTML = estado.reports
    .slice(0, 6)
    .map(
      (denuncia) => `
        <article class="report-item">
          <div class="chip-row">
            <span class="chip ${denuncia.urgency === "Alta" ? "urgent" : ""}">${escaparHtml(denuncia.urgency)}</span>
            <span>${tempoDecorrido(denuncia.createdAt)}</span>
          </div>
          <h3>${escaparHtml(denuncia.title)}</h3>
          <p>${escaparHtml(denuncia.description)}</p>
          <div class="card-meta">
            <span>${escaparHtml(denuncia.address)}</span>
            <strong>${escaparHtml(denuncia.status)}</strong>
          </div>
        </article>
      `
    )
    .join("");
}

function renderizarMarcadoresLeaflet() {
  if (!estado.mapaInterativoAtivo) {
    return;
  }

  estado.reportMarkers.forEach((marcador) => {
    marcador.remove();
  });
  estado.reportMarkers = [];

  for (const denuncia of estado.reports) {
    const marcador = L.marker([denuncia.lat, denuncia.lng], {
      title: denuncia.title
    }).addTo(estado.map);

    marcador.bindPopup(`
      <strong>${escaparHtml(denuncia.title)}</strong><br />
      ${escaparHtml(denuncia.address)}<br />
      Urgência: ${escaparHtml(denuncia.urgency)}
    `);
    marcador.on("click", () => {
      exibirAlerta(`${denuncia.title} - ${denuncia.address}`);
    });
    estado.reportMarkers.push(marcador);
  }

  renderizarMarcadorSelecionadoLeaflet();
}

function renderizarMarcadorSelecionadoLeaflet() {
  if (!estado.mapaInterativoAtivo) {
    return;
  }

  if (estado.selectedMarker) {
    estado.selectedMarker.setLatLng([estado.selectedLocation.lat, estado.selectedLocation.lng]);
    return;
  }

  estado.selectedMarker = L.marker([estado.selectedLocation.lat, estado.selectedLocation.lng], {
    draggable: true,
    title: "Local selecionado",
    zIndexOffset: 1000
  }).addTo(estado.map);

  estado.selectedMarker.bindPopup("Local selecionado para a denúncia");
  estado.selectedMarker.on("dragend", () => {
    definirLocalSelecionado(estado.selectedMarker.getLatLng());
  });
}

function renderizarMarcadoresAlternativos() {
  if (!elementos.mapCanvas || estado.mapaInterativoAtivo) {
    return;
  }

  elementos.mapCanvas.innerHTML = "";
  const marcadores = [
    ...estado.reports.map((denuncia) => ({ ...denuncia, selected: false })),
    {
      lat: estado.selectedLocation.lat,
      lng: estado.selectedLocation.lng,
      title: "Local selecionado",
      selected: true
    }
  ];

  for (const marcador of marcadores) {
    const ponto = document.createElement("button");
    ponto.type = "button";
    ponto.className = `fallback-marker${marcador.selected ? " selected" : ""}`;
    ponto.style.left = `${calcularXAlternativo(marcador.lng)}%`;
    ponto.style.top = `${calcularYAlternativo(marcador.lat)}%`;
    ponto.title = marcador.title;
    ponto.setAttribute("aria-label", marcador.title);
    ponto.addEventListener("click", (evento) => {
      evento.stopPropagation();
      definirLocalSelecionado({ lat: marcador.lat, lng: marcador.lng });
      exibirAlerta(marcador.title);
    });
    elementos.mapCanvas.appendChild(ponto);
  }
}

function calcularXAlternativo(lng) {
  const centro = estado.config?.defaultCenter || { lng: -49.0064 };
  return limitar(50 + ((lng - centro.lng) / 0.06) * 100, 4, 96);
}

function calcularYAlternativo(lat) {
  const centro = estado.config?.defaultCenter || { lat: -28.4806 };
  return limitar(50 - ((lat - centro.lat) / 0.05) * 100, 4, 96);
}

async function enviarDenuncia(evento) {
  evento.preventDefault();
  const formulario = new FormData(elementos.reportForm);
  const denuncia = await buscarJson("/api/reports", {
    method: "POST",
    body: JSON.stringify({
      title: formulario.get("title"),
      description: formulario.get("description"),
      urgency: formulario.get("urgency"),
      address: formulario.get("address"),
      reporterName: estado.user?.name || "Visitante solidário",
      lat: estado.selectedLocation.lat,
      lng: estado.selectedLocation.lng
    })
  });

  if (!estado.reports.some((item) => item.id === denuncia.id)) {
    estado.reports.unshift(denuncia);
  }
  estado.stats.activeReports = (estado.stats.activeReports || 0) + 1;
  renderizarTudo();
  exibirAlerta("Denúncia enviada e alerta disparado.");
}

function abrirModalDoacao(campaignId) {
  const campanha = estado.campaigns.find((item) => item.id === campaignId);
  if (!campanha) {
    return;
  }

  elementos.donationTitle.textContent = `Apoiar ${campanha.title}`;
  elementos.donationForm.elements.campaignId.value = campaignId;
  elementos.donationForm.elements.donorName.value = estado.user?.name || "Doador PetConnect";
  elementos.donationModal.showModal();
}

async function enviarDoacao(evento) {
  evento.preventDefault();
  const formulario = new FormData(elementos.donationForm);
  const resultado = await buscarJson("/api/donations", {
    method: "POST",
    body: JSON.stringify({
      campaignId: formulario.get("campaignId"),
      donorName: formulario.get("donorName"),
      type: formulario.get("type"),
      amount: Number(formulario.get("amount")),
      foodDescription: formulario.get("foodDescription")
    })
  });

  estado.campaigns = estado.campaigns.map((item) =>
    item.id === resultado.campaign.id ? resultado.campaign : item
  );
  estado.stats.donors = estado.campaigns.reduce((total, item) => total + item.supporters, 0);
  renderizarEstatisticas();
  renderizarCampanhas();
  elementos.donationModal.close();
  exibirAlerta("Apoio registrado com sucesso.");
}

async function enviarVoluntariado(evento) {
  evento.preventDefault();
  const formulario = new FormData(elementos.volunteerForm);
  await buscarJson("/api/volunteer-applications", {
    method: "POST",
    body: JSON.stringify({
      name: formulario.get("name"),
      email: formulario.get("email"),
      role: formulario.get("role")
    })
  });

  elementos.volunteerForm.reset();
  exibirAlerta("Candidatura enviada para análise.");
}

function conectarEventos() {
  const fluxo = new EventSource("/api/events");

  fluxo.addEventListener("report-created", (evento) => {
    const conteudo = JSON.parse(evento.data);
    if (!estado.reports.some((denuncia) => denuncia.id === conteudo.report.id)) {
      estado.reports.unshift(conteudo.report);
      renderizarTudo();
    }
    exibirAlerta(conteudo.message);
  });

  fluxo.addEventListener("donation-created", (evento) => {
    const conteudo = JSON.parse(evento.data);
    estado.campaigns = estado.campaigns.map((item) =>
      item.id === conteudo.campaign.id ? conteudo.campaign : item
    );
    estado.stats.donors = estado.campaigns.reduce((total, item) => total + item.supporters, 0);
    renderizarEstatisticas();
    renderizarCampanhas();
    exibirAlerta(conteudo.message);
  });

  fluxo.addEventListener("campaign-created", (evento) => {
    const conteudo = JSON.parse(evento.data);
    adicionarCampanha(conteudo.campaign);
    exibirAlerta(conteudo.message);
  });

  fluxo.addEventListener("volunteer-created", (evento) => {
    const conteudo = JSON.parse(evento.data);
    exibirAlerta(conteudo.message);
  });

  fluxo.onerror = () => {
    console.warn("Conexão de eventos em pausa.");
  };
}

async function buscarJson(url, opcoes = {}) {
  const resposta = await fetch(url, {
    ...opcoes,
    headers: {
      "Content-Type": "application/json",
      ...(estado.token ? { Authorization: `Bearer ${estado.token}` } : {}),
      ...(opcoes.headers || {})
    }
  });

  const dados = await resposta.json();
  if (!resposta.ok) {
    throw new Error(dados.error || "Erro de comunicação com a API.");
  }

  return dados;
}

function atualizarBotaoLogin() {
  const ehOng = estado.user?.type === "ong";
  elementos.loginButton.textContent = estado.user
    ? `${ehOng ? "ONG: " : ""}${estado.user.name}`
    : "Entrar";
  elementos.loginButton.classList.toggle("session-name", Boolean(estado.user));
  elementos.logoutButton.hidden = !estado.user;
  elementos.newCampaignButton.hidden = !ehOng;
}

function lerArmazenamento(chave) {
  try {
    return localStorage.getItem(chave);
  } catch {
    return null;
  }
}

function salvarSessao(token) {
  estado.token = token;
  try {
    if (token) {
      localStorage.setItem("petconnect:token", token);
    } else {
      localStorage.removeItem("petconnect:token");
    }
  } catch {
    // Sem armazenamento local a sessão dura apenas até recarregar a página.
  }
}

async function restaurarSessao() {
  if (estado.token) {
    try {
      estado.user = (await buscarJson("/api/auth/me")).user;
    } catch {
      salvarSessao(null);
    }
  }

  atualizarBotaoLogin();
}

function selecionarAbaLogin(aba) {
  document.querySelectorAll("[data-login-tab]").forEach((botao) => {
    botao.classList.toggle("active", botao.dataset.loginTab === aba);
  });
  document.querySelectorAll("[data-login-panel]").forEach((painel) => {
    painel.hidden = painel.dataset.loginPanel !== aba;
  });
}

function concluirLogin(resultado) {
  salvarSessao(resultado.token);
  estado.user = resultado.user;
  atualizarBotaoLogin();
  elementos.loginModal.close();
  exibirAlerta(
    resultado.user.type === "ong"
      ? `Olá, ${resultado.user.name}. Você já pode abrir campanhas.`
      : `Olá, ${resultado.user.name}. Alertas ativados.`
  );
}

async function entrarComoVisitante(evento) {
  evento.preventDefault();
  const formulario = new FormData(elementos.visitorLoginForm);

  try {
    concluirLogin(
      await buscarJson("/api/auth/visitor", {
        method: "POST",
        body: JSON.stringify({ name: formulario.get("name") })
      })
    );
  } catch (erro) {
    exibirAlerta(erro.message);
  }
}

async function entrarComoOng(evento) {
  evento.preventDefault();
  const formulario = new FormData(elementos.ngoLoginForm);
  elementos.ngoLoginError.hidden = true;

  try {
    concluirLogin(
      await buscarJson("/api/auth/ngo", {
        method: "POST",
        body: JSON.stringify({
          email: formulario.get("email"),
          password: formulario.get("password")
        })
      })
    );
    elementos.ngoLoginForm.reset();
  } catch (erro) {
    elementos.ngoLoginError.textContent = erro.message;
    elementos.ngoLoginError.hidden = false;
  }
}

async function sair() {
  try {
    await buscarJson("/api/auth/logout", { method: "POST" });
  } catch {
    // Mesmo sem resposta do servidor a sessão local é encerrada.
  }

  salvarSessao(null);
  estado.user = null;
  atualizarBotaoLogin();
  exibirAlerta("Você saiu da sua conta.");
}

async function abrirCampanha(evento) {
  evento.preventDefault();
  const formulario = new FormData(elementos.campaignForm);
  elementos.campaignError.hidden = true;

  try {
    const campanha = await buscarJson("/api/campaigns", {
      method: "POST",
      body: JSON.stringify({
        title: formulario.get("title"),
        description: formulario.get("description"),
        details: formulario.get("details"),
        target: Number(formulario.get("target")),
        imageUrl: formulario.get("imageUrl")
      })
    });

    adicionarCampanha(campanha);
    elementos.campaignForm.reset();
    elementos.campaignModal.close();
    exibirAlerta("Campanha publicada.");
    abrirDetalhesCampanha(campanha.id);
  } catch (erro) {
    elementos.campaignError.textContent = erro.message;
    elementos.campaignError.hidden = false;
  }
}

function adicionarCampanha(campanha) {
  if (estado.campaigns.some((item) => item.id === campanha.id)) {
    return;
  }

  estado.campaigns.unshift(campanha);
  const ong = estado.ngos.find((item) => item.id === campanha.ngoId);
  if (ong) {
    ong.activeCampaigns += 1;
  }
  renderizarCampanhas();
  renderizarOngs();
}

async function abrirDetalhesCampanha(campaignId) {
  try {
    const detalhe = await buscarJson(`/api/campaigns/${encodeURIComponent(campaignId)}`);
    renderizarDetalhesCampanha(detalhe);
    if (!elementos.campaignDetailModal.open) {
      elementos.campaignDetailModal.showModal();
    }
  } catch (erro) {
    exibirAlerta(erro.message);
  }
}

function renderizarDetalhesCampanha({ campaign, ngo, recentDonations }) {
  const porcentagem = Math.min(Math.round((campaign.raised / campaign.target) * 100), 100);
  const paragrafos = (campaign.details || campaign.description)
    .split(/\n{2,}/)
    .map((texto) => `<p>${escaparHtml(texto).replaceAll("\n", "<br />")}</p>`)
    .join("");
  const doacoes = recentDonations.length
    ? recentDonations
        .map(
          (doacao) => `
            <li>
              <span>${escaparHtml(doacao.donorName)}</span>
              <strong>${
                doacao.type === "money"
                  ? `R$ ${formatarMoeda(doacao.amount)}`
                  : escaparHtml(doacao.foodDescription || "Doação de alimento")
              }</strong>
              <small>${tempoDecorrido(doacao.createdAt)}</small>
            </li>`
        )
        .join("")
    : '<li class="empty">Ainda não há apoios registrados. Seja o primeiro!</li>';

  elementos.campaignDetailContent.innerHTML = `
    <img class="detail-image" src="${escaparHtml(campaign.imageUrl)}" alt="${escaparHtml(campaign.title)}" />
    <span class="eyebrow">Campanha de ${escaparHtml(campaign.ngoName)}</span>
    <h3>${escaparHtml(campaign.title)}</h3>
    <p class="detail-summary">${escaparHtml(campaign.description)}</p>
    <div class="progress-track" aria-label="Progresso da campanha">
      <div class="progress-fill" style="width: ${porcentagem}%"></div>
    </div>
    <dl class="detail-stats">
      <div><dt>R$ ${formatarMoeda(campaign.raised)}</dt><dd>arrecadados (${porcentagem}%)</dd></div>
      <div><dt>R$ ${formatarMoeda(campaign.target)}</dt><dd>meta</dd></div>
      <div><dt>${campaign.supporters}</dt><dd>apoiadores</dd></div>
      <div><dt>${campaign.donations}</dt><dd>doações</dd></div>
    </dl>
    <h4>Sobre a campanha</h4>
    <div class="detail-text">${paragrafos}</div>
    <h4>Quem está cuidando</h4>
    <div class="detail-ngo">
      <img src="${escaparHtml(ngo.imageUrl)}" alt="" />
      <div>
        <strong>${escaparHtml(ngo.name)}</strong>
        <span>${escaparHtml(ngo.city)}</span>
        <p>${escaparHtml(ngo.about)}</p>
      </div>
    </div>
    <h4>Apoios recentes</h4>
    <ul class="donation-list">${doacoes}</ul>
    <button class="primary-button full-button" type="button" id="detailDonateButton">
      Apoiar esta campanha
    </button>
  `;

  document.querySelector("#detailDonateButton").addEventListener("click", () => {
    elementos.campaignDetailModal.close();
    abrirModalDoacao(campaign.id);
  });
}

function exibirAlerta(mensagem) {
  const alerta = document.createElement("div");
  alerta.className = "toast";
  alerta.innerHTML = `
    <span>${escaparHtml(mensagem)}</span>
    <button type="button" aria-label="Fechar">×</button>
  `;
  alerta.querySelector("button").addEventListener("click", () => alerta.remove());
  elementos.toastStack.appendChild(alerta);
  setTimeout(() => alerta.remove(), 5200);
}

function formatarMoeda(valor) {
  return Number(valor).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

function tempoDecorrido(data) {
  const diferenca = Date.now() - new Date(data).getTime();
  const minutos = Math.max(1, Math.round(diferenca / 60000));

  if (minutos < 60) {
    return `${minutos} min`;
  }

  const horas = Math.round(minutos / 60);
  return `${horas} h`;
}

function escaparHtml(valor) {
  return String(valor)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function limitar(valor, minimo, maximo) {
  return Math.min(Math.max(valor, minimo), maximo);
}
