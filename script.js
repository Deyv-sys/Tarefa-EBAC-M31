"use strict";

const STORAGE_KEY = "diario-de-bordo.entries.v1";
const form = document.querySelector("#entry-form");
const titleInput = document.querySelector("#entry-title");
const descriptionInput = document.querySelector("#entry-description");
const dateInput = document.querySelector("#entry-date");
const entriesList = document.querySelector("#entries-list");
const entryCount = document.querySelector("#entry-count");
const storageMessage = document.querySelector("#storage-message");
const installButton = document.querySelector("#install-button");

let entries = [];
let storageAvailable = true;
let installPrompt = null;

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function setStorageMessage(message, isError = false) {
  storageMessage.textContent = message;
  storageMessage.classList.toggle("error", isError);
}

function readEntries() {
  try {
    const savedEntries = localStorage.getItem(STORAGE_KEY);
    if (savedEntries === null) return [];

    const parsedEntries = JSON.parse(savedEntries);
    if (!Array.isArray(parsedEntries) || parsedEntries.some((entry) =>
      !entry || typeof entry.id !== "string" ||
      typeof entry.title !== "string" ||
      typeof entry.description !== "string" ||
      typeof entry.date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(entry.date) ||
      localDateString(new Date(`${entry.date}T00:00:00`)) !== entry.date
    )) {
      throw new Error("Os dados salvos não estão em um formato válido.");
    }

    return parsedEntries;
  } catch (error) {
    storageAvailable = false;
    form.querySelectorAll("input, textarea, button").forEach((control) => {
      control.disabled = true;
    });
    setStorageMessage(
      `Não foi possível carregar as memórias salvas. Os dados existentes foram preservados. ${error.message}`,
      true
    );
    return [];
  }
}

function saveEntries(nextEntries) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextEntries));
    entries = nextEntries;
    setStorageMessage("Memória salva neste dispositivo.");
    renderEntries();
    return true;
  } catch (error) {
    setStorageMessage(`Não foi possível salvar. Verifique o espaço disponível no navegador. ${error.message}`, true);
    return false;
  }
}

function formatDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function renderEntries() {
  entryCount.textContent = String(entries.length);
  entriesList.replaceChildren();

  if (entries.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";

    const icon = document.createElement("div");
    icon.className = "empty-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "⌁";

    const heading = document.createElement("h3");
    heading.textContent = "Toda jornada começa com um passo.";

    const text = document.createElement("p");
    text.textContent = "Sua primeira memória está esperando para ser guardada.";

    emptyState.append(icon, heading, text);
    entriesList.append(emptyState);
    return;
  }

  const sortedEntries = [...entries].sort((first, second) =>
    second.date.localeCompare(first.date) ||
    (second.createdAt || "").localeCompare(first.createdAt || "")
  );

  sortedEntries.forEach((entry) => {
    const card = document.createElement("article");
    card.className = "entry-card";

    const date = document.createElement("p");
    date.className = "entry-date";
    date.textContent = formatDate(entry.date);

    const title = document.createElement("h3");
    title.className = "entry-title";
    title.textContent = entry.title;

    const description = document.createElement("p");
    description.className = "entry-description";
    description.textContent = entry.description;

    const removeButton = document.createElement("button");
    removeButton.className = "delete-button";
    removeButton.type = "button";
    removeButton.setAttribute("aria-label", `Remover memória: ${entry.title}`);
    removeButton.textContent = "×";
    removeButton.addEventListener("click", () => {
      saveEntries(entries.filter((savedEntry) => savedEntry.id !== entry.id));
    });

    card.append(date, title, description, removeButton);
    entriesList.append(card);
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!storageAvailable || !form.reportValidity()) return;

  const newEntry = {
    id: crypto.randomUUID(),
    title: titleInput.value.trim(),
    description: descriptionInput.value.trim(),
    date: dateInput.value,
    createdAt: new Date().toISOString()
  };

  if (!newEntry.title || !newEntry.description || !newEntry.date) {
    setStorageMessage("Preencha todos os campos antes de guardar a memória.", true);
    return;
  }

  if (saveEntries([...entries, newEntry])) {
    form.reset();
    dateInput.value = localDateString();
    titleInput.focus();
  }
});

function isAppInstalled() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
  installButton.hidden = isAppInstalled();
});

installButton.addEventListener("click", async () => {
  if (!installPrompt) return;

  try {
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    installButton.hidden = true;
  } catch (error) {
    setStorageMessage(`Não foi possível iniciar a instalação. ${error.message}`, true);
  }
});

window.addEventListener("appinstalled", () => {
  installPrompt = null;
  installButton.hidden = true;
  setStorageMessage("Diário de Bordo instalado com sucesso.");
});

dateInput.value = localDateString();
entries = readEntries();
renderEntries();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch((error) => {
      setStorageMessage(`Não foi possível ativar o modo offline. ${error.message}`, true);
    });
  });
}
