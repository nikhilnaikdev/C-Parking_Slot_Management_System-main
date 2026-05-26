document.addEventListener("DOMContentLoaded", () => {
  qs("[data-contact-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.target));
    try {
      const result = await request("/contact", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      event.target.reset();
      toast(result.message);
    } catch (error) {
      toast(error.message, "error");
    }
  });
});
