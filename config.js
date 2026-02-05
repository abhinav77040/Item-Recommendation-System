// Configure Tailwind to use the 'Inter' font family
tailwind.config = {
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            // Add line-clamp plugin for multi-line truncation
        },
    },
}
