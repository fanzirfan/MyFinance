const TELEGRAM_API = 'https://api.telegram.org/bot';

export async function sendMessage(chatId: number, text: string): Promise<boolean> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
        console.error('TELEGRAM_BOT_TOKEN not configured');
        return false;
    }

    try {
        const response = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: 'HTML',
            }),
        });

        const data = await response.json();
        return data.ok === true;
    } catch (error) {
        console.error('Failed to send Telegram message:', error);
        return false;
    }
}

export async function setWebhook(webhookUrl: string): Promise<boolean> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

    if (!token) {
        console.error('TELEGRAM_BOT_TOKEN not configured');
        return false;
    }

    try {
        const response = await fetch(`${TELEGRAM_API}${token}/setWebhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: webhookUrl,
                secret_token: secret,
                allowed_updates: ['message'],
            }),
        });

        const data = await response.json();
        return data.ok === true;
    } catch (error) {
        console.error('Failed to set webhook:', error);
        return false;
    }
}

export async function deleteWebhook(): Promise<boolean> {
    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
        console.error('TELEGRAM_BOT_TOKEN not configured');
        return false;
    }

    try {
        const response = await fetch(`${TELEGRAM_API}${token}/deleteWebhook`, {
            method: 'POST',
        });

        const data = await response.json();
        return data.ok === true;
    } catch (error) {
        console.error('Failed to delete webhook:', error);
        return false;
    }
}

// Telegram message types
export interface TelegramUser {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
}

export interface TelegramMessage {
    message_id: number;
    from: TelegramUser;
    chat: {
        id: number;
        type: string;
    };
    date: number;
    text?: string;
}

export interface TelegramUpdate {
    update_id: number;
    message?: TelegramMessage;
}
