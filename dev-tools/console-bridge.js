(function() {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;
    
    function sendToTerminal(level, args) {
        const logData = {
            level,
            message: args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' '),
            timestamp: Date.now(),
            url: window.location.href
        };
        
        // Send via fetch to terminal server
        fetch('/api/console-log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(logData)
        }).catch(() => {}); // Fail silently if server not available
    }
    
    console.log = function(...args) {
        originalLog.apply(console, args);
        sendToTerminal('log', args);
    };
    
    console.error = function(...args) {
        originalError.apply(console, args);
        sendToTerminal('error', args);
    };
    
    console.warn = function(...args) {
        originalWarn.apply(console, args);
        sendToTerminal('warn', args);
    };
    
    console.info = function(...args) {
        originalInfo.apply(console, args);
        sendToTerminal('info', args);
    };
    
    // Send initial connection message
    console.log('Console bridge active - logs will stream to terminal');
})();