const USERS_KEY = "foodshare_users";
const FOODS_KEY = "foodshare_foods";
const SESSION_KEY = "foodshare_session";

export const readUsers = () => JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
export const saveUsers = (users) => localStorage.setItem(USERS_KEY, JSON.stringify(users));
export const readFoods = () => JSON.parse(localStorage.getItem(FOODS_KEY) || "[]");
export const saveFoods = (foods) => localStorage.setItem(FOODS_KEY, JSON.stringify(foods));
export const readSession = () => JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
export const saveSession = (user) => localStorage.setItem(SESSION_KEY, JSON.stringify(user));
export const clearSession = () => localStorage.removeItem(SESSION_KEY);

export function seedDemoData() {
  if (!localStorage.getItem(USERS_KEY)) saveUsers([]);
  if (!localStorage.getItem(FOODS_KEY)) saveFoods([]);
}

// Demo-only admin credentials. Client-side credentials are NOT secure for production.
export const ADMIN_USERNAME = "admin";
export const ADMIN_PASSWORD = "Admin@123";