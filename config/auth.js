function requireCustomer(req, res, next) {
  if (!req.session.customer) {
    req.session.error = "Please login as customer first.";
    return res.redirect("/login");
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.admin) {
    req.session.error = "Please login as admin first.";
    return res.redirect("/admin/login");
  }
  next();
}

module.exports = {
  requireCustomer,
  requireAdmin
};
