document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const eventId = params.get("id");
  const host = qs("[data-event-details]");

  if (!eventId) {
    host.innerHTML = "<p>Event ID is missing.</p>";
    return;
  }

  function startCountdown(dateTime) {
    const countdown = qs("[data-countdown]");
    const tick = () => {
      const diff = new Date(dateTime).getTime() - Date.now();
      if (diff <= 0) {
        countdown.innerHTML = "<span>Live</span>";
        return;
      }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      countdown.innerHTML = [days, hours, minutes, seconds]
        .map((value) => `<span>${String(value).padStart(2, "0")}</span>`)
        .join("");
    };
    tick();
    setInterval(tick, 1000);
  }

  try {
    const event = await request(`/events/${eventId}`);
    host.innerHTML = `
      <div>
        <img src="${event.image_url}" alt="${event.title}">
        <p class="eyebrow">${event.category}</p>
        <h1>${event.title}</h1>
        <p>${event.description}</p>
        <div class="meta">
          <span>${event.venue}</span>
          <span>${event.location}</span>
          <span>${niceDate(event.event_date)} at ${event.event_time.slice(0, 5)}</span>
        </div>
      </div>
      <aside class="card side-panel">
        <p class="eyebrow">Event starts in</p>
        <div class="countdown" data-countdown></div>
        <h2>${money(event.price)}</h2>
        <p>${event.available_seats} seats available</p>
        <form class="form-stack" data-booking-form>
          <input class="input" type="number" name="tickets" min="1" max="${event.available_seats}" value="1" required>
          <button class="btn btn-primary" type="submit">Confirm Booking</button>
        </form>
      </aside>
    `;

    startCountdown(`${event.event_date.slice(0, 10)}T${event.event_time}`);

    qs("[data-booking-form]").addEventListener("submit", async (submitEvent) => {
      submitEvent.preventDefault();
      if (!getSession().token) {
        toast("Please login before booking.", "error");
        setTimeout(() => (window.location.href = "/login"), 700);
        return;
      }

      try {
        const tickets = Number(new FormData(submitEvent.target).get("tickets"));
        const result = await request("/bookings", {
          method: "POST",
          body: JSON.stringify({ eventId, tickets })
        });
        toast(`${result.message}. Code: ${result.booking.confirmation_code}`);
        setTimeout(() => (window.location.href = "/dashboard"), 1000);
      } catch (error) {
        toast(error.message, "error");
      }
    });
  } catch (error) {
    host.innerHTML = "";
    toast(error.message, "error");
  }
});
