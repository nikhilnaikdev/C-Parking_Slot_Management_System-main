document.addEventListener("DOMContentLoaded", async () => {
  const session = getSession();
  if (!session.token || session.role !== "admin") {
    qs("[data-admin-content]").classList.add("hidden");
    qs("[data-admin-login]").classList.remove("hidden");
    return;
  }

  async function loadStats() {
    const stats = await request("/admin/stats");
    qs("[data-stats]").innerHTML = `
      <div class="card stat"><span>Users</span><strong>${stats.users}</strong></div>
      <div class="card stat"><span>Events</span><strong>${stats.events}</strong></div>
      <div class="card stat"><span>Bookings</span><strong>${stats.bookings}</strong></div>
      <div class="card stat"><span>Revenue</span><strong>${money(stats.revenue)}</strong></div>
    `;
  }

  async function loadEvents() {
    const events = await request("/events");
    qs("[data-admin-events]").innerHTML = events
      .map(
        (event) => `
        <tr>
          <td>${event.title}</td>
          <td>${event.category}</td>
          <td>${niceDate(event.event_date)}</td>
          <td>${money(event.price)}</td>
          <td>${event.available_seats}/${event.total_seats}</td>
          <td>
            <button class="btn btn-ghost" data-edit-event="${event.id}">Edit</button>
            <button class="btn btn-danger" data-delete-event="${event.id}">Delete</button>
          </td>
        </tr>`
      )
      .join("");

    qsa("[data-edit-event]").forEach((button) => {
      button.addEventListener("click", () => {
        const event = events.find((item) => String(item.id) === String(button.dataset.editEvent));
        const form = qs("[data-event-form]");
        form.dataset.editing = event.id;
        qsa("input, textarea", form).forEach((field) => {
          if (field.name === "is_featured") {
            field.checked = Boolean(event.is_featured);
          } else if (field.name === "event_date") {
            field.value = event.event_date.slice(0, 10);
          } else if (field.name && event[field.name] !== undefined) {
            field.value = event[field.name];
          }
        });
        qs("[data-event-form-title]").textContent = "Edit Event";
        qs("[data-event-submit]").textContent = "Save Changes";
        qs("[data-event-reset]").classList.remove("hidden");
        window.scrollTo({ top: qs("[data-event-form]").offsetTop - 120, behavior: "smooth" });
      });
    });

    qsa("[data-delete-event]").forEach((button) => {
      button.addEventListener("click", async () => {
        try {
          await request(`/events/${button.dataset.deleteEvent}`, { method: "DELETE" });
          toast("Event deleted");
          await loadEvents();
          await loadStats();
        } catch (error) {
          toast(error.message, "error");
        }
      });
    });
  }

  async function loadUsersAndBookings() {
    const [users, bookings] = await Promise.all([request("/admin/users"), request("/admin/bookings")]);
    qs("[data-admin-users]").innerHTML = users
      .map((user) => `<tr><td>${user.name}</td><td>${user.email}</td><td>${user.phone || "-"}</td></tr>`)
      .join("");
    qs("[data-admin-bookings]").innerHTML = bookings
      .map(
        (booking) => `
        <tr>
          <td>${booking.confirmation_code}</td>
          <td>${booking.user_name}</td>
          <td>${booking.event_title}</td>
          <td>${booking.status}</td>
          <td>${money(booking.total_price)}</td>
        </tr>`
      )
      .join("");
  }

  qs("[data-event-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.target));
    payload.is_featured = Boolean(payload.is_featured);
    payload.total_seats = Number(payload.total_seats);
    payload.available_seats = Number(payload.available_seats || payload.total_seats);
    payload.price = Number(payload.price);

    try {
      const editingId = event.target.dataset.editing;
      await request(editingId ? `/events/${editingId}` : "/events", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(payload)
      });
      event.target.reset();
      delete event.target.dataset.editing;
      qs("[data-event-form-title]").textContent = "Add New Event";
      qs("[data-event-submit]").textContent = "Create Event";
      qs("[data-event-reset]").classList.add("hidden");
      toast(editingId ? "Event updated" : "Event created");
      await loadEvents();
      await loadStats();
    } catch (error) {
      toast(error.message, "error");
    }
  });

  qs("[data-event-reset]").addEventListener("click", () => {
    const form = qs("[data-event-form]");
    form.reset();
    delete form.dataset.editing;
    qs("[data-event-form-title]").textContent = "Add New Event";
    qs("[data-event-submit]").textContent = "Create Event";
    qs("[data-event-reset]").classList.add("hidden");
  });

  try {
    await Promise.all([loadStats(), loadEvents(), loadUsersAndBookings()]);
  } catch (error) {
    toast(error.message, "error");
  }
});
