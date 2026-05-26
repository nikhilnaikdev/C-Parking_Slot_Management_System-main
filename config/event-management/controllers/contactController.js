exports.sendMessage = async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: "Please complete all contact fields" });
  }

  // In production, connect this to email, CRM, or a contact_messages table.
  res.status(201).json({ message: "Thanks! The EventPro team will contact you soon." });
};
