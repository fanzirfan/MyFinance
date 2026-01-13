export interface ParsedTransaction {
    amount: number;
    wallet: string; // Source wallet or Target wallet for check balance
    to_wallet?: string; // Target wallet (for transfers)
    category: string;
    type: 'income' | 'expense' | 'transfer' | 'check_balance';
    note: string | null;
}

export interface GeminiResponse {
    success: boolean;
    data?: ParsedTransaction;
    error?: string;
}

const GEMINI_API = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export async function parseTransaction(message: string, walletNames: string[], categoryNames: string[] = []): Promise<GeminiResponse> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return { success: false, error: 'No API key' };
    }

    const walletList = walletNames.length > 0 ? walletNames.join(', ') : 'BCA, Mandiri, GoPay, OVO, Dana, Jago';
    const categoryList = categoryNames.length > 0 ? categoryNames.join(', ') : 'Makan, Transport, Belanja, Gaji, Tagihan, Hiburan, Lainnya';

    const prompt = `Parse request user: "${message}"

Wallet TERSEDIA: ${walletList}
Kategori TERSEDIA: ${categoryList}

ATURAN:
- wallet: 
  - Jika transaksi/transfer: Pilih dari daftar (source).
  - Jika cek saldo: Pilih wallet yang ingin dicek. Jika tidak sebut wallet, kosongkan.
- to_wallet: Jika transfer antar wallet, isi dengan wallet TUJUAN.
- category: Pilih dari daftar untuk transaksi. Kosongkan jika cek saldo.
  - Langganan/subscription → Tagihan
  - Gajian → Gaji
  - Makan/kuliner → Makanan atau Makan
  - Transfer masuk/terima uang → Transfer Masuk
  - Transfer keluar/kirim uang -> Transfer Keluar
- type: 
  - "transfer" jika ada kata "transfer" DAN menyebutkan 2 wallet (asal & tujuan).
  - "check_balance" jika tanya "saldo", "cek saldo", "sisa uang", "uang di [wallet]".
  - "income" jika gaji/gajian/terima/masuk/bonus/transfer masuk (cuma 1 wallet).
  - "expense" untuk pengeluaran biasa.

Output JSON: {"amount":number,"wallet":"","to_wallet":"","category":"","type":"expense|income|transfer|check_balance","note":""}
Konversi: rb/k=ribu, jt=juta. Amount 0 jika cek saldo.

HANYA JSON, tanpa penjelasan.`;

    try {
        const res = await fetch(`${GEMINI_API}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0, maxOutputTokens: 1024 }
            }),
        });

        const json = await res.json();

        if (!res.ok) {
            return { success: false, error: `API ${res.status}` };
        }

        // Get all text from all parts
        const parts = json.candidates?.[0]?.content?.parts || [];
        let fullText = '';
        for (const part of parts) {
            if (part.text) fullText += part.text;
        }

        if (!fullText) {
            return { success: false, error: 'Empty' };
        }

        // Clean markdown
        fullText = fullText.replace(/```json\s*/gi, '').replace(/```/g, '').trim();

        // Extract JSON using indexOf
        const start = fullText.indexOf('{');
        const end = fullText.lastIndexOf('}');

        if (start === -1 || end === -1 || end <= start) {
            return { success: false, error: `NoJSON: ${fullText.substring(0, 50)}` };
        }

        const jsonStr = fullText.substring(start, end + 1);
        const parsed = JSON.parse(jsonStr) as ParsedTransaction;

        if (parsed.type === 'check_balance') {
            return { success: true, data: parsed };
        }

        if (!parsed.amount) {
            return { success: false, error: 'No amount' };
        }

        return { success: true, data: parsed };
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return { success: false, error: msg.substring(0, 40) };
    }
}



