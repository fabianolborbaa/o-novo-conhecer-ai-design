const loadingScreens = document.querySelectorAll(".is-loading");

window.addEventListener("load", () => {
  window.setTimeout(() => {
    loadingScreens.forEach((screen) => screen.classList.remove("is-loading"));
  }, 850);
});

const propertySheet = document.querySelector("#property-sheet");
const sheetHandle = propertySheet?.querySelector(".sheet-drag-handle");

if (propertySheet && sheetHandle) {
  let startY = 0;
  let currentY = 0;
  let dragging = false;

  const setExpanded = (expanded) => {
    propertySheet.classList.toggle("sheet-expanded", expanded);
    propertySheet.closest(".results-phone")?.classList.toggle("sheet-is-expanded", expanded);
    sheetHandle.setAttribute("aria-expanded", String(expanded));
  };

  setExpanded(false);

  const finishDrag = () => {
    if (!dragging) return;
    const delta = currentY - startY;
    dragging = false;

    if (delta < -32) setExpanded(true);
    if (delta > 32) setExpanded(false);
  };

  sheetHandle.addEventListener("pointerdown", (event) => {
    dragging = true;
    startY = event.clientY;
    currentY = event.clientY;
    sheetHandle.setPointerCapture(event.pointerId);
  });

  sheetHandle.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    currentY = event.clientY;
  });

  sheetHandle.addEventListener("pointerup", finishDrag);
  sheetHandle.addEventListener("pointercancel", finishDrag);
}

document.querySelectorAll("[data-detail-link]").forEach((card) => {
  card.addEventListener("click", (event) => {
    if (event.target.closest("button") || event.target.closest("a")) return;
    window.location.href = card.dataset.detailLink;
  });
});

const galleryOverlay = document.querySelector("#gallery-overlay");
const galleryThumbs = Array.from(document.querySelectorAll(".gallery-grid img"));

if (galleryOverlay && galleryThumbs.length) {
  const phoneShell = galleryOverlay.closest(".phone-shell");
  const overlayImage = galleryOverlay.querySelector("[data-gallery-image]");
  const overlayTitle = galleryOverlay.querySelector("[data-gallery-title]");
  const overlayDescription = galleryOverlay.querySelector("[data-gallery-description]");
  const progress = galleryOverlay.querySelector("[data-story-progress]");
  const closeButton = galleryOverlay.querySelector(".gallery-close");
  const prevButton = galleryOverlay.querySelector(".gallery-prev");
  const nextButton = galleryOverlay.querySelector(".gallery-next");
  const photos = galleryThumbs.map((image) => ({
    src: image.currentSrc || image.src,
    title: image.dataset.title || "Detalhe do condomínio:",
    description: image.dataset.description || "",
  }));
  let activePhoto = 0;
  let dragStartX = 0;

  progress.innerHTML = photos.map(() => "<span></span>").join("");
  const progressItems = Array.from(progress.querySelectorAll("span"));

  const renderPhoto = () => {
    const photo = photos[activePhoto];
    overlayImage.src = photo.src;
    overlayTitle.textContent = photo.title;
    overlayDescription.textContent = photo.description;

    progressItems.forEach((item, index) => {
      item.classList.toggle("is-seen", index < activePhoto);
      item.classList.toggle("is-active", index === activePhoto);
    });
  };

  const openGallery = (index) => {
    activePhoto = index;
    renderPhoto();
    galleryOverlay.classList.remove("is-closing");
    galleryOverlay.classList.add("is-open");
    galleryOverlay.setAttribute("aria-hidden", "false");
    phoneShell?.classList.add("gallery-open");
  };

  const closeGallery = () => {
    if (!galleryOverlay.classList.contains("is-open")) return;
    galleryOverlay.classList.remove("is-open");
    galleryOverlay.classList.add("is-closing");
    window.setTimeout(() => {
      galleryOverlay.classList.remove("is-closing");
      galleryOverlay.setAttribute("aria-hidden", "true");
      phoneShell?.classList.remove("gallery-open");
    }, 190);
  };

  const showPhoto = (direction) => {
    activePhoto = (activePhoto + direction + photos.length) % photos.length;
    renderPhoto();
  };

  galleryThumbs.forEach((image, index) => {
    image.addEventListener("click", () => openGallery(index));
  });

  closeButton?.addEventListener("click", closeGallery);
  prevButton?.addEventListener("click", () => showPhoto(-1));
  nextButton?.addEventListener("click", () => showPhoto(1));

  galleryOverlay.addEventListener("pointerdown", (event) => {
    dragStartX = event.clientX;
  });

  galleryOverlay.addEventListener("pointerup", (event) => {
    const delta = event.clientX - dragStartX;
    if (Math.abs(delta) < 42) return;
    showPhoto(delta < 0 ? 1 : -1);
  });

  window.addEventListener("keydown", (event) => {
    if (!galleryOverlay.classList.contains("is-open")) return;
    if (event.key === "Escape") closeGallery();
    if (event.key === "ArrowLeft") showPhoto(-1);
    if (event.key === "ArrowRight") showPhoto(1);
  });
}

const financeOverlay = document.querySelector("#finance-overlay");
const financeContent = financeOverlay?.querySelector("[data-finance-content]");
const financeOpenButton = document.querySelector("[data-finance-open]");
const visitOpenButton = document.querySelector("[data-visit-open]");

if (financeOverlay && financeContent && (financeOpenButton || visitOpenButton)) {
  const phoneShell = financeOverlay.closest(".phone-shell");
  const totalFinanceSteps = 6;
  let financeStep = 0;
  let visitStep = 0;
  let visitDay = 17;
  let visitTime = "18:00";
  let selectedOption = "";
  let loadingTimer = null;

  const financeSteps = [
    {
      title: "Simule seu Financiamento Imobiliário",
      description:
        "Com a nossa simulação, você tem uma ideia das parcelas do seu financiamento e pode se preparar para realizar o sonho da casa própria.",
      fields: [
        ["Como você se chama?", "Digite seu nome e sobrenome"],
        ["Qual e-mail você mais usa?", "seuemail@email.com"],
        ["Qual o número do seu celular?", "(00) 90000 0000"],
        ["Qual é a renda mensal dos compradores?", "Digite a sua renda"],
      ],
    },
    {
      title: "Vai comprar com mais alguém?",
      description:
        "Some a sua renda a de outras pessoas e melhore o seu crédito. Mesmo que vocês não sejam parentes, podem conquistar um lar juntos!",
      options: ["Sim", "Não"],
    },
    {
      title: "Vai usar FGTS?",
      description:
        "Se você contribui há pelo menos 3 anos, use o FGTS para pagar uma parte do imóvel. Assim, você reduz o valor da entrada e pode até conseguir um desconto.",
      options: ["Sim", "Não"],
    },
    {
      title: "Qual o saldo total do seu FGTS atualmente?",
      description: "Consulte o saldo do seu FGTS no site da Caixa ou pelo APP FGTS.",
      fields: [["", "R$"]],
    },
    {
      title: "Qual a data de nascimento?",
      description: "Informe a data de nascimento da pessoa com mais idade que vai participar dessa conquista.",
      fields: [["", "dd/mm/aaaa"]],
    },
    {
      title: "Qual valor você pretende dar como entrada?",
      description:
        "O valor pago na entrada reduz o total do financiamento. Mas fique tranquilo, com a MRV, você pode conquistar seu lar mesmo se não tiver esse valor agora.",
      fields: [["", "R$"]],
    },
  ];

  const privacyText =
    'Suas informações serão armazenadas de acordo com a LGPD. Para mais informações, consulte nossa <span>Política de Privacidade.</span>';

  const progressMarkup = (step) =>
    Array.from({ length: totalFinanceSteps }, (_, index) => {
      const className = index < step ? "is-done" : index === step ? "is-active" : "";
      return `<span class="${className}"></span>`;
    }).join("");

  const fieldsMarkup = (fields) =>
    `<div class="finance-form">${fields
      .map(
        ([label, placeholder]) => `
          <div class="finance-field">
            ${label ? `<label>${label}</label>` : ""}
            <input type="text" placeholder="${placeholder}" />
          </div>
        `,
      )
      .join("")}</div>`;

  const optionsMarkup = (options) =>
    `<div class="finance-options">${options
      .map(
        (option) => `
          <button type="button" data-finance-option="${option}" class="${selectedOption === option ? "is-selected" : ""}">
            ${option}
          </button>
        `,
      )
      .join("")}</div>`;

  const footerMarkup = () => `
    <div class="finance-footer">
      <button class="finance-continue" type="button" data-finance-next>Continuar</button>
      <p class="finance-privacy">${privacyText}</p>
    </div>
  `;

  const renderFinanceStep = () => {
    selectedOption = "";
    const step = financeSteps[financeStep];
    financeContent.className = "finance-step is-entering";
    financeContent.innerHTML = `
      <div class="finance-panel">
        <div>
          <div class="finance-handle"></div>
          <div class="finance-progress">${progressMarkup(financeStep)}</div>
        </div>
        <div class="finance-copy">
          <h2>${step.title}</h2>
          <p>${step.description}</p>
        </div>
        ${step.fields ? fieldsMarkup(step.fields) : ""}
        ${step.options ? optionsMarkup(step.options) : ""}
      </div>
      ${footerMarkup()}
    `;
    window.setTimeout(() => financeContent.classList.remove("is-entering"), 260);
  };

  const renderFinanceLoading = () => {
    financeContent.className = "finance-step";
    financeContent.innerHTML = `
      <div class="finance-loading">
        <div>
          <img src="https://www.figma.com/api/mcp/asset/b2a6ec96-e408-4770-bd07-9b4a2ab2455e" alt="" />
          <h2>Calculando seu financiamento...</h2>
        </div>
      </div>
    `;
    loadingTimer = window.setTimeout(renderFinanceResult, 1200);
  };

  const renderFinanceResult = () => {
    financeContent.className = "finance-step is-entering";
    financeContent.innerHTML = `
      <div class="finance-result">
        <div class="finance-handle"></div>
        <div class="finance-copy">
          <h2>Sua simulação está pronta, Lucas!</h2>
          <p>Um novo mundo te espera e nós vamos te ajudar a conquistá-lo. Este é o valor aproximado da unidade que você escolheu.</p>
          <p>Fique à vontade para editar o valor do sinal e do FGTS.</p>
        </div>
        <article class="simulation-card">
          <div>
            <h3>Simulação</h3>
            <p class="simulation-value"><span>R$</span><span>532,21*</span></p>
            <p class="simulation-caption">Parcela MRV aproximada <span class="material-symbols-rounded">info</span></p>
            <p class="simulation-note">Este é um valor aproximado da sua primeira parcela de entrada</p>
          </div>
          <hr />
          <h3>Pagamento inicial</h3>
          <div class="simulation-payment">
            <div><strong>Sinal:</strong><span>R$ 3.200,00</span></div>
            <div><strong>FGTS:</strong><span>Não informado</span></div>
          </div>
          <button class="simulation-adjust" type="button" data-finance-adjust><span class="material-symbols-rounded">edit_note</span>Ajustar simulação</button>
        </article>
      </div>
      ${footerMarkup()}
    `;
    window.setTimeout(() => financeContent.classList.remove("is-entering"), 260);
  };

  const renderFinanceAdjust = () => {
    financeContent.className = "finance-step finance-adjust-step is-entering";
    financeContent.innerHTML = `
      <div class="finance-handle"></div>
      <article class="adjust-card">
        <div>
          <p class="adjust-kicker">Parcela MRV a partir de</p>
          <p class="simulation-value"><span>R$</span><span>532,21*</span></p>
        </div>
        <hr />
        <h2 class="adjust-title">Ajuste a sua simulação</h2>
        <p class="adjust-description">Personalize os valores como preferir<br />e salve para obter um valor aproximado</p>
        <div class="adjust-slider">
          <div class="adjust-slider-row">
            <label>FGTS <span class="material-symbols-rounded">info</span></label>
            <strong>R$ 5.971,00</strong>
          </div>
          <input type="range" min="0" max="100" value="12" aria-label="FGTS" />
        </div>
        <div class="adjust-slider">
          <div class="adjust-slider-row">
            <label>Sinal no ato <span class="material-symbols-rounded">info</span></label>
            <strong>R$ 1.450,00</strong>
          </div>
          <input type="range" min="0" max="100" value="8" aria-label="Sinal no ato" />
        </div>
      </article>
      <div class="finance-adjust-fields">
        <div class="finance-field">
          <label>Qual é a renda mensal dos compradores?</label>
          <input type="text" value="R$4.000,00" />
        </div>
        <div class="finance-field">
          <label>Vai comprar com mais alguém?</label>
          <input type="text" value="Não" />
        </div>
        <div class="finance-field">
          <label>Qual a sua data de nascimento?</label>
          <input type="text" value="22/11/1987" />
        </div>
      </div>
      <button class="finance-continue finance-save" type="button" data-finance-save>Salvar</button>
    `;
    window.setTimeout(() => financeContent.classList.remove("is-entering"), 260);
  };

  const visitDatesMarkup = () => {
    const days = ["", "", "", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", ""];
    return days
      .map((day) => {
        if (!day) return "<span></span>";
        const number = Number(day);
        const className = [
          number <= 5 ? "is-muted" : "",
          number === 6 ? "is-today" : "",
          number === visitDay ? "is-selected" : "",
        ]
          .filter(Boolean)
          .join(" ");
        return `<button type="button" class="${className}" data-visit-day="${number}">${day}</button>`;
      })
      .join("");
  };

  const visitTimesMarkup = (times) =>
    times
      .map(
        (time) => `
          <button type="button" data-visit-time="${time}" class="${visitTime === time ? "is-selected" : ""}">
            ${time}
          </button>
        `,
      )
      .join("");

  const renderVisitPersonal = () => {
    visitStep = 0;
    financeContent.className = "finance-step is-entering";
    financeContent.innerHTML = `
      <div class="finance-panel">
        <div>
          <div class="finance-handle"></div>
          <div class="finance-progress">${progressMarkup(0).replaceAll('class=""', "")}</div>
        </div>
        <div class="finance-copy">
          <h2>Agenda a visita do seu decorado</h2>
          <p>Com a nossa simulação, você tem uma ideia das parcelas do seu financiamento e pode se preparar para realizar o sonho da casa própria.</p>
        </div>
        ${fieldsMarkup([
          ["Como você se chama?", "Digite seu nome e sobrenome"],
          ["Qual e-mail você mais usa?", "seuemail@email.com"],
          ["Qual o número do seu celular?", "(00) 90000 0000"],
        ])}
      </div>
      ${footerMarkup()}
    `;
    financeContent.querySelector(".finance-progress").innerHTML = Array.from({ length: 3 }, (_, index) => `<span class="${index === 0 ? "is-active" : ""}"></span>`).join("");
    window.setTimeout(() => financeContent.classList.remove("is-entering"), 260);
  };

  const renderVisitCalendar = () => {
    visitStep = 1;
    financeContent.className = "finance-step is-entering";
    financeContent.innerHTML = `
      <div class="finance-panel">
        <div>
          <div class="finance-handle"></div>
          <div class="finance-progress">${Array.from({ length: 3 }, (_, index) => `<span class="${index < 1 ? "is-done" : index === 1 ? "is-active" : ""}"></span>`).join("")}</div>
        </div>
        <div class="finance-copy">
          <h2>Agenda a visita do seu decorado</h2>
        </div>
        <div class="visit-calendar">
          <div class="visit-calendar-card">
            <div class="visit-calendar-month">
              <strong>Março 2024 <span class="material-symbols-rounded">chevron_right</span></strong>
              <span><span class="material-symbols-rounded">chevron_left</span><span class="material-symbols-rounded">chevron_right</span></span>
            </div>
            <div class="visit-week"><span>DOM</span><span>SEG</span><span>TER</span><span>QUA</span><span>QUI</span><span>SEX</span><span>SÁB</span></div>
            <div class="visit-days">${visitDatesMarkup()}</div>
          </div>
          <div class="visit-times">${visitTimesMarkup(visitDay === 17 ? ["09:00", "11:00", "13:00", "14:00", "16:00", "18:00"] : ["10:00", "11:00", "13:00", "15:00", "16:00", "17:00", "18:00"])}</div>
        </div>
      </div>
      ${footerMarkup()}
    `;
    window.setTimeout(() => financeContent.classList.remove("is-entering"), 260);
  };

  const renderVisitConfirmation = () => {
    visitStep = 2;
    financeContent.className = "finance-step is-entering";
    financeContent.innerHTML = `
      <div class="finance-panel">
        <div>
          <div class="finance-handle"></div>
          <div class="finance-progress">${Array.from({ length: 3 }, () => '<span class="is-done"></span>').join("")}</div>
        </div>
        <div class="visit-confirmation">
          <h2>Confirmação de Agendamento</h2>
          <p>Olá Enzo,<br />Agradecemos por agendar uma visita ao apartamento decorado no Residencial Oregon.</p>
          <div class="visit-qr">
            <div class="visit-qr-code">
              <img src="https://www.figma.com/api/mcp/asset/696c7cac-a99f-4ad7-9026-801844d25f00" alt="" />
            </div>
            <p>Por favor, apresente esse QR code ao fazer o check-in</p>
          </div>
          <hr class="visit-divider" />
          <div class="visit-details">
            <strong>Detalhes do Agendamento:</strong>
            <span>Data: ${visitDay} de março de 2024<br />Horário: ${visitTime}<br />Nome: Enzo Filipe Antunes<br />Email: enzofilipe@gmail.com<br />Endereço do Imóvel: Rua das Flores, 123, Bairro Bela Vista, Cidade Fictícia, Minas Gerais</span>
          </div>
        </div>
      </div>
      <div class="finance-footer">
        <button class="finance-continue" type="button" data-visit-confirm>Confirmar</button>
        <p class="finance-privacy">${privacyText}</p>
      </div>
    `;
    window.setTimeout(() => financeContent.classList.remove("is-entering"), 260);
  };

  const openFinance = () => {
    window.clearTimeout(loadingTimer);
    financeStep = 0;
    renderFinanceStep();
    financeOverlay.classList.remove("is-closing");
    financeOverlay.classList.add("is-open");
    financeOverlay.setAttribute("aria-hidden", "false");
    phoneShell?.classList.add("finance-open");
  };

  const openVisit = () => {
    window.clearTimeout(loadingTimer);
    visitDay = 17;
    visitTime = "18:00";
    renderVisitPersonal();
    financeOverlay.classList.remove("is-closing");
    financeOverlay.classList.add("is-open");
    financeOverlay.setAttribute("aria-hidden", "false");
    phoneShell?.classList.add("finance-open");
  };

  const closeFinance = () => {
    if (!financeOverlay.classList.contains("is-open")) return;
    window.clearTimeout(loadingTimer);
    financeOverlay.classList.remove("is-open");
    financeOverlay.classList.add("is-closing");
    window.setTimeout(() => {
      financeOverlay.classList.remove("is-closing");
      financeOverlay.setAttribute("aria-hidden", "true");
      phoneShell?.classList.remove("finance-open");
    }, 230);
  };

  financeOpenButton?.addEventListener("click", openFinance);
  visitOpenButton?.addEventListener("click", openVisit);

  financeOverlay.addEventListener("click", (event) => {
    if (event.target === financeOverlay) closeFinance();

    const option = event.target.closest("[data-finance-option]");
    if (option) {
      selectedOption = option.dataset.financeOption;
      financeOverlay.querySelectorAll("[data-finance-option]").forEach((button) => {
        button.classList.toggle("is-selected", button === option);
      });
    }

    const next = event.target.closest("[data-finance-next]");
    const adjust = event.target.closest("[data-finance-adjust]");
    const save = event.target.closest("[data-finance-save]");

    if (adjust) {
      renderFinanceAdjust();
      return;
    }

    if (save) {
      renderFinanceResult();
      return;
    }

    const visitDayButton = event.target.closest("[data-visit-day]");
    if (visitDayButton) {
      visitDay = Number(visitDayButton.dataset.visitDay);
      if (visitDay !== 17 && visitTime === "18:00") visitTime = "10:00";
      renderVisitCalendar();
      return;
    }

    const visitTimeButton = event.target.closest("[data-visit-time]");
    if (visitTimeButton) {
      visitTime = visitTimeButton.dataset.visitTime;
      financeOverlay.querySelectorAll("[data-visit-time]").forEach((button) => {
        button.classList.toggle("is-selected", button === visitTimeButton);
      });
      return;
    }

    if (event.target.closest("[data-visit-confirm]")) {
      closeFinance();
      return;
    }

    if (!next) return;
    if (visitStep === 0 && financeContent.querySelector(".visit-calendar") === null && financeContent.textContent.includes("Agenda a visita")) {
      renderVisitCalendar();
      return;
    }
    if (visitStep === 1 && financeContent.querySelector(".visit-calendar")) {
      renderVisitConfirmation();
      return;
    }
    if (financeContent.querySelector(".finance-result")) {
      closeFinance();
      return;
    }
    if (financeStep < financeSteps.length - 1) {
      financeStep += 1;
      renderFinanceStep();
      return;
    }
    renderFinanceLoading();
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && financeOverlay.classList.contains("is-open")) closeFinance();
  });
}
