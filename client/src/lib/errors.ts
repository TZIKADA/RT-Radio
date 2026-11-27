export function logAppError(context: string, error: unknown) {
    console.error(`[RT-Radio] ${context}`, error);
}
