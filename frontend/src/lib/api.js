import axios from 'axios';

class ApiClient {
    constructor() {
        this.instance = axios.create({
            baseURL: process.env.NEXT_PUBLIC_API_URL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
            withCredentials: true,
        });

        this.setupInterceptors();
    }

    setupInterceptors() {
        // Request interceptor to add auth token
        this.instance.interceptors.request.use(
            (config) => {
                const token = this.getToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Response interceptor for error handling
        this.instance.interceptors.response.use(
            (response) => {
                return response;
            },
            (error) => {
                if (error.response?.status === 401) {
                    // Token expired or invalid
                    this.removeToken();
                    if (typeof window !== 'undefined') {
                        window.location.href = '/login';
                    }
                }
                return Promise.reject(error);
            }
        );
    }

    getToken() {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('token');
        }
        return null;
    }

    setToken(token) {
        if (typeof window !== 'undefined') {
            localStorage.setItem('token', token);
        }
    }

    removeToken() {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
        }
    }

    // Auth methods
    async login(email, password) {
        const response = await this.instance.post('/auth/login', { email, password });
        if (response.data.success && response.data.data.token) {
            this.setToken(response.data.data.token);
        }
        return response.data;
    }

    async register(name, email, password, businessId) {
        const response = await this.instance.post('/auth/register', { name, email, password, businessId });
        if (response.data.success && response.data.data.token) {
            this.setToken(response.data.data.token);
        }
        return response.data;
    }

    async logout() {
        try {
            await this.instance.get('/auth/logout');
        } catch (error) {
            // Continue with logout even if API call fails
            console.error(error);
        } finally {
            this.removeToken();
        }
    }

    async getProfile() {
        const response = await this.instance.get('/auth/profile');
        return response.data;
    }

    // Product methods
    async getProducts(params) {
        const response = await this.instance.get('/products', { params });
        return response.data;
    }

    async getProduct(id) {
        const response = await this.instance.get(`/products/${id}`);
        return response.data;
    }

    async createProduct(data) {
        const response = await this.instance.post('/products', data);
        return response.data;
    }

    async updateProduct(id, data) {
        const response = await this.instance.put(`/products/${id}`, data);
        return response.data;
    }

    async deleteProduct(id) {
        const response = await this.instance.delete(`/products/${id}`);
        return response.data;
    }

    async getCategories() {
        const response = await this.instance.get('/products/categories');
        return response.data;
    }

    async getLowStockProducts() {
        const response = await this.instance.get('/products/low-stock');
        return response.data;
    }

    // Contact methods
    async getContacts(params) {
        const response = await this.instance.get('/contacts', { params });
        return response.data;
    }

    async getContact(id) {
        const response = await this.instance.get(`/contacts/${id}`);
        return response.data;
    }

    async createContact(data) {
        const response = await this.instance.post('/contacts', data);
        return response.data;
    }

    async updateContact(id, data) {
        const response = await this.instance.put(`/contacts/${id}`, data);
        return response.data;
    }

    async deleteContact(id) {
        const response = await this.instance.delete(`/contacts/${id}`);
        return response.data;
    }

    async getCustomers(params) {
        const response = await this.instance.get('/contacts/customers', { params });
        return response.data;
    }

    async getVendors(params) {
        const response = await this.instance.get('/contacts/vendors', { params });
        return response.data;
    }

    // Transaction methods
    async getTransactions(params) {
        const response = await this.instance.get('/transactions', { params });
        return response.data;
    }

    async getTransaction(id) {
        const response = await this.instance.get(`/transactions/${id}`);
        return response.data;
    }

    async createTransaction(data) {
        const response = await this.instance.post('/transactions', data);
        return response.data;
    }

    async getTransactionSummary(params) {
        const response = await this.instance.get('/transactions/summary', { params });
        return response.data;
    }

    async updateTransactionStatus(id, status) {
        const response = await this.instance.patch(`/transactions/${id}/status`, { status });
        return response.data;
    }

    async addTransactionPayment(id, data) {
        const response = await this.instance.post(`/transactions/${id}/payments`, data);
        return response.data;
    }

    async updateTransactionPrintStatus(id, isPrinted = true) {
        const response = await this.instance.patch(`/transactions/${id}/print`, { isPrinted });
        return response.data;
    }

    // Report methods
    async getDashboard() {
        const response = await this.instance.get('/reports/dashboard');
        return response.data;
    }

    async getInventoryReport(params) {
        const response = await this.instance.get('/reports/inventory', { params });
        return response.data;
    }

    async getTransactionReport(params) {
        const response = await this.instance.get('/reports/transactions', { params });
        return response.data;
    }

    async getCustomerReport(id, params) {
        const response = await this.instance.get(`/reports/customer/${id}`, { params });
        return response.data;
    }

    async getVendorReport(id, params) {
        const response = await this.instance.get(`/reports/vendor/${id}`, { params });
        return response.data;
    }
}

export const apiClient = new ApiClient();
export const api = apiClient;
