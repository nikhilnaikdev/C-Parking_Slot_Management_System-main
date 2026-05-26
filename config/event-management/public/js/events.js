document.addEventListener("DOMContentLoaded", async () => {
  const grid = qs("[data-events-grid]");
  const form = qs("[data-filter-form]");
  const params = new URLSearchParams(window.location.search);

  if (params.get("search")) qs('[name="search"]').value = params.get("search");
  if (params.get("category")) qs('[name="category"]').value = params.get("category");

  async function loadEvents() {
    const query = new URLSearchParams(new FormData(form)).toString();
    grid.innerHTML = '<div class="loader"></div>';
    try {
      const events = await request(`/events?${query}`);
      grid.innerHTML = events.length
        ? events.map(eventCard).join("")
        : "<p>No events match your search yet.</p>";
    } catch (error) {
      grid.innerHTML = "";
      toast(error.message, "error");
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    loadEvents();
  });

  form.addEventListener("change", loadEvents);
  await loadEvents();
});
