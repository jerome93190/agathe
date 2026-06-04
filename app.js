/* =========================================================================
   Notes — logique de l'application (sans dépendance externe)
   Stockage local (localStorage), éditeur enrichi, recherche, balayage,
   export/import, thème clair/sombre, et installation PWA.
   ========================================================================= */
(function () {
  "use strict";

  /* ----------------------------- Constantes ----------------------------- */
  const APP_VERSION = "1.1.0"; // ⬆️ incrémenté à chaque mise à jour
  const STORE_KEY = "notes.app.v1";
  const BACKUP_KEY = "notes.app.v1.backup"; // copie de secours automatique
  const SYSTEM_FOLDER = "f_notes";

  /* ----------------------------- Icônes (SVG) ---------------------------- */
  const S = (inner, opts) =>
    `<svg viewBox="0 0 24 24" fill="${(opts && opts.fill) || "none"}" stroke="${
      (opts && opts.stroke) || "currentColor"
    }" stroke-width="${(opts && opts.sw) || 1.8}" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;

  const ICONS = {
    "chevron-left": S('<polyline points="15 5 8 12 15 19"/>', { sw: 2.4 }),
    "chevron-right": S('<polyline points="9 6 15 12 9 18"/>', { sw: 2 }),
    search: S('<circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/>', { sw: 2 }),
    "x-circle": S('<circle cx="12" cy="12" r="10" fill="currentColor" stroke="none"/><path d="M9 9l6 6M15 9l-6 6" stroke="var(--bg-elevated)" stroke-width="2"/>'),
    folder: S('<path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4l2 2h9A1.5 1.5 0 0 1 21 9.5v8A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5z"/>', { fill: "currentColor", stroke: "none" }),
    "folder-plus": S('<path d="M3 8a2 2 0 0 1 2-2h3l2 2h9a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><line x1="12" y1="11" x2="12" y2="16"/><line x1="9.5" y1="13.5" x2="14.5" y2="13.5"/>', { sw: 1.7 }),
    note: S('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><polyline points="14 3 14 8 19 8"/><line x1="8.5" y1="13" x2="15.5" y2="13"/><line x1="8.5" y1="16.5" x2="13" y2="16.5"/>'),
    compose: S('<path d="M19 12.5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5.5"/><path d="M17.5 3.5l3 3-8.5 8.5-3.6.6.6-3.6z"/>', { sw: 1.7 }),
    pin: S('<path d="M9.5 3.5h5l-1 2.2v4l2.5 2.8H8l2.5-2.8v-4z"/><line x1="12" y1="16" x2="12" y2="21"/>', { sw: 1.7 }),
    "pin-fill": S('<path d="M9.5 3.5h5l-1 2.2v4l2.5 2.8H8l2.5-2.8v-4z" fill="currentColor"/><line x1="12" y1="16" x2="12" y2="21" stroke-width="1.8"/>'),
    dots: S('<circle cx="12" cy="12" r="9"/><circle cx="8" cy="12" r="1.1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none"/><circle cx="16" cy="12" r="1.1" fill="currentColor" stroke="none"/>'),
    aa: '<svg viewBox="0 0 24 24"><text x="12" y="17" text-anchor="middle" font-size="15" font-weight="700" font-family="-apple-system,system-ui,sans-serif" fill="currentColor">Aa</text></svg>',
    checklist: S('<path d="M3 7l1.6 1.6L7.5 5.4"/><path d="M3 17l1.6 1.6L7.5 15.4"/><line x1="11" y1="7" x2="21" y2="7"/><line x1="11" y1="17" x2="21" y2="17"/>'),
    "list-bullet": S('<circle cx="4.5" cy="7" r="1.5" fill="currentColor" stroke="none"/><circle cx="4.5" cy="17" r="1.5" fill="currentColor" stroke="none"/><line x1="9" y1="7" x2="21" y2="7"/><line x1="9" y1="17" x2="21" y2="17"/>'),
    "list-number": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><text x="1.5" y="9.5" font-size="8" font-weight="600" fill="currentColor" stroke="none" font-family="-apple-system,system-ui">1</text><text x="1.5" y="19.5" font-size="8" font-weight="600" fill="currentColor" stroke="none" font-family="-apple-system,system-ui">2</text><line x1="9" y1="7" x2="21" y2="7"/><line x1="9" y1="17" x2="21" y2="17"/></svg>',
    share: S('<path d="M12 3v12"/><polyline points="8 7 12 3 16 7"/><path d="M7 11H5.5A1.5 1.5 0 0 0 4 12.5v6A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 18.5 11H17"/>'),
    copy: S('<rect x="9" y="9" width="11" height="11" rx="2.2"/><path d="M5 15H4.2A1.2 1.2 0 0 1 3 13.8V4.2A1.2 1.2 0 0 1 4.2 3h9.6A1.2 1.2 0 0 1 15 4.2V5"/>'),
    trash: S('<polyline points="4 7 20 7"/><path d="M6.5 7l.9 12.1A1.9 1.9 0 0 0 9.3 21h5.4a1.9 1.9 0 0 0 1.9-1.9L17.5 7"/><path d="M9.5 7V4.6A1.6 1.6 0 0 1 11.1 3h1.8a1.6 1.6 0 0 1 1.6 1.6V7"/><line x1="10" y1="11" x2="10.2" y2="17"/><line x1="14" y1="11" x2="13.8" y2="17"/>'),
    download: S('<path d="M12 3v12"/><polyline points="8 11 12 15 16 11"/><path d="M5 19h14"/>'),
    upload: S('<path d="M12 15V3"/><polyline points="8 7 12 3 16 7"/><path d="M5 19h14"/>'),
    moon: S('<path d="M21 13.2A9 9 0 1 1 10.8 3 7 7 0 0 0 21 13.2z"/>'),
    "keyboard-down": S('<rect x="3" y="3" width="18" height="9" rx="2.2"/><line x1="7" y1="6.5" x2="7" y2="6.5"/><line x1="11" y1="6.5" x2="11" y2="6.5"/><line x1="15" y1="6.5" x2="15" y2="6.5"/><line x1="8" y1="9" x2="14" y2="9"/><polyline points="8 16 12 20 16 16"/>'),
    gear: S('<circle cx="12" cy="12" r="3.2"/><path d="M12 2.6l1 2 2.3-.4.3 2.3 2.1 1-.9 2.1.9 2.1-2.1 1-.3 2.3-2.3-.4-1 2-1-2-2.3.4-.3-2.3-2.1-1 .9-2.1-.9-2.1 2.1-1 .3-2.3 2.3.4z"/>', { sw: 1.4 }),
    check: S('<polyline points="5 12.5 10 17.5 19 6.5"/>', { sw: 2.2 }),
  };

  function svgFor(name) {
    return ICONS[name] || "";
  }
  function paintIcons(root) {
    (root || document).querySelectorAll(".icon-slot[data-icon]").forEach((el) => {
      if (el.dataset.painted === "1") return;
      el.innerHTML = svgFor(el.dataset.icon);
      el.dataset.painted = "1";
    });
  }

  /* ----------------------------- État & stockage ------------------------- */
  let state = { folders: [], notes: [], theme: "auto" };
  const nav = { depth: 0, folderId: null, noteId: null };
  let selectionMode = false;
  const selected = new Set();
  let foldersEditing = false;

  function uid(prefix) {
    return (prefix || "id") + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function persist() {
    try {
      const json = JSON.stringify(state);
      localStorage.setItem(STORE_KEY, json);
      // Sauvegarde automatique redondante (anti-perte) : copie + horodatage
      localStorage.setItem(BACKUP_KEY, json);
      localStorage.setItem(STORE_KEY + ".savedAt", String(Date.now()));
    } catch (e) {
      toast("Impossible d'enregistrer (stockage plein ?)");
    }
  }

  function parseState(raw) {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.folders) && Array.isArray(parsed.notes)) return parsed;
    } catch (e) {}
    return null;
  }

  function load() {
    let parsed = null;
    try {
      parsed = parseState(localStorage.getItem(STORE_KEY));
      // Si la donnée principale est absente/corrompue, on récupère la copie de secours
      if (!parsed) {
        parsed = parseState(localStorage.getItem(BACKUP_KEY));
        if (parsed) toast("Notes restaurées depuis la sauvegarde automatique");
      }
    } catch (e) {}
    if (parsed) {
      state = Object.assign({ theme: "auto" }, parsed);
      return;
    }
    seed();
  }

  function seed() {
    const now = Date.now();
    state = {
      theme: "auto",
      folders: [
        { id: SYSTEM_FOLDER, name: "Notes", system: true, createdAt: now },
        { id: uid("f"), name: "Idées", createdAt: now },
      ],
      notes: [
        {
          id: uid("n"),
          folderId: SYSTEM_FOLDER,
          body:
            "<h1>Bienvenue 👋</h1>" +
            "<div>Ceci est votre toute première note. Touchez n'importe où pour écrire.</div>" +
            "<div><br></div>" +
            "<div>Ce que vous pouvez faire :</div>" +
            '<div class="cl-item" data-checked="true"><span class="cl-box" contenteditable="false"></span><span class="cl-text">Créer et organiser des notes</span></div>' +
            '<div class="cl-item" data-checked="false"><span class="cl-box" contenteditable="false"></span><span class="cl-text">Mettre en forme (titre, gras, listes…)</span></div>' +
            '<div class="cl-item" data-checked="false"><span class="cl-box" contenteditable="false"></span><span class="cl-text">Épingler les notes importantes</span></div>' +
            '<div class="cl-item" data-checked="false"><span class="cl-box" contenteditable="false"></span><span class="cl-text">Exporter une sauvegarde (menu ⚙︎)</span></div>' +
            "<div><br></div>" +
            "<div>Tout est enregistré automatiquement sur votre appareil. ✨</div>",
          pinned: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: uid("n"),
          folderId: SYSTEM_FOLDER,
          body: "<h1>Liste de courses</h1><div>Glissez une note vers la gauche pour l'épingler ou la supprimer.</div>",
          pinned: false,
          createdAt: now - 1,
          updatedAt: now - 86400000,
        },
      ],
    };
    persist();
  }

  /* ----------------------------- Utilitaires ----------------------------- */
  const el = (sel) => document.querySelector(sel);

  function getFolder(id) {
    return state.folders.find((f) => f.id === id) || null;
  }
  function getNote(id) {
    return state.notes.find((n) => n.id === id) || null;
  }
  function notesInFolder(folderId) {
    const list =
      folderId === "__all__" ? state.notes.slice() : state.notes.filter((n) => n.folderId === folderId);
    return list;
  }

  // Conversion HTML -> texte (en respectant les sauts de ligne des blocs)
  function htmlToText(html) {
    const tmp = document.createElement("div");
    tmp.style.cssText = "position:absolute;left:-99999px;top:0;white-space:pre-wrap;";
    tmp.innerHTML = html || "";
    document.body.appendChild(tmp);
    const text = tmp.innerText || tmp.textContent || "";
    tmp.remove();
    return text;
  }

  const metaCache = new Map();
  function noteMeta(note) {
    const key = note.id + ":" + note.updatedAt;
    if (metaCache.has(key)) return metaCache.get(key);
    const text = htmlToText(note.body).replace(/ /g, " ");
    const lines = text.split("\n").map((l) => l.trim());
    let title = "",
      preview = "";
    const firstIdx = lines.findIndex((l) => l !== "");
    if (firstIdx >= 0) {
      title = lines[firstIdx];
      preview = lines
        .slice(firstIdx + 1)
        .filter((l) => l !== "")
        .join("  ");
    }
    const meta = { title, preview, text: text.toLowerCase() };
    metaCache.set(key, meta);
    if (metaCache.size > 400) metaCache.clear();
    return meta;
  }

  function normalize(s) {
    return (s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
  }

  // Dates relatives façon iOS
  const DAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  function startOfDay(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x.getTime();
  }
  function relativeDate(ts) {
    const now = new Date();
    const d = new Date(ts);
    const dayDiff = Math.round((startOfDay(now) - startOfDay(d)) / 86400000);
    if (dayDiff === 0) {
      return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    }
    if (dayDiff === 1) return "Hier";
    if (dayDiff > 1 && dayDiff < 7) return DAYS[d.getDay()];
    if (d.getFullYear() === now.getFullYear()) {
      return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
    }
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  }
  function fullDate(ts) {
    const d = new Date(ts);
    return (
      d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) +
      " à " +
      d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    );
  }

  // Nettoyage léger du HTML chargé dans l'éditeur
  function sanitize(html) {
    const tmp = document.createElement("div");
    tmp.innerHTML = html || "";
    tmp.querySelectorAll("script,style,iframe,object,embed,link,meta").forEach((n) => n.remove());
    tmp.querySelectorAll("*").forEach((n) => {
      [...n.attributes].forEach((a) => {
        const name = a.name.toLowerCase();
        if (name.startsWith("on")) n.removeAttribute(a.name);
        if (name === "style" && /expression|url\s*\(/i.test(a.value)) n.removeAttribute(a.name);
        if ((name === "href" || name === "src") && /javascript:/i.test(a.value)) n.removeAttribute(a.name);
      });
    });
    return tmp.innerHTML;
  }

  let toastTimer = null;
  function toast(msg) {
    const t = el("#toast");
    t.textContent = msg;
    t.hidden = false;
    requestAnimationFrame(() => t.classList.add("is-visible"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      t.classList.remove("is-visible");
      setTimeout(() => (t.hidden = true), 250);
    }, 1900);
  }

  /* ----------------------------- Navigation ------------------------------ */
  const screens = el("#screens");

  function setDepth(d) {
    nav.depth = d;
    screens.dataset.depth = String(d);
  }

  function openFolders() {
    setDepth(0);
  }

  function openFolderView(folderId) {
    nav.folderId = folderId;
    selectionMode = false;
    selected.clear();
    el("#search-input").value = "";
    renderNotesScreen();
    setDepth(1);
    el("#notes-scroll").scrollTop = 0;
  }

  function openNote(noteId) {
    saveCurrentNote();
    nav.noteId = noteId;
    renderEditor();
    setDepth(2);
    el("#editor-scroll").scrollTop = 0;
  }

  function leaveEditorChrome() {
    editor.blur();
    el("#format-bar").hidden = true;
    el("#editor-done-btn").hidden = true;
  }

  function goBack() {
    if (nav.depth === 2) {
      saveCurrentNote();
      leaveEditorChrome();
      nav.noteId = null;
      renderNotesScreen();
      setDepth(1);
    } else if (nav.depth === 1) {
      renderFolders();
      setDepth(0);
    }
  }

  /* ----------------------------- Rendu : Dossiers ------------------------ */
  function renderFolders() {
    const list = el("#folder-list");
    list.innerHTML = "";

    const rows = [{ id: "__all__", name: "Toutes les notes", virtual: true }].concat(state.folders);

    rows.forEach((f) => {
      const li = document.createElement("li");
      const row = document.createElement("div");
      row.className = "folder-row";
      if (foldersEditing && !f.virtual && !f.system) row.classList.add("is-editing");

      const count = f.virtual ? state.notes.length : notesInFolder(f.id).length;

      row.innerHTML =
        '<button class="folder-delete" type="button" aria-label="Supprimer le dossier"><span class="icon-slot" data-icon="trash"></span></button>' +
        '<span class="icon-slot" data-icon="folder"></span>' +
        '<span class="folder-name"></span>' +
        '<span class="folder-count">' +
        count +
        "</span>" +
        '<span class="icon-slot folder-chevron" data-icon="chevron-right"></span>';
      row.querySelector(".folder-name").textContent = f.name;
      paintIcons(row);

      row.addEventListener("click", (e) => {
        if (e.target.closest(".folder-delete")) {
          deleteFolder(f.id);
          return;
        }
        if (foldersEditing && !f.virtual && !f.system) {
          renameFolder(f.id);
          return;
        }
        openFolderView(f.id);
      });

      li.appendChild(row);
      list.appendChild(li);
    });
  }

  function deleteFolder(id) {
    const f = getFolder(id);
    if (!f || f.system) return;
    const moved = notesInFolder(id);
    moved.forEach((n) => (n.folderId = SYSTEM_FOLDER));
    state.folders = state.folders.filter((x) => x.id !== id);
    persist();
    renderFolders();
    toast(moved.length ? "Dossier supprimé · notes déplacées vers « Notes »" : "Dossier supprimé");
  }

  function renameFolder(id) {
    const f = getFolder(id);
    if (!f) return;
    const name = window.prompt("Renommer le dossier", f.name);
    if (name && name.trim()) {
      f.name = name.trim();
      persist();
      renderFolders();
    }
  }

  function newFolder() {
    const name = window.prompt("Nom du nouveau dossier", "");
    if (name && name.trim()) {
      state.folders.push({ id: uid("f"), name: name.trim(), createdAt: Date.now() });
      persist();
      renderFolders();
    }
  }

  /* ----------------------------- Rendu : Notes --------------------------- */
  function renderNotesScreen() {
    const folder = nav.folderId === "__all__" ? { name: "Toutes les notes", id: "__all__" } : getFolder(nav.folderId);
    const name = folder ? folder.name : "Notes";
    el("#notes-nav-title").textContent = name;
    el("#notes-large-title").textContent = name;
    el("#editor-back-label").textContent = name.length > 14 ? "Notes" : name;
    el("#notes-edit-btn").textContent = selectionMode ? "OK" : "Modifier";
    renderNotesList();
  }

  function currentNotes() {
    let list = notesInFolder(nav.folderId);
    const q = normalize(el("#search-input").value.trim());
    if (q) {
      list = list.filter((n) => {
        const m = noteMeta(n);
        return normalize(m.title + " " + m.text).includes(q);
      });
    }
    list.sort((a, b) => {
      if (!!b.pinned !== !!a.pinned) return b.pinned ? 1 : -1;
      return b.updatedAt - a.updatedAt;
    });
    return list;
  }

  function renderNotesList() {
    const ul = el("#note-list");
    ul.innerHTML = "";
    const list = currentNotes();
    const empty = el("#notes-empty");

    el("#notes-count").textContent =
      selectionMode
        ? selected.size + " sélectionnée" + (selected.size > 1 ? "s" : "")
        : list.length + " note" + (list.length > 1 ? "s" : "");

    // bouton compose -> corbeille en mode sélection
    const compose = el("#compose-btn");
    compose.querySelector(".icon-slot").dataset.icon = selectionMode ? "trash" : "compose";
    compose.querySelector(".icon-slot").dataset.painted = "0";
    compose.classList.toggle("toolbar-btn--danger", selectionMode);
    paintIcons(compose);

    if (!list.length) {
      empty.hidden = false;
      const searching = !!el("#search-input").value.trim();
      empty.querySelector(".empty-title").textContent = searching ? "Aucun résultat" : "Aucune note";
      empty.querySelector(".empty-sub").textContent = searching
        ? "Essayez un autre mot-clé."
        : "Touchez le bouton crayon pour écrire votre première note.";
      return;
    }
    empty.hidden = true;

    const pinned = list.filter((n) => n.pinned);
    const others = list.filter((n) => !n.pinned);

    if (pinned.length && !el("#search-input").value.trim()) {
      ul.appendChild(sectionTitle("pin", "Épinglées"));
      pinned.forEach((n) => ul.appendChild(noteRow(n)));
      if (others.length) ul.appendChild(sectionTitle(null, "Notes"));
    }
    others.forEach((n) => ul.appendChild(noteRow(n)));
  }

  function sectionTitle(icon, text) {
    const li = document.createElement("li");
    li.className = "note-section-title";
    li.innerHTML = (icon ? '<span class="icon-slot" data-icon="' + icon + '"></span>' : "") + "<span></span>";
    li.querySelector("span:last-child").textContent = text;
    paintIcons(li);
    return li;
  }

  function noteRow(note) {
    const meta = noteMeta(note);
    const li = document.createElement("li");
    li.className = "note-row";
    li.dataset.id = note.id;

    // Actions de balayage
    const actions = document.createElement("div");
    actions.className = "note-row__actions";
    actions.innerHTML =
      '<button class="swipe-action swipe-action--pin" type="button"><span class="icon-slot" data-icon="' +
      (note.pinned ? "pin-fill" : "pin") +
      '"></span><span>' +
      (note.pinned ? "Désépingler" : "Épingler") +
      "</span></button>" +
      '<button class="swipe-action swipe-action--delete" type="button"><span class="icon-slot" data-icon="trash"></span><span>Supprimer</span></button>';
    paintIcons(actions);
    actions.querySelector(".swipe-action--pin").addEventListener("click", (e) => {
      e.stopPropagation();
      togglePin(note.id);
    });
    actions.querySelector(".swipe-action--delete").addEventListener("click", (e) => {
      e.stopPropagation();
      deleteNote(note.id);
    });

    const inner = document.createElement("button");
    inner.className = "note-row__inner";
    inner.type = "button";

    const titleText = meta.title || "Nouvelle note";
    const dateText = relativeDate(note.updatedAt);
    const previewText = meta.preview || "Aucun texte supplémentaire";

    let html = "";
    if (selectionMode) {
      html +=
        '<span class="sel-circle' +
        (selected.has(note.id) ? " is-on" : "") +
        '">' +
        (selected.has(note.id) ? '<span class="icon-slot" data-icon="check"></span>' : "") +
        "</span>";
    }
    html +=
      '<div class="note-row__body">' +
      '<div class="note-row__title">' +
      (note.pinned ? '<span class="icon-slot pin-mark" data-icon="pin-fill"></span>' : "") +
      '<span class="nrt-text"></span></div>' +
      '<div class="note-row__meta"><span class="note-row__date"></span><span class="note-row__preview"></span></div>' +
      "</div>";
    inner.innerHTML = html;
    inner.querySelector(".nrt-text").textContent = titleText;
    inner.querySelector(".note-row__date").textContent = dateText;
    inner.querySelector(".note-row__preview").textContent = previewText;
    if (selectionMode) inner.classList.add("is-selecting");
    paintIcons(inner);

    li.appendChild(actions);
    li.appendChild(inner);

    if (selectionMode) {
      inner.addEventListener("click", () => toggleSelect(note.id));
    } else {
      setupSwipe(inner, actions, note.id);
    }
    return li;
  }

  /* ----------------------------- Balayage (swipe) ------------------------ */
  let openInner = null;
  function closeOpenRow() {
    if (openInner) {
      openInner.style.transform = "";
      openInner._open = false;
      openInner = null;
    }
  }

  function setupSwipe(inner, actions, noteId) {
    let startX = 0,
      startY = 0,
      decided = false,
      horizontal = false,
      moved = false,
      width = 152,
      pointerId = null;

    inner.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      startX = e.clientX;
      startY = e.clientY;
      decided = false;
      horizontal = false;
      moved = false;
      pointerId = e.pointerId;
      width = actions.offsetWidth || 152;
    });

    inner.addEventListener("pointermove", (e) => {
      if (pointerId !== e.pointerId) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (!decided) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        decided = true;
        horizontal = Math.abs(dx) > Math.abs(dy);
        if (horizontal) {
          try {
            inner.setPointerCapture(e.pointerId);
          } catch (err) {}
          if (openInner && openInner !== inner) closeOpenRow();
        }
      }
      if (!horizontal) return;
      moved = true;
      const base = inner._open ? -width : 0;
      let pos = Math.max(-width * 1.15, Math.min(0, base + dx));
      inner.style.transform = "translateX(" + pos + "px)";
    });

    function finish(e) {
      if (pointerId !== e.pointerId) return;
      pointerId = null;
      if (!horizontal) return;
      const dx = e.clientX - startX;
      const base = inner._open ? -width : 0;
      const pos = base + dx;
      const open = pos < -width / 2;
      inner.style.transform = open ? "translateX(" + -width + "px)" : "";
      inner._open = open;
      openInner = open ? inner : openInner === inner ? null : openInner;
    }
    inner.addEventListener("pointerup", finish);
    inner.addEventListener("pointercancel", finish);

    inner.addEventListener("click", (e) => {
      if (moved || inner._open) {
        e.preventDefault();
        if (inner._open) closeOpenRow();
        return;
      }
      openNote(noteId);
    });
  }

  /* ----------------------------- Actions notes --------------------------- */
  function togglePin(id) {
    const n = getNote(id);
    if (!n) return;
    n.pinned = !n.pinned;
    n.updatedAt = Date.now();
    persist();
    closeOpenRow();
    renderNotesList();
    toast(n.pinned ? "Note épinglée" : "Note désépinglée");
  }

  function deleteNote(id) {
    state.notes = state.notes.filter((n) => n.id !== id);
    metaCache.clear();
    persist();
    closeOpenRow();
    if (nav.depth === 2 && nav.noteId === id) {
      leaveEditorChrome();
      nav.noteId = null;
      renderNotesScreen();
      setDepth(1);
    } else {
      renderNotesList();
    }
    toast("Note supprimée");
  }

  function newNote() {
    let folderId = nav.folderId;
    if (folderId === "__all__" || !getFolder(folderId)) folderId = SYSTEM_FOLDER;
    const now = Date.now();
    const note = { id: uid("n"), folderId, body: "", pinned: false, createdAt: now, updatedAt: now };
    state.notes.unshift(note);
    persist();
    openNote(note.id);
    setTimeout(() => focusEditorEnd(), 380);
  }

  function duplicateNote(id) {
    const n = getNote(id);
    if (!n) return;
    const now = Date.now();
    const copy = Object.assign({}, n, { id: uid("n"), pinned: false, createdAt: now, updatedAt: now });
    state.notes.unshift(copy);
    persist();
    toast("Note dupliquée");
    openNote(copy.id);
  }

  /* ----------------------------- Mode sélection -------------------------- */
  function toggleSelectionMode() {
    selectionMode = !selectionMode;
    selected.clear();
    closeOpenRow();
    renderNotesScreen();
  }
  function toggleSelect(id) {
    if (selected.has(id)) selected.delete(id);
    else selected.add(id);
    renderNotesList();
  }
  function deleteSelected() {
    if (!selected.size) {
      toggleSelectionMode();
      return;
    }
    state.notes = state.notes.filter((n) => !selected.has(n.id));
    metaCache.clear();
    const count = selected.size;
    selected.clear();
    selectionMode = false;
    persist();
    renderNotesScreen();
    toast(count + " note" + (count > 1 ? "s supprimées" : " supprimée"));
  }

  /* ----------------------------- Éditeur --------------------------------- */
  const editor = el("#editor");
  let saveTimer = null;

  function renderEditor() {
    const note = getNote(nav.noteId);
    if (!note) return;
    editor.innerHTML = sanitize(note.body || "");
    editor.setAttribute("data-placeholder", "Commencez à écrire…");
    el("#editor-date").textContent = fullDate(note.updatedAt);
    updatePinButton(note);
  }

  function updatePinButton(note) {
    const btn = el("#pin-btn");
    btn.querySelector(".icon-slot").dataset.icon = note.pinned ? "pin-fill" : "pin";
    btn.querySelector(".icon-slot").dataset.painted = "0";
    btn.classList.toggle("is-active", !!note.pinned);
    paintIcons(btn);
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveCurrentNote, 350);
  }

  function saveCurrentNote() {
    clearTimeout(saveTimer);
    if (nav.noteId == null) return;
    const note = getNote(nav.noteId);
    if (!note) return;
    const html = editor.innerHTML;
    if (html === note.body) return;
    note.body = html;
    note.updatedAt = Date.now();
    metaCache.delete(note.id);
    persist();
    flashSaved(note);
  }

  // Indicateur « Enregistré » fugace dans l'en-tête de l'éditeur
  let savedTimer = null;
  function flashSaved(note) {
    const d = el("#editor-date");
    d.textContent = "✓ Enregistré";
    d.classList.add("is-saved");
    clearTimeout(savedTimer);
    savedTimer = setTimeout(() => {
      d.classList.remove("is-saved");
      const n = note || getNote(nav.noteId);
      if (n) d.textContent = fullDate(n.updatedAt);
    }, 1300);
  }

  function focusEditorEnd() {
    editor.focus();
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  // Bloc courant (enfant direct de l'éditeur) contenant la sélection
  function currentBlock() {
    const sel = window.getSelection();
    if (!sel.rangeCount) return null;
    let node = sel.getRangeAt(0).startContainer;
    if (node === editor) {
      return editor.children[Math.min(sel.getRangeAt(0).startOffset, editor.children.length - 1)] || null;
    }
    while (node && node.parentNode !== editor) node = node.parentNode;
    return node && node !== editor ? node : null;
  }
  function closestInEditor(selector) {
    const sel = window.getSelection();
    if (!sel.rangeCount) return null;
    let node = sel.getRangeAt(0).startContainer;
    if (node.nodeType === 3) node = node.parentNode;
    while (node && node !== editor) {
      if (node.matches && node.matches(selector)) return node;
      node = node.parentNode;
    }
    return null;
  }

  function exec(cmd, value) {
    editor.focus();
    try {
      document.execCommand(cmd, false, value || null);
    } catch (e) {}
    scheduleSave();
    refreshFormatState();
  }

  function setBlock(tag) {
    editor.focus();
    // Sort d'une éventuelle liste à cocher
    const item = closestInEditor(".cl-item");
    if (item) convertChecklistItemToBlock(item, tag);
    try {
      document.execCommand("formatBlock", false, tag);
    } catch (e) {}
    scheduleSave();
    refreshFormatState();
  }

  function makeChecklistItem(text) {
    const item = document.createElement("div");
    item.className = "cl-item";
    item.setAttribute("data-checked", "false");
    const box = document.createElement("span");
    box.className = "cl-box";
    box.setAttribute("contenteditable", "false");
    const t = document.createElement("span");
    t.className = "cl-text";
    t.textContent = text || "";
    item.appendChild(box);
    item.appendChild(t);
    return item;
  }

  function placeCaretIn(node, atEnd) {
    const range = document.createRange();
    range.selectNodeContents(node);
    range.collapse(!atEnd);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function toggleChecklist() {
    editor.focus();
    const existing = closestInEditor(".cl-item");
    if (existing) {
      convertChecklistItemToBlock(existing, "DIV");
      scheduleSave();
      return;
    }
    const block = currentBlock();
    const text = block ? block.textContent : "";
    const item = makeChecklistItem(text);
    if (block && block.parentNode === editor) {
      block.replaceWith(item);
    } else {
      editor.appendChild(item);
    }
    placeCaretIn(item.querySelector(".cl-text"), true);
    scheduleSave();
    refreshFormatState();
  }

  function convertChecklistItemToBlock(item, tag) {
    const div = document.createElement(tag && tag !== "DIV" ? tag : "div");
    const text = item.querySelector(".cl-text");
    div.textContent = text ? text.textContent : "";
    if (!div.textContent) div.innerHTML = "<br>";
    item.replaceWith(div);
    placeCaretIn(div, true);
  }

  // Détermine l'état actif des boutons de format
  function refreshFormatState() {
    const cmds = { bold: "bold", italic: "italic", underline: "underline", strikeThrough: "strikeThrough" };
    Object.keys(cmds).forEach((c) => {
      let on = false;
      try {
        on = document.queryCommandState(cmds[c]);
      } catch (e) {}
      document.querySelectorAll('[data-cmd="' + c + '"]').forEach((b) => b.classList.toggle("is-active", on));
    });
    const block = currentBlock();
    const tag = block ? block.tagName : "";
    document.querySelectorAll(".format-style").forEach((b) => {
      const st = b.dataset.style;
      const active = (st === "title" && tag === "H1") || (st === "heading" && tag === "H2") || (st === "body" && tag !== "H1" && tag !== "H2");
      b.classList.toggle("is-active", active);
    });
  }

  function handleEditorEnter(e) {
    const item = closestInEditor(".cl-item");
    if (!item) return;
    e.preventDefault();
    const textEl = item.querySelector(".cl-text");
    const isEmpty = !textEl.textContent.trim();
    if (isEmpty) {
      convertChecklistItemToBlock(item, "DIV");
    } else {
      const next = makeChecklistItem("");
      item.after(next);
      placeCaretIn(next.querySelector(".cl-text"), false);
    }
    scheduleSave();
  }

  /* ----------------------------- Feuilles (sheets) ----------------------- */
  const backdrop = el("#sheet-backdrop");
  let openSheet = null;

  function showSheet(id) {
    closeSheet();
    const sheet = el("#" + id);
    if (!sheet) return;
    openSheet = sheet;
    sheet.hidden = false;
    backdrop.hidden = false;
    requestAnimationFrame(() => {
      backdrop.classList.add("is-visible");
      sheet.classList.add("is-visible");
    });
    if (id === "format-sheet") refreshFormatState();
  }
  function closeSheet() {
    backdrop.classList.remove("is-visible");
    if (openSheet) {
      const s = openSheet;
      s.classList.remove("is-visible");
      setTimeout(() => {
        s.hidden = true;
      }, 320);
      openSheet = null;
    }
    setTimeout(() => {
      if (!openSheet) backdrop.hidden = true;
    }, 320);
  }

  /* ----------------------------- Export / Import ------------------------- */
  function exportNotes() {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const d = new Date();
    const stamp = d.toISOString().slice(0, 10);
    a.href = url;
    a.download = "notes-sauvegarde-" + stamp + ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("Sauvegarde exportée");
  }

  function importNotes(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || !Array.isArray(parsed.folders) || !Array.isArray(parsed.notes)) {
          toast("Fichier de sauvegarde invalide");
          return;
        }
        if (!window.confirm("Remplacer toutes vos notes actuelles par cette sauvegarde ?")) return;
        state = Object.assign({ theme: state.theme }, parsed);
        metaCache.clear();
        persist();
        renderFolders();
        openFolders();
        toast("Sauvegarde importée");
      } catch (e) {
        toast("Impossible de lire le fichier");
      }
    };
    reader.readAsText(file);
  }

  async function shareNote(id) {
    const n = getNote(id);
    if (!n) return;
    const m = noteMeta(n);
    const text = htmlToText(n.body);
    if (navigator.share) {
      try {
        await navigator.share({ title: m.title || "Note", text });
        return;
      } catch (e) {
        if (e && e.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      toast("Note copiée dans le presse-papier");
    } catch (e) {
      toast("Partage non disponible");
    }
  }

  /* ----------------------------- Thème ----------------------------------- */
  const THEMES = ["auto", "light", "dark"];
  const THEME_LABELS = { auto: "Automatique", light: "Clair", dark: "Sombre" };
  function applyTheme() {
    if (state.theme === "auto") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", state.theme);
    const lbl = el("#theme-label");
    if (lbl) lbl.textContent = "Apparence : " + THEME_LABELS[state.theme];
  }
  function cycleTheme() {
    const i = THEMES.indexOf(state.theme);
    state.theme = THEMES[(i + 1) % THEMES.length];
    applyTheme();
    persist();
    toast("Apparence : " + THEME_LABELS[state.theme]);
  }

  /* ----------------------------- Écouteurs ------------------------------- */
  function bindEvents() {
    // Dossiers
    el("#new-folder-btn").addEventListener("click", newFolder);
    el("#folders-edit-btn").addEventListener("click", () => {
      foldersEditing = !foldersEditing;
      el("#folders-edit-btn").textContent = foldersEditing ? "OK" : "Modifier";
      renderFolders();
    });
    const settingsBtn = el("#settings-btn");
    if (settingsBtn) settingsBtn.addEventListener("click", () => showSheet("settings-menu"));

    // Notes
    el("#notes-back-btn").addEventListener("click", goBack);
    el("#compose-btn").addEventListener("click", () => {
      if (selectionMode) deleteSelected();
      else newNote();
    });
    el("#notes-edit-btn").addEventListener("click", toggleSelectionMode);

    const search = el("#search-input");
    search.addEventListener("input", () => {
      el("#search-clear").hidden = !search.value;
      renderNotesList();
    });
    el("#search-clear").addEventListener("click", () => {
      search.value = "";
      el("#search-clear").hidden = true;
      renderNotesList();
      search.focus();
    });

    // Éditeur
    el("#editor-back-btn").addEventListener("click", goBack);
    el("#pin-btn").addEventListener("click", () => {
      const n = getNote(nav.noteId);
      if (!n) return;
      n.pinned = !n.pinned;
      n.updatedAt = Date.now();
      persist();
      updatePinButton(n);
      toast(n.pinned ? "Note épinglée" : "Note désépinglée");
    });
    el("#menu-btn").addEventListener("click", () => showSheet("action-menu"));
    el("#editor-done-btn").addEventListener("click", () => editor.blur());

    editor.addEventListener("input", scheduleSave);
    editor.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) handleEditorEnter(e);
    });
    editor.addEventListener("click", (e) => {
      const box = e.target.closest(".cl-box");
      if (box) {
        const item = box.closest(".cl-item");
        item.setAttribute("data-checked", item.getAttribute("data-checked") === "true" ? "false" : "true");
        scheduleSave();
      }
    });
    document.addEventListener("selectionchange", () => {
      if (nav.depth === 2 && !openSheet) refreshFormatState();
    });
    editor.addEventListener("focus", () => {
      el("#format-bar").hidden = false;
      el("#editor-done-btn").hidden = false;
      el("#menu-btn").parentNode && (el("#menu-btn").style.display = "");
    });
    editor.addEventListener("blur", () => {
      setTimeout(() => {
        if (document.activeElement !== editor) {
          el("#format-bar").hidden = true;
          el("#editor-done-btn").hidden = true;
        }
      }, 120);
    });

    // Barre de format + feuille de format : empêcher la perte du curseur
    document.querySelectorAll(".format-bar, .sheet--format").forEach((bar) => {
      bar.addEventListener("pointerdown", (e) => {
        if (e.target.closest("button")) e.preventDefault();
      });
    });

    bindFormatButtons(el("#format-bar"));
    bindFormatButtons(el("#format-sheet"));

    // Feuille de format : styles de blocs
    el("#format-sheet").querySelectorAll(".format-style").forEach((b) => {
      b.addEventListener("click", () => {
        const map = { title: "H1", heading: "H2", body: "DIV" };
        setBlock(map[b.dataset.style]);
      });
    });

    // Menu d'actions sur la note
    el("#action-menu").querySelectorAll(".menu-item").forEach((b) => {
      b.addEventListener("click", () => {
        const a = b.dataset.action;
        closeSheet();
        if (a === "share") shareNote(nav.noteId);
        else if (a === "duplicate") duplicateNote(nav.noteId);
        else if (a === "delete") {
          if (window.confirm("Supprimer cette note ?")) deleteNote(nav.noteId);
        }
      });
    });

    // Menu réglages
    el("#settings-menu").querySelectorAll(".menu-item").forEach((b) => {
      b.addEventListener("click", () => {
        const a = b.dataset.action;
        if (a === "export") {
          closeSheet();
          exportNotes();
        } else if (a === "import") {
          closeSheet();
          el("#import-file").click();
        } else if (a === "theme") {
          cycleTheme();
        } else closeSheet();
      });
    });
    el("#import-file").addEventListener("change", (e) => {
      const f = e.target.files && e.target.files[0];
      if (f) importNotes(f);
      e.target.value = "";
    });

    // Backdrop
    backdrop.addEventListener("click", closeSheet);

    // Fermer une ligne ouverte si on touche ailleurs
    document.addEventListener(
      "pointerdown",
      (e) => {
        if (openInner && !e.target.closest(".note-row")) closeOpenRow();
      },
      true
    );

    // Ombre sous la barre de navigation au scroll
    setupScrollShadow(el("#folders-scroll"), el(".screen-folders .nav"));
    setupScrollShadow(el("#notes-scroll"), el(".screen-notes .nav"));
    setupScrollShadow(el("#editor-scroll"), el(".screen-editor .nav"));

    // Sauvegarde de sécurité quand l'app passe en arrière-plan
    window.addEventListener("pagehide", saveCurrentNote);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") saveCurrentNote();
    });
  }

  function bindFormatButtons(container) {
    container.querySelectorAll("[data-cmd]").forEach((b) => {
      b.addEventListener("click", () => {
        const cmd = b.dataset.cmd;
        if (cmd === "format-sheet") showSheet("format-sheet");
        else if (cmd === "keyboard-done") editor.blur();
        else if (cmd === "checklist") toggleChecklist();
        else if (cmd === "bulleted") exec("insertUnorderedList");
        else if (cmd === "numbered") exec("insertOrderedList");
        else exec(cmd);
      });
    });
  }

  function setupScrollShadow(scroller, navEl) {
    if (!scroller || !navEl) return;
    scroller.addEventListener(
      "scroll",
      () => {
        navEl.classList.toggle("is-scrolled", scroller.scrollTop > 2);
      },
      { passive: true }
    );
  }

  /* ----------------------------- Service worker -------------------------- */
  function registerSW() {
    if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("service-worker.js").catch(() => {});
      });
    }
  }

  /* ----------------------------- Initialisation -------------------------- */
  function init() {
    paintIcons(document);
    const vEl = el("#app-version");
    if (vEl) vEl.textContent = "Version " + APP_VERSION;
    load();
    applyTheme();
    renderFolders();
    setDepth(0);
    bindEvents();
    registerSW();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
