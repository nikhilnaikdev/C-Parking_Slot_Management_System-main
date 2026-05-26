document.addEventListener("DOMContentLoaded", async () => {
  const target = qs("[data-featured-events]");
  const search = qs("[data-home-search]");

  try {
    target.innerHTML = '<div class="loader"></div>';
    const events = await request("/events?featured=true&limit=3");
    target.innerHTML = events.map(eventCard).join("");
  } catch (error) {
    target.innerHTML = "";
    toast(error.message, "error");
  }

  search?.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = new FormData(search).get("search");
    window.location.href = `/events?search=${encodeURIComponent(value || "")}`;
  });

  qsa("[data-category]").forEach((item) => {
    item.addEventListener("click", () => {
      window.location.href = `/events?category=${encodeURIComponent(item.dataset.category)}`;
    });
  });
});
