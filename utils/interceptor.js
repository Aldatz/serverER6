// Define the interceptor
window.fetch = async (input, init) => {
    try {
        // Request Interception: Modify the request here
        console.log("Intercepted Request:", { input, init });

        // Example: Adding a custom header
        if (!init) init = {};
        init.headers = {
            ...(init.headers || {}),
            'X-Custom-Header': 'MyInterceptor'
        };

        // Optionally log or modify the request URL
        if (typeof input === 'string') {
            console.log(`Requesting URL: ${input}`);
        } else if (input.url) {
            console.log(`Requesting URL: ${input.url}`);
        }

        // Execute the original fetch
        const response = await originalFetch(input, init);

        // Response Interception: Inspect/modify the response
        console.log("Intercepted Response:", response);

        // Example: Clone the response to inspect or modify it
        const clonedResponse = response.clone();
        const responseBody = await clonedResponse.json();
        console.log("Response Body:", responseBody);

        // Return the original response (or modified if needed)
        return response;
    } catch (error) {
        // Error Interception: Handle errors
        console.error("Fetch Error Intercepted:", error);
        throw error;
    }
};