document.addEventListener("DOMContentLoaded", () => {
  const loginForm = qs("[data-login-form]");
  const registerForm = qs("[data-register-form]");
  const adminLoginForm = qs("[data-admin-login-form]");

  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(loginForm));
    try {
      const data = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setSession({ token: data.token, role: "user", name: data.user.name });
      window.location.href = "/dashboard";
    } catch (error) {
      toast(error.message, "error");
    }
  });

  registerForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(registerForm));
    try {
      const data = await request("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setSession({ token: data.token, role: "user", name: data.user.name });
      window.location.href = "/dashboard";
    } catch (error) {
      toast(error.message, "error");
    }
  });

  adminLoginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(adminLoginForm));
    try {
      const data = await request("/auth/admin/login", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setSession({ token: data.token, role: "admin", name: data.admin.name });
      window.location.href = "/admin";
    } catch (error) {
      toast(error.message, "error");
    }
  });
});
