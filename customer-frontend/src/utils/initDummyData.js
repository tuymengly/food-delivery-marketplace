// Initialize dummy users in localStorage
export const initDummyUsers = () => {
  const existingUsers = localStorage.getItem('users');
  

  // Only initialize if no users exist
  if (!existingUsers) {
    const dummyUsers = [
      {
        id: 1,
        name: 'Demo User',
        email: 'demo@delish.com',
        phone: '+855 12 345 678',
        password: 'demo123',
        createdAt: '2024-01-01T00:00:00.000Z'
      },
      {
        id: 2,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+855 11 222 333',
        password: 'password123',
        createdAt: '2024-01-15T00:00:00.000Z'
      },
      {
        id: 3,
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+855 99 888 777',
        password: 'password123',
        createdAt: '2024-02-01T00:00:00.000Z'
      }
    ];

    localStorage.setItem('users', JSON.stringify(dummyUsers));
    console.log('✅ Dummy users initialized in localStorage');
  }
};


// Check if user is logged in
export const isAuthenticated = () => {
  return localStorage.getItem('currentUser') !== null;
};


// Get current user
export const getCurrentUser = () => {
  const user = localStorage.getItem('currentUser');
  return user ? JSON.parse(user) : null;
};


// Logout user
export const logout = () => {
  localStorage.removeItem('currentUser');
};

