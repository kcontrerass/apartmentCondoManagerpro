console.log('Checking environment variables...');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
if (process.env.DATABASE_URL) {
    const url = process.env.DATABASE_URL;
    // Print first 10 and last 10 characters to avoid leaking full credentials if possible, 
    // but enough to identify the host/type.
    console.log('DATABASE_URL starts with:', url.substring(0, 15));
    console.log('DATABASE_URL ends with:', url.substring(url.length - 15));
} else {
    console.log('DATABASE_URL is NOT set in this environment.');
}
