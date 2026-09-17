const API_URL = process.env.NEXT_PUBLIC_API_BASE;
const BASE_URL = API_URL.replace('/api', '');

export const getDocUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${BASE_URL}${path}`;
};
