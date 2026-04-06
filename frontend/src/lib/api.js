// const API_BASE_URL = 'http://localhost:3001';
const API_BASE_URL = 'https://hottake-8bpp.onrender.com';

async function handleJsonResponse(response){
    let data = null;

    try {
        data = await response.json();
    }catch{
        data = null;
    }
    if(!response.ok){
        const error = new error(
            data?.message || 'Something went wrong. Please try again.'
        );
        error.status = response.status;
        error.data = data;
        throw error;
    }

    return data;
}

export async function registerUser({ username, email, password }){
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'Post',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
            username,
            email,
            password,
        }),
    });

    return handleJsonResponse(response);
}