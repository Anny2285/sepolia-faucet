import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider(process.env.INFURA_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const sent = new Set();

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { address } = req.body;
  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;

  if (sent.has(ip)) return res.status(429).json({ error: "One request per 12 hours per IP" });

  try {
    const tx = await wallet.sendTransaction({
      to: address,
      value: ethers.parseEther("0.2")
    });
    sent.add(ip);
    setTimeout(() => sent.delete(ip), 12 * 3600 * 1000);

    res.status(200).json({ success: true, hash: tx.hash });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
