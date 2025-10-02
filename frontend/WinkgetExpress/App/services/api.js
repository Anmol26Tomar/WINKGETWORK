// Mock API service: simulates network calls with setTimeout

const simulateNetwork = (data, delay = 1200) =>
	new Promise((resolve) => setTimeout(() => resolve({ success: true, data }), delay));

export const sendLocalParcel = async (payload) => simulateNetwork(payload);

export const bookTruck = async (payload) => simulateNetwork(payload);

export const sendAllIndiaParcel = async (payload) => simulateNetwork(payload);

export const bookCab = async (payload) => simulateNetwork(payload);

export const bookBikeRide = async (payload) => simulateNetwork(payload);

export const requestPackersMovers = async (payload) => simulateNetwork(payload);


