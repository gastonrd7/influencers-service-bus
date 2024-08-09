export const getCircularReplacer = () => {
    const seen = new WeakSet();
    return (key, value) => {
        if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
                return;
            }
            seen.add(value);
        }
        if (key === 'tracingHeaders' && value !== null && value._currentContext) {
            const span = value._currentContext.get(Symbol.for('OpenTelemetry Context Key SPAN'));
            if (span && span.constructor.name === 'Span') {
                return { ...value, _currentContext: '[Span]' }; // Representar el Span sin eliminarlo
            }
        }
        return value;
    };
}