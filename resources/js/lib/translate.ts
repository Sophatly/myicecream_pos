import { usePage } from '@inertiajs/react';

export function useTranslate() {
    const { translations } = usePage().props as any;

    return (key: string, replacements?: Record<string, string | number>) => {
        let translation = key.split('.').reduce((obj, i) => obj?.[i], translations) as string | undefined;

        if (!translation) {
            return key; // Fallback to key if not found
        }

        if (replacements) {
            Object.keys(replacements).forEach(replacement => {
                translation = translation?.replace(`:${replacement}`, String(replacements[replacement]));
            });
        }

        return translation;
    };
}
