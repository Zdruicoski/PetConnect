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
  user: JSON.parse(localStorage.getItem("petconnect:user") || "null")
};

const elementos = {};

document.addEventListener("DOMContentLoaded", async () => {
  vincularElementos();
  vincularEventosInterface();
  atualizarBotaoLogin();
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
  elementos.loginForm = document.querySelector("#loginForm");
  elementos.loginButton = document.querySelector("#loginButton");
  elementos.volunteerForm = document.querySelector("#volunteerForm");
  elementos.toastStack = document.querySelector("#toastStack");
}

function vincularEventosInterface() {
  elementos.loginButton.addEventListener("click", () => {
    elementos.loginModal.showModal();
  });

  elementos.loginForm.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const formulario = new FormData(elementos.loginForm);
    estado.user = { name: formulario.get("name") || "Visitante solidário" };
    localStorage.setItem("petconnect:user", JSON.stringify(estado.user));
    atualizarBotaoLogin();
    elementos.loginModal.close();
    exibirAlerta(`Olá, ${estado.user.name}. Alertas ativados.`);
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
          <img class="card-image" src="${campanha.imageUrl}" alt="${escaparHtml(campanha.title)}" />
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
            <button class="primary-button full-button" type="button" data-donate="${campanha.id}">
              Apoiar
            </button>
          </div>
        </article>
      `;
    })
    .join("");

  document.querySelectorAll("[data-donate]").forEach((botao) => {
    botao.addEventListener("click", () => abrirModalDoacao(botao.dataset.donate));
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
    headers: {
      "Content-Type": "application/json",
      ...(opcoes.headers || {})
    },
    ...opcoes
  });

  const dados = await resposta.json();
  if (!resposta.ok) {
    throw new Error(dados.error || "Erro de comunicação com a API.");
  }

  return dados;
}

function atualizarBotaoLogin() {
  elementos.loginButton.textContent = estado.user ? estado.user.name : "Entrar";
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
