const API = "/api";

const qs = (selector, scope = document) => scope.querySelector(selector);
const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];

function getSession() {
  return {
    token: localStorage.getItem("eventpro_token"),
    role: localStorage.getItem("eventpro_role"),
    name: localStorage.getItem("eventpro_name")
  };
}

function setSession({ token, role, name }) {
  localStorage.setItem("eventpro_token", token);
  localStorage.setItem("eventpro_role", role);
  localStorage.setItem("eventpro_name", name || "EventPro user");
}

function clearSession() {
  localStorage.removeItem("eventpro_token");
  localStorage.removeItem("eventpro_role");
  localStorage.removeItem("eventpro_name");
}

async function request(path, options = {}) {
  const { token } = getSession();
  const response = await fetch(`${API}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }
  return data;
}

function toast(message, type = "info") {
  const existing = qs(".toast");
  if (existing) existing.remove();

  const node = document.createElement("div");
  node.className = "toast";
  node.style.borderColor = type === "error" ? "rgba(255,107,107,.45)" : "rgba(212,175,55,.38)";
  node.textContent = message;
  document.body.appendChild(node);
  setTimeout(() => node.remove(), 3600);
}

function money(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

function niceDate(value) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function eventCard(event) {
  return `
    <article class="card event-card">
      <img src="${event.image_url}" alt="${event.title}">
      <div class="card-body">
        <p class="eyebrow">${event.category}</p>
        <h3>${event.title}</h3>
        <div class="meta">
          <span>${niceDate(event.event_date)}</span>
          <span>${event.location}</span>
          <span class="price">${money(event.price)}</span>
        </div>
        <p>${event.description.slice(0, 115)}...</p>
        <a class="btn btn-primary" href="/event-details?id=${event.id}">Book Event</a>
      </div>
    </article>
  `;
}

function wireNavbar() {
  const menuBtn = qs("[data-menu]");
  const links = qs("[data-nav-links]");
  if (menuBtn && links) {
    menuBtn.addEventListener("click", () => links.classList.toggle("open"));
  }

  const { token, role, name } = getSession();
  const authArea = qs("[data-auth-area]");
  if (!authArea) return;

  if (token) {
    authArea.innerHTML = `
      <a class="btn btn-ghost" href="${role === "admin" ? "/admin" : "/dashboard"}">${name}</a>
      <button class="btn btn-primary" data-logout>Logout</button>
    `;
    qs("[data-logout]").addEventListener("click", () => {
      clearSession();
      toast("Logged out successfully");
      setTimeout(() => (window.location.href = "/"), 500);
    });
  } else {
    authArea.innerHTML = `
      <a class="btn btn-ghost" href="/login">Login</a>
      <a class="btn btn-primary" href="/register">Sign Up</a>
    `;
  }
}

document.addEventListener("DOMContentLoaded", wireNavbar);
