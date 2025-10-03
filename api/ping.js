// api/ping.js
export default function handler(req, res) {
  res.status(200).json({ ok: true, time: new Date().toISOString() });
}

// If your project is not ESM and the above fails, uncomment this instead:
// module.exports = (req, res) => {
//   res.status(200).json({ ok: true, time: new Date().toISOString() });
// };
