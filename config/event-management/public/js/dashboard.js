document.addEventListener("DOMContentLoaded", async () => {
  if (!getSession().token) {
    window.location.href = "/login";
    return;
  }

  qs("[data-profile-name]").textContent = getSession().name;
  const list = qs("[data-bookings]");

  async function loadBookings() {
    list.innerHTML = '<div class="loader"></div>';
    try {
      const bookings = await request("/bookings/mine");
      list.innerHTML = bookings.length
        ? bookings
            .map(
              (booking) => `
              <article class="card event-card">
                <img src="${booking.image_url}" alt="${booking.title}">
                <div class="card-body">
                  <p class="eyebrow">${booking.confirmation_code}</p>
                  <h3>${booking.title}</h3>
                  <div class="meta">
                    <span>${niceDate(booking.event_date)}</span>
                    <span>${booking.tickets} tickets</span>
                    <span class="price">${money(booking.total_price)}</span>
                    <span>${booking.status}</span>
                  </div>
                  ${
                    booking.status === "confirmed"
                      ? `<button class="btn btn-danger" data-cancel="${booking.id}">Cancel Booking</button>`
                      : ""
                  }
                </div>
              </article>`
            )
            .join("")
        : "<p>You have not booked any events yet.</p>";

      qsa("[data-cancel]").forEach((button) => {
        button.addEventListener("click", async () => {
          try {
            await request(`/bookings/${button.dataset.cancel}/cancel`, { method: "PATCH" });
            toast("Booking cancelled");
            loadBookings();
          } catch (error) {
            toast(error.message, "error");
          }
        });
      });
    } catch (error) {
      list.innerHTML = "";
      toast(error.message, "error");
    }
  }

  await loadBookings();
});
