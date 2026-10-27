/* =========================================================
   PANCHAL GASES — requisition slip
   Builds an enquiry message on the client. Nothing is sent
   anywhere automatically: the visitor either copies the text
   or is handed to their own mail client with it pre-written.
   ========================================================= */
(function () {
  "use strict";

  /* ====== BUSINESS DETAILS — single source of truth ====== */
  var BUSINESS = {
    email: "panchalgases7@gmail.com",
    phones: [
      { display: "+91 72849 23872", tel: "+917284923872" },
      { display: "+91 99790 68080", tel: "+919979068080" }
    ]
  };

  function setText(id, v) { var el = document.getElementById(id); if (el) el.textContent = v; }
  function setHref(id, v) { var el = document.getElementById(id); if (el) el.href = v; }

  setText("contactPhoneText1", BUSINESS.phones[0].display);
  setHref("contactPhoneLink1", "tel:" + BUSINESS.phones[0].tel);
  setText("contactPhoneText2", BUSINESS.phones[1].display);
  setHref("contactPhoneLink2", "tel:" + BUSINESS.phones[1].tel);
  setText("contactEmailText", BUSINESS.email);
  setHref("contactEmailLink", "mailto:" + BUSINESS.email);
  setText("footYear", "© " + new Date().getFullYear() + " Panchal Gases");

  /* ====== PRODUCTS ======
     Edit names, specs and grades here. Keep the register table in
     index.html in sync by hand — this object drives the slip only. */
  var PRODUCTS = {
    o2:    { label: "Oxygen (O₂)",              spec: "7 CBM cylinder",  code: "var(--c-o2)",  subtypes: null },
    co2:   { label: "Carbon Dioxide (CO₂)",     spec: "30 KG fill",      code: "var(--c-co2)", subtypes: null },
    argon: { label: "Argon (Ar)",               spec: "7 CBM cylinder",  code: "var(--c-ar)",
             subtypes: ["Standard Argon", "Mixture (Ar 80% + CO₂ 20%)", "Grade 1 (UHP) Argon"] },
    n2:    { label: "Nitrogen (N₂)",            spec: "7 CBM cylinder",  code: "var(--c-n2)",
             subtypes: ["Commercial Nitrogen", "Zero Grade / UHP Nitrogen"] },
    da:    { label: "Dissolved Acetylene (DA)", spec: "6 CBM cylinder",  code: "var(--c-da)",  subtypes: null }
  };

  var gasSelectEl = document.getElementById("gasSelect");
  var preview = document.getElementById("enqPreview");
  var slipNote = document.getElementById("slipNote");
  var stampOverlay = document.getElementById("stampOverlay");
  if (!gasSelectEl || !preview) return;

  var selected = Object.create(null);   // key -> true
  var subtypeChoice = Object.create(null);

  function anySelected() {
    for (var k in selected) if (selected[k]) return true;
    return false;
  }

  function toggleProduct(key) {
    if (selected[key]) {
      delete selected[key];
    } else {
      selected[key] = true;
      var p = PRODUCTS[key];
      if (p.subtypes && !subtypeChoice[key]) subtypeChoice[key] = p.subtypes[0];
    }
    renderProducts();
    updatePreview();
  }

  function renderProducts() {
    gasSelectEl.innerHTML = "";

    Object.keys(PRODUCTS).forEach(function (key) {
      var p = PRODUCTS[key];
      var isOn = !!selected[key];

      var row = document.createElement("div");
      row.className = "pick-row";

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip";
      btn.setAttribute("aria-pressed", isOn ? "true" : "false");

      var band = document.createElement("i");
      band.className = "band";
      band.style.setProperty("--code", p.code);
      btn.appendChild(band);

      var name = document.createElement("span");
      name.textContent = p.label;
      btn.appendChild(name);

      var mark = document.createElement("span");
      mark.className = "mark";
      mark.textContent = isOn ? "SELECTED" : p.spec;
      btn.appendChild(mark);

      btn.addEventListener("click", function () { toggleProduct(key); });
      row.appendChild(btn);

      if (isOn && p.subtypes) {
        var subs = document.createElement("div");
        subs.className = "subs";
        p.subtypes.forEach(function (st) {
          var s = document.createElement("button");
          s.type = "button";
          s.className = "sub";
          s.setAttribute("aria-pressed", subtypeChoice[key] === st ? "true" : "false");
          s.textContent = st;
          s.addEventListener("click", function (e) {
            e.stopPropagation();
            subtypeChoice[key] = st;
            renderProducts();
            updatePreview();
          });
          subs.appendChild(s);
        });
        row.appendChild(subs);
      }

      gasSelectEl.appendChild(row);
    });
  }

  renderProducts();

  ["fName", "fCompany", "fEmail", "fMobile"].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener("input", updatePreview);
  });

  /* ====== STATE / CITY — searchable, cascading ======
     City stays locked until a state is chosen, then lists only that
     state's districts. Changing state always clears the city. */
  var selectedState = "";
  var selectedCity = "";
  var STATE_NAMES = (typeof INDIA_STATES !== "undefined") ? Object.keys(INDIA_STATES).sort() : [];

  function setupCombo(inputId, listId, getOptions, handlers) {
    var input = document.getElementById(inputId);
    var list = document.getElementById(listId);
    if (!input || !list) return { clear: function(){}, disable: function(){}, enable: function(){} };

    var shown = [];
    var activeIndex = -1;

    function render(filterText) {
      var all = getOptions();
      shown = filterText
        ? all.filter(function (o) { return o.toLowerCase().indexOf(filterText.toLowerCase()) !== -1; })
        : all;
      activeIndex = -1;
      if (!shown.length) {
        list.innerHTML = '<li class="combo-empty">No matches</li>';
      } else {
        list.innerHTML = shown.slice(0, 200).map(function (o, i) {
          return '<li role="option" data-idx="' + i + '">' + o.replace(/</g, "&lt;") + "</li>";
        }).join("");
      }
      list.classList.add("open");
    }

    function close() { list.classList.remove("open"); }

    function highlight(idx) {
      Array.prototype.forEach.call(list.children, function (li, i) {
        li.classList.toggle("active", i === idx);
      });
      if (idx >= 0 && list.children[idx]) list.children[idx].scrollIntoView({ block: "nearest" });
    }

    function commit(value) {
      input.value = value;
      close();
      if (handlers.onSelect) handlers.onSelect(value);
      updatePreview();
    }

    input.addEventListener("focus", function () { if (!input.disabled) render(input.value); });
    input.addEventListener("input", function () {
      if (handlers.onTyping) handlers.onTyping();
      render(input.value);
      updatePreview();
    });
    input.addEventListener("blur", function () { setTimeout(close, 150); });
    input.addEventListener("keydown", function (e) {
      if (!list.classList.contains("open") || !shown.length) return;
      if (e.key === "ArrowDown") { e.preventDefault(); activeIndex = Math.min(activeIndex + 1, shown.length - 1); highlight(activeIndex); }
      else if (e.key === "ArrowUp") { e.preventDefault(); activeIndex = Math.max(activeIndex - 1, 0); highlight(activeIndex); }
      else if (e.key === "Enter") { e.preventDefault(); if (activeIndex >= 0) commit(shown[activeIndex]); }
      else if (e.key === "Escape") { close(); }
    });
    list.addEventListener("mousedown", function (e) {
      var li = e.target.closest("li");
      if (!li || li.classList.contains("combo-empty")) return;
      commit(li.textContent);
    });

    return {
      clear: function () { input.value = ""; },
      disable: function (ph) { input.disabled = true; input.value = ""; input.placeholder = ph; },
      enable: function (ph) { input.disabled = false; input.placeholder = ph; }
    };
  }

  var cityCombo = setupCombo("fCity", "cityComboList",
    function () { return selectedState ? INDIA_STATES[selectedState] : []; },
    {
      onTyping: function () { selectedCity = ""; },
      onSelect: function (v) { selectedCity = v; }
    });
  cityCombo.disable("Select a state first");

  setupCombo("fState", "stateComboList",
    function () { return STATE_NAMES; },
    {
      onTyping: function () {
        selectedState = ""; selectedCity = "";
        cityCombo.disable("Select a state first");
      },
      onSelect: function (v) {
        selectedState = v;
        selectedCity = "";
        cityCombo.clear();
        cityCombo.enable("City / district");
      }
    });

  /* ====== VALIDATION ====== */
  function details() {
    function val(id) { var el = document.getElementById(id); return el ? el.value.trim() : ""; }
    return {
      name: val("fName"), company: val("fCompany"),
      email: val("fEmail"), mobile: val("fMobile"),
      state: selectedState, city: selectedCity
    };
  }

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function issueWith(d) {
    var missing = [];
    if (!d.name) missing.push("Name");
    if (!d.company) missing.push("Company");
    if (!d.email) missing.push("Email");
    if (!d.mobile) missing.push("Mobile number");
    if (!d.state) missing.push("State");
    if (!d.city) missing.push("City or district");
    if (missing.length) return "Still needed: " + missing.join(", ") + ".";
    if (!EMAIL_RE.test(d.email)) return "That email address doesn't look right — check it over.";
    if (d.mobile.replace(/\D/g, "").length < 7) return "That mobile number looks too short — check it over.";
    return null;
  }

  /* ====== MESSAGE ====== */
  function buildMessage() {
    if (!anySelected()) return null;
    var d = details();
    var lines = [];
    lines.push("Hello Panchal Gases, I'd like to enquire about:");
    lines.push("");
    Object.keys(PRODUCTS).forEach(function (key) {
      if (!selected[key]) return;
      var p = PRODUCTS[key], st = subtypeChoice[key];
      lines.push("• " + p.label + (st ? " — " + st : "") + " (" + p.spec + ")");
    });
    lines.push("");
    lines.push("Name: " + (d.name || "—"));
    lines.push("Company: " + (d.company || "—"));
    lines.push("Email: " + (d.email || "—"));
    lines.push("Mobile: " + (d.mobile || "—"));
    lines.push("State: " + (d.state || "—"));
    lines.push("City / district: " + (d.city || "—"));
    lines.push("");
    lines.push("Please share availability and pricing. Thank you.");
    return lines.join("\n");
  }

  function updatePreview() {
    var msg = buildMessage();
    preview.textContent = msg || "Pick a product to start your slip.";
  }

  function gmailComposeUrl(body) {
    return "https://mail.google.com/mail/?view=cm&fs=1&to=" + encodeURIComponent(BUSINESS.email) +
           "&su=" + encodeURIComponent("Enquiry — Panchal Gases") +
           "&body=" + encodeURIComponent(body);
  }

  function isLikelyMobile() {
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  }

  function note(msg) { if (slipNote) slipNote.textContent = msg || ""; }

  function checkReady() {
    if (!anySelected()) { note("Pick at least one product first."); return false; }
    var problem = issueWith(details());
    if (problem) { note(problem); return false; }
    note("");
    return true;
  }

  function flashStamp() {
    if (!stampOverlay) return;
    stampOverlay.classList.remove("show");
    void stampOverlay.offsetWidth; // restart the animation on a repeat press
    stampOverlay.classList.add("show");
  }

  /* ====== COPY ====== */
  var copyBtn = document.getElementById("copyBtn");
  if (copyBtn) copyBtn.addEventListener("click", function () {
    if (!checkReady()) return;
    var msg = buildMessage();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(msg).then(function () {
        note("Copied — paste it wherever you like.");
        flashStamp();
        setTimeout(function () { note(""); }, 2600);
      }).catch(function () {
        note("Couldn't copy automatically — select the text and copy it.");
      });
    } else {
      note("This browser blocks copying — select the text and copy it.");
    }
  });

  /* ====== SEND ======
     Desktop: Gmail web compose opens in a new tab, pre-written.
     Mobile: tries the Gmail app first; if it doesn't take over within
     1.2s, falls back to Gmail web in the same tab. Either way the
     visitor presses send themselves. */
  var sendBtn = document.getElementById("sendMailBtn");
  if (sendBtn) sendBtn.addEventListener("click", function () {
    if (!checkReady()) return;
    var msg = buildMessage();
    var webUrl = gmailComposeUrl(msg);

    if (!isLikelyMobile()) {
      window.open(webUrl, "_blank", "noopener");
      note("Gmail opened in a new tab — press send there.");
      setTimeout(function () { note(""); }, 3200);
      return;
    }

    var appUrl = "googlegmail://co?to=" + encodeURIComponent(BUSINESS.email) +
                 "&subject=" + encodeURIComponent("Enquiry — Panchal Gases") +
                 "&body=" + encodeURIComponent(msg);

    var handedOff = false;
    function markHandedOff() { handedOff = true; }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) markHandedOff();
    }, { once: true });
    window.addEventListener("pagehide", markHandedOff, { once: true });

    window.location.href = appUrl;
    setTimeout(function () { if (!handedOff) window.location.href = webUrl; }, 1200);
  });

  updatePreview();
})();
