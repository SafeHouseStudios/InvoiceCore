// frontend/src/lib/api.ts
import axios from 'axios';

// Create a configured instance of Axios
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Points to your Node.js backend
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;