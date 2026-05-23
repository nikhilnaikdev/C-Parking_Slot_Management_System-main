setTimeout(() => {
  if (!window.bootstrap) {
    return;
  }

  document.querySelectorAll(".alert").forEach((alertBox) => {
    const alert = bootstrap.Alert.getOrCreateInstance(alertBox);
    alert.close();
  });
}, 4000);
