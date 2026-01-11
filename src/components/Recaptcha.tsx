'use client';

import { useRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

interface RecaptchaProps {
    onChange: (token: string | null) => void;
}

export default function Recaptcha({ onChange }: RecaptchaProps) {
    const recaptchaRef = useRef<ReCAPTCHA>(null);

    // Use test key if environment variable is not set (ONLY FOR DEV)
    // 6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI is Google's standard test site key
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

    return (
        <div className="flex justify-center my-4">
            <div className="overflow-hidden rounded-lg">
                <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey={siteKey}
                    onChange={onChange}
                    theme="dark"
                />
            </div>
        </div>
    );
}
