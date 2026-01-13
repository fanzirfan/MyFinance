export interface ParsedTransaction {
    amount: number;
    wallet: string;
    category: string;
    type: 'income' | 'expense';
    note: string | null;
}

export interface GeminiResponse {
    success: boolean;
    data?: ParsedTransaction;
    error?: string;
}

const GEMINI_API = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';

const SYSTEM_PROMPT = `Kamu adalah asisten keuangan yang mengekstrak informasi transaksi dari pesan bahasa Indonesia.

Tugas: Parse pesan pengguna dan ekstrak informasi transaksi dalam format JSON.

Rules:
1. amount: angka dalam Rupiah (konversi k/rb = ribu, jt = juta)
2. wallet: nama dompet/bank/e-wallet yang disebutkan
3. category: kategori transaksi (Makan, Transport, Belanja, Gaji, Transfer, dll)
4. type: "expense" untuk pengeluaran, "income" untuk pemasukan (gaji, terima uang, dll)
5. note: catatan tambahan dari pesan

Contoh:
- "600k BCA buat makan" → {"amount":600000,"wallet":"BCA","category":"Makan","type":"expense","note":"makan"}
- "Gaji masuk 5jt Mandiri" → {"amount":5000000,"wallet":"Mandiri","category":"Gaji","type":"income","note":"gaji masuk"}
- "Transport ojol 15rb GoPay" → {"amount":15000,"wallet":"GoPay","category":"Transport","type":"expense","note":"ojol"}
- "Terima transfer 500k BCA dari teman" → {"amount":500000,"wallet":"BCA","category":"Transfer","type":"income","note":"dari teman"}

PENTING: Balas HANYA dengan JSON valid, tanpa markdown atau teks lain.`;

export async function parseTransaction(message: string, walletNames: string[]): Promise<GeminiResponse> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return { success: false, error: 'GEMINI_API_KEY not configured' };
    }

    const walletContext = walletNames.length > 0
        ? `\n\nDaftar wallet user: ${walletNames.join(', ')}. Gunakan nama wallet yang paling cocok dari daftar ini.`
        : '';

    try {
        const response = await fetch(`${GEMINI_API}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `${SYSTEM_PROMPT}${walletContext}\n\nPesan user: "${message}"`
                    }]
                }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 256,
                }
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API error:', errorText);
            return { success: false, error: 'Gagal memproses pesan' };
        }

        const data = await response.json();
        const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textContent) {
            return { success: false, error: 'Tidak ada respons dari AI' };
        }

        // Clean the response - remove markdown code blocks if present
        let cleanJson = textContent.trim();
        if (cleanJson.startsWith('```')) {
            cleanJson = cleanJson.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
        }

        const parsed = JSON.parse(cleanJson) as ParsedTransaction;

        // Validate required fields
        if (!parsed.amount || !parsed.wallet || !parsed.category || !parsed.type) {
            return { success: false, error: 'Data transaksi tidak lengkap' };
        }

        return { success: true, data: parsed };
    } catch (error) {
        console.error('Failed to parse transaction:', error);
        return { success: false, error: 'Gagal memahami pesan. Coba format: "50rb BCA makan"' };
    }
}
